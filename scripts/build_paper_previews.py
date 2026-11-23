"""Build the preview images shown next to each paper.

Every preview comes from the paper's own public figure: the arXiv source for
preprints, journal figures and supporting information, and the official ISMRM
abstract preview. Downloads are cached in .runtime/paper-previews/ (not in Git);
the finished WebP files go to frontend/public/papers/.

Needs PyMuPDF and Pillow (backend/requirements-dev.txt).

    .venv/bin/python scripts/build_paper_previews.py            # all papers
    .venv/bin/python scripts/build_paper_previews.py trace      # one paper
"""
from __future__ import annotations

import argparse
import html
import re
import tarfile
import urllib.request
from pathlib import Path

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.runtime' / 'paper-previews'
OUTPUT = ROOT / 'frontend' / 'public' / 'papers'
MAX_SIDE = 1800  # longest side; the site shows every figure whole in a 2:1 frame
USER_AGENT = 'Mozilla/5.0 (compatible; chuhongkang.com preview builder)'

# crop: (left, top, right, bottom) as fractions of the source figure. Previews keep
# the figure's own aspect ratio; the page frames them, so nothing is padded or stretched.
PREVIEWS = {
    'medcaseagent': {'arxiv': '2610.32258', 'member': 'figures/medcaseagent_teaser.pdf',
                     'crop': (0.232, 0.0, 1.0, 1.0)},
    'trace': {'figure_url': 'https://arxiv.org/html/2609.25775v1/pipline.png',
              'output': 'trace-fig2.webp'},
    'clueaegis': {'arxiv': '2605.25009', 'member': 'pipline.pdf', 'crop': (0.0, 0.0, 1.0, 1.0)},
    # Graphical abstract, CC BY-NC-ND 4.0: shown whole, only resized.
    'mrl-cyclegan': {'pmc': 'PMC13352062', 'image': 'ga1.jpg', 'crop': (0.0, 0.0, 1.0, 1.0)},
    'ismrm-2026': {'ismrm': 'https://echo.ismrm.org/abstracts/view/10bb0030-3870-418c-9ecf-a19a838645a1',
                   'crop': (0.0, 0.0, 1.0, 1.0)},
    # Figure S3 on page 4 of the ACS Supporting Information, CC BY-NC 4.0.
    'jpcl-phase-correction': {
        'figure_url': 'https://ndownloader.figshare.com/files/60896718?download=1',
        'page': 4,
        'clip': (94, 245, 499, 453),
        'scale': 4,
        'output': 'jpcl-phase-correction-fig-s3.webp',
    },
    # Figure 5 (classification UMAP), CC BY 4.0.
    'ijms-druggable-proteins': {
        'figure_url': 'https://pub.mdpi-res.com/ijms/ijms-25-04507/article_deploy/html/images/ijms-25-04507-g005.png',
        'output': 'ijms-druggable-proteins-umap.webp',
    },
}


def fetch(url: str, path: Path) -> Path:
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        with urllib.request.urlopen(request, timeout=120) as response:
            path.write_bytes(response.read())
    return path


def full_figure(spec: dict, stem: str) -> Image.Image:
    if 'page' in spec:
        source = fetch(spec['figure_url'], CACHE / f'{stem}.pdf')
        with pymupdf.open(source) as document:
            page = document[spec['page'] - 1]
            scale = spec['scale']
            pixmap = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale),
                clip=pymupdf.Rect(*spec['clip']), alpha=False)
            return Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples)

    source = fetch(spec['figure_url'], CACHE / f'{stem}.png')
    with Image.open(source) as original:
        return original.convert('RGB')


def from_arxiv(spec: dict) -> Image.Image:
    archive = fetch(f"https://arxiv.org/e-print/{spec['arxiv']}", CACHE / f"arxiv-{spec['arxiv']}.tar.gz")
    with tarfile.open(archive) as tar:
        data = tar.extractfile(tar.getmember(spec['member'])).read()
    page = pymupdf.open(stream=data, filetype='pdf')[0]
    zoom = 2600 / page.rect.width
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    return Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples)


def from_pmc(spec: dict) -> Image.Image:
    article = fetch(f"https://pmc.ncbi.nlm.nih.gov/articles/{spec['pmc']}/", CACHE / f"{spec['pmc']}.html").read_text()
    url = re.search(r'https://cdn\.ncbi\.nlm\.nih\.gov/pmc/blobs/[^"\s]+/' + re.escape(spec['image']), article).group(0)
    return Image.open(fetch(url, CACHE / f"{spec['pmc']}-{spec['image']}")).convert('RGB')


def from_ismrm(spec: dict) -> Image.Image:
    target = CACHE / 'ismrm-preview.png'
    if not target.exists():
        request = urllib.request.Request(spec['ismrm'], headers={'User-Agent': USER_AGENT})
        page = urllib.request.urlopen(request, timeout=120).read().decode()
        url = html.unescape(re.search(r'https://ismrmmeetings\.blob\.core\.windows\.net/[^"]+/preview\.png[^"]*', page).group(0))
        fetch(url, target)  # signed URL, valid for about an hour
    image = Image.open(target)
    canvas = Image.new('RGB', image.size, 'white')
    canvas.paste(image, mask=image.getchannel('A') if image.mode == 'RGBA' else None)
    return canvas


def to_preview(image: Image.Image, crop: tuple[float, float, float, float]) -> Image.Image:
    w, h = image.size
    image = image.crop((round(crop[0] * w), round(crop[1] * h), round(crop[2] * w), round(crop[3] * h)))
    image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
    return image


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('ids', nargs='*', help='paper ids (default: all): ' + ', '.join(PREVIEWS))
    args = parser.parse_args()
    if unknown := set(args.ids) - set(PREVIEWS):
        parser.error('unknown paper id: ' + ', '.join(sorted(unknown)))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for paper_id in args.ids or PREVIEWS:
        spec = PREVIEWS[paper_id]
        output = OUTPUT / spec.get('output', f'{paper_id}.webp')
        if 'figure_url' in spec:
            figure = full_figure(spec, output.stem)
            figure.thumbnail((MAX_SIDE, figure.height), Image.Resampling.LANCZOS)
            figure.save(output, 'WEBP', lossless=True, method=6)
        else:
            source = from_arxiv(spec) if 'arxiv' in spec else from_pmc(spec) if 'pmc' in spec else from_ismrm(spec)
            to_preview(source, spec['crop']).save(output, 'WEBP', quality=86, method=6)
        print(f'{output.name}  {output.stat().st_size // 1024} KiB')


if __name__ == '__main__':
    main()
