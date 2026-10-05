"""Prepare the requested reference copy from captured public page content.

The input contains semantic content, not executable scripts or browser sessions.
Images, PDFs, and fonts are copied locally; links retain the reference targets.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import sys
import time
from urllib.parse import urlsplit
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = 'https://www.chenfangcs.com'
capture = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/chenfang-reference')
pages = json.loads((capture / 'pages.json').read_text())
assets: set[str] = {'/CV.pdf', '/resume.pdf', '/tabicon.png'}


def prepare(node):
    if node['kind'] == 'text':
        return node
    attrs = node['attrs']
    if node['tag'] == 'img':
        if attrs.get('src', '').startswith('/'):
            assets.add(attrs['src'])
        for candidate in attrs.get('srcset', '').split(','):
            path = candidate.strip().split(' ')[0]
            if path.startswith('/'):
                assets.add(path)
    href = attrs.get('href', '')
    if href.startswith('/') and urlsplit(href).path.endswith('.pdf'):
        assets.add(urlsplit(href).path)
    # The feed height depends on the current viewport and is measured by React.
    if 'news-scroll' in attrs.get('class', '').split():
        attrs.pop('style', None)
    node['children'] = [prepare(child) for child in node['children']]
    return node


profile = prepare(pages['/']['profile'])
content = {route: prepare(page['main']) for route, page in pages.items()}
documents = {('resume' if item['label'] == 'Resume' else 'cv'): prepare(item['main'])
             for item in pages['/cv']['documents']}
snapshot = {
    'source': SOURCE + '/', 'captured_at': datetime.now(timezone.utc).isoformat(),
    'name': 'Chen Fang', 'institution': 'University of Illinois Urbana-Champaign',
    'profile': profile,
    'navigation': [{'label': label, 'path': route} for label, route in [
        ('About', '/about'), ('Research', '/researches'), ('Publications', '/publications'),
        ('Teaching', '/teaching'), ('Projects', '/projects'), ('CV', '/cv'), ('Personal', '/talks')]],
    'pages': content, 'documents': documents,
}
directory = ROOT / 'backend' / 'content'
directory.mkdir(exist_ok=True)
(directory / 'reference.json').write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + '\n')


def download(pair):
    url, destination = pair
    destination.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(3):
        try:
            with urlopen(url, timeout=25) as response:
                destination.write_bytes(response.read())
            return destination.relative_to(ROOT).as_posix()
        except Exception:
            if attempt == 2:
                raise RuntimeError(f'Could not download {url}')
            time.sleep(1)


downloads = [(SOURCE + path, ROOT / 'frontend' / 'public' / path.lstrip('/')) for path in sorted(assets)]
font_css = (capture / 'font-modern.css').read_text()
font_urls = sorted(set(re.findall(r'url\((https[^)]+)\)', font_css)))
for url in font_urls:
    file_name = urlsplit(url).path.rsplit('/', 1)[1]
    downloads.append((url, ROOT / 'frontend' / 'public' / 'fonts' / file_name))
    font_css = font_css.replace(url, '/fonts/' + file_name)
(ROOT / 'frontend' / 'src' / 'fonts.css').write_text(font_css)
with ThreadPoolExecutor(max_workers=8) as pool:
    files = list(pool.map(download, downloads))
print(json.dumps({'pages':len(content), 'documents':len(documents), 'local_assets':len(files)}, indent=2))
