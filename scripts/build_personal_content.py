"""Build public site data and documents from the reviewed public profile.

Only public_profile.json feeds these artifacts. Private application materials
and their CV are intentionally not copied into the website.
"""
from __future__ import annotations

import copy
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from backend.reference import ReferenceSite  # noqa: E402


def el(tag: str, *children: dict | str, **attrs: str) -> dict:
    return {
        'kind': 'element', 'tag': tag,
        'attrs': {('class' if k == 'cls' else k.replace('_', '-')): v for k, v in attrs.items()},
        'children': [{'kind': 'text', 'text': c} if isinstance(c, str) else c for c in children],
    }


def external(label: str, url: str, cls: str = '') -> dict:
    return el('a', label, href=url, target='_blank', rel='noopener noreferrer', **({'cls': cls} if cls else {}))


# Lucide icon paths (ISC license), drawn inline so the content stays plain data.
ICONS = {
    'mail': [('rect', {'width': '20', 'height': '16', 'x': '2', 'y': '4', 'rx': '2'}),
             ('path', {'d': 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'})],
    'github': [('path', {'d': 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4'}),
               ('path', {'d': 'M9 18c-4.51 2-5-2-7-2'})],
    'book': [('path', {'d': 'M12 7v14'}),
             ('path', {'d': 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z'})],
    'cap': [('path', {'d': 'M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z'}),
            ('path', {'d': 'M22 10v6'}), ('path', {'d': 'M6 12.5V16a6 3 0 0 0 12 0v-3.5'})],
    'arrow': [('path', {'d': 'M5 12h14'}), ('path', {'d': 'm12 5 7 7-7 7'})],
}


def icon(name: str) -> dict:
    return el('svg', *(el(tag, **attrs) for tag, attrs in ICONS[name]), viewBox='0 0 24 24', width='16', height='16',
              fill='none', stroke='currentColor', stroke_width='2', stroke_linecap='round', stroke_linejoin='round',
              aria_hidden='true', cls='icon')


# Research areas group papers and projects; colours follow the paper figure palette.
AREAS = {
    'mr': {'label': 'MR imaging & spectroscopy', 'tone': 'green',
           'text': 'Deep learning reconstruction for deuterium metabolic imaging, MRSI and NMR spectroscopy, '
                   'guided by anatomical and spectral priors and physics-based signal models.'},
    'forensics': {'label': 'Synthetic media forensics', 'tone': 'pink',
                  'text': 'Detecting AI-generated images and videos through generative-model trajectories, '
                          'temporal consistency and evidence-based reasoning.'},
    'agents': {'label': 'Multimodal & medical AI', 'tone': 'blue',
               'text': 'Agents and world models that reason over clinical evidence, longitudinal medical images and video.'},
    'protein': {'label': 'Protein language models', 'tone': 'violet',
                'text': 'Protein language models and PSSM features for druggable protein classification, '
                        'from undergraduate research.'},
}
AREA_OF = {
    'acquisition-matched-dmi-mrm': 'mr', 'ismrm-2026': 'mr', 'mrl-cyclegan': 'mr', 'jpcl-phase-correction': 'mr',
    'trace': 'forensics', 'clueaegis': 'forensics',
    'medcaseagent': 'agents', 'medworld-jepa': 'agents', 'videoaudience': 'agents', 'vertebrae-study': 'agents',
    'ijms-druggable-proteins': 'protein',
}
STATUS_TONE = {'Published': 'done', 'Published Online': 'done', 'Accepted': 'done', 'Under Review': 'review',
               'Submitted': 'review', 'Preprint': 'preprint', 'Power Pitch Oral': 'highlight'}
TOPIC_TONES = ['blue', 'violet', 'pink', 'green']
VERTEBRAE = {
    'id': 'vertebrae-study', 'title': 'Vertebrae Study',
    'summary': 'SuPreM vertebrae segmentation and postprocessing: explore authentic CT predictions, before/after changes, '
               '3D anatomy and a per-vertebra audit.',
    'meta': 'Research warmup from Zongwei Zhou’s lab at Johns Hopkins University',
    'preview': {'src': '/figures/vertebrae-study.webp', 'fit': 'cover'},
    'links': [{'label': 'Open interactive study', 'url': '/projects/vertebrae/'},
              {'label': 'Original task', 'url': 'https://github.com/MrGiovanni/SuPreM/blob/main/direct_inference/vertebrae.md'}],
}


SHORT_NAMES = {
    'acquisition-matched-dmi-mrm': 'DL-WA-CSI (MRM)', 'ismrm-2026': 'ISMRM 2026', 'mrl-cyclegan': 'Physics-embedded CycleGAN (MRL)',
    'jpcl-phase-correction': 'NMR phase correction (JPCL)', 'ijms-druggable-proteins': 'Druggable proteins (IJMS)',
}


def short(item: dict) -> str:
    """Compact label: the name before the colon, or a venue-based name for untitled methods."""
    head = item['title'].split(':')[0]
    return SHORT_NAMES.get(item['id'], head if ':' in item['title'] else item['title'])


def image_size(src: str) -> tuple[int, int]:
    try:
        from PIL import Image
        with Image.open(ROOT / 'frontend/public' / src.lstrip('/')) as image:
            return image.size
    except (ImportError, OSError):
        return 800, 500


def link(item: dict, cls: str = 'chip') -> dict:
    return el('a', item['label'], href=item['url'], cls=cls) if item['url'].startswith('/projects/vertebrae') \
        else external(item['label'], item['url'], cls)


def links(item: dict) -> dict:
    return el('div', *(link(x) for x in item['links']), cls='chips')


def authors(paper: dict) -> dict:
    children: list[dict | str] = []
    for i, name in enumerate(paper['authors']):
        if i:
            children.append(', ')
        children.append(el('strong', name, cls='me') if name == 'Hongkang Chu' else name)
    return el('p', *children, cls='pub__authors')


def area_tag(item_id: str) -> dict:
    area = AREAS[AREA_OF[item_id]]
    return el('span', area['label'], cls='tag tag--' + area['tone'])


def status(paper: dict) -> dict:
    return el('span', paper['status'], cls='status status--' + STATUS_TONE.get(paper['status'], 'done'))


def figure(data: dict, title: str, cls: str, *, url: str = '', zoom_link: str = '') -> dict:
    """A figure in a fixed 2:1 frame. It opens full size unless `url` points elsewhere."""
    width, height = image_size(data['src'])
    image = el('img', src=data['src'], alt='Figure from ' + title, width=str(width), height=str(height),
               loading='lazy', decoding='async')
    fit = ' frame--cover' if data.get('fit') == 'cover' else ''
    if url:
        return el('a', image, href=url, cls=f'frame{fit} {cls}', tabindex='-1', aria_hidden='true')
    extra = {'data_link': zoom_link} if zoom_link else {}
    return el('a', image, href=data['src'], cls=f'frame frame--zoom{fit} {cls}', data_zoom='', data_caption=title,
              aria_label='Enlarge figure: ' + title, **extra)


def publication(paper: dict, prefix: str = '', summary: bool = False) -> dict:
    url = paper['links'][0]['url']
    venue = [el('span', paper['citation'], cls='pub__venue-name'), status(paper)]
    if paper['role'] in ('First Author', 'Co-first Author'):
        venue.append(el('span', paper['role'].replace(' Author', ' author'), cls='role'))
    body = [el('h3', external(paper['title'], url), cls='pub__title'), authors(paper),
            el('p', *venue, cls='pub__venue'), links(paper)]
    if summary:
        body.append(el('details', el('summary', 'Summary'), el('p', paper['summary']), cls='pub__summary'))
    return el('li', figure(paper['preview'], paper['title'], 'pub__figure', zoom_link=url),
              el('div', *body, cls='pub__body'), cls='pub', id=prefix + paper['id'])


def card(item: dict, meta: str = '', badge: dict | None = None) -> dict:
    url = item['links'][0]['url'] if item.get('links') else ''
    internal = url.startswith('/projects/vertebrae')
    title_link = el('a', item['title'], href=url) if internal else external(item['title'], url) if url else item['title']
    head = [area_tag(item['id'])] + ([badge] if badge else [])
    return el('article',
        figure(item['preview'], item['title'], 'card__figure', url=url if internal else '', zoom_link='' if internal else url),
        el('div',
            el('div', *head, cls='card__tags'),
            el('h3', title_link, cls='card__title'),
            el('p', item['summary'], cls='card__text'),
            *([el('p', meta, cls='card__meta')] if meta else []),
            links(item), cls='card__body'),
        cls='card', id=item['id'])


def paper_card(paper: dict) -> dict:
    return card(paper, paper['venue'] + ' · ' + paper['role'], status(paper))


def section(title: str, id: str, *children: dict, more: tuple[str, str] | None = None) -> dict:
    head = [el('h2', title, cls='section__title', id=id + '-title')]
    if more:
        head.append(el('a', more[0], icon('arrow'), href=more[1], cls='section__more'))
    return el('section', el('div', *head, cls='section__head'), *children,
              cls='section', id=id, aria_labelledby=id + '-title')


def page(title: str, intro: str, *children: dict, kind: str) -> dict:
    return el('main', el('header', el('h1', title, cls='page-head__title'), el('p', intro, cls='page-head__intro'),
                         cls='page-head'), *children, id='main', cls='page page--' + kind)


def experience(item: dict, papers: dict, compact: bool = False) -> dict:
    body = [el('div', el('h3', item['institution'], cls='timeline__title'),
               el('p', item['role'], el('span', item['dates'], cls='timeline__dates'), cls='timeline__meta'),
               cls='timeline__head'),
            el('p', item['description'], cls='timeline__text')]
    if not compact and item['bullets']:
        body.append(el('ul', *(el('li', x) for x in item['bullets']), cls='timeline__list'))
    if item['paper_ids']:
        body.append(el('div', *(el('a', short(papers[id]), href='/publications#' + id, cls='chip chip--quiet')
                                for id in item['paper_ids']), cls='chips'))
    return el('li', *body, cls='timeline__item', id=item['id'] if not compact else 'home-' + item['id'])


def education(item: dict) -> dict:
    return el('li', el('div', el('h3', item['institution'], cls='timeline__title'),
                       el('p', item['degree'], el('span', item['dates'], cls='timeline__dates'), cls='timeline__meta'),
                       cls='timeline__head'),
              el('p', item['details'], cls='timeline__text'), cls='timeline__item')


def area(key: str, items: list[dict]) -> dict:
    info = AREAS[key]
    members = [x for x in items if AREA_OF.get(x['id']) == key]
    return el('article',
        el('h3', info['label'], cls='area__title'),
        el('p', info['text'], cls='area__text'),
        el('ul', *(el('li', el('a', short(x), href=('/publications#' if 'authors' in x else '/projects#') + x['id']),
                         el('span', x.get('year', 'Project'), cls='area__year')) for x in members), cls='area__items'),
        cls='area area--' + info['tone'])


def profile_card(data: dict) -> dict:
    """Identity block at the foot of every page."""
    return el('aside',
        el('div', el('img', src=data['portrait'], alt='', width='1448', height='1086', loading='lazy', decoding='async'),
           cls='avatar avatar--small'),
        el('div', el('p', data['name'], el('span', data['chinese_name'], lang='zh-CN', cls='cjk'), cls='profile-card__name'),
           el('p', 'Master’s student in Computer Science · UCAS', cls='profile-card__role'), cls='profile-card__text'),
        contact_links(data, 'profile-card__links'),
        cls='profile-card', aria_label='Contact')


def button(icon_name: str, label: str, url: str) -> dict:
    attrs = {} if url.startswith('mailto:') else {'target': '_blank', 'rel': 'noopener noreferrer'}
    return el('a', icon(icon_name), el('span', label), href=url, cls='button', **attrs)


def contact_links(data: dict, cls: str) -> dict:
    return el('div', button('mail', 'Email', 'mailto:' + data['email']), button('github', 'GitHub', data['github']),
              button('book', 'OpenReview', data['openreview']), button('cap', 'UCAS', 'https://english.ucas.ac.cn/'),
              cls='buttons ' + cls)


def site(data: dict) -> dict:
    papers = {p['id']: p for p in data['papers']}
    projects = data.get('research_projects', [])
    topics = [t.strip() for t in data['interests'].split(';')]
    hero = el('section',
        el('div', el('img', src=data['portrait'], alt=data['name'], width='1448', height='1086',
                     fetchpriority='high', decoding='async'), cls='avatar avatar--hero'),
        el('div',
            el('h1', data['name'], el('span', data['chinese_name'], lang='zh-CN', cls='cjk'), cls='hero__name'),
            el('p', 'Master’s student in Computer Science, University of the Chinese Academy of Sciences', cls='hero__role'),
            el('p', data['intro'], cls='hero__bio'),
            el('p', 'I collaborate with researchers at Zhejiang University on synthetic image and video detection and have '
                    'worked remotely with UIUC on medical AI. Previously, I studied Computer Science and Technology at '
                    'Shanghai Ocean University.', cls='hero__bio'),
            el('ul', *(el('li', t[0].upper() + t[1:], cls='tag tag--' + TOPIC_TONES[i % 4]) for i, t in enumerate(topics)),
               cls='tags hero__topics', aria_label='Research interests'),
            contact_links(data, 'hero__links'), cls='hero__text'),
        cls='hero', aria_label='Introduction')
    news_records = [
        ('2026-10-23', 'Oct 2026', 'My first-author paper MedCaseAgent is now available on arXiv.', papers['medcaseagent']['links'][0]['url']),
        ('2026-09-22', 'Sep 2026', 'TRACE is available on arXiv and submitted to ICLR 2027.', papers['trace']['links'][1]['url']),
        ('2026', '2026', 'ClueAegis was accepted to Findings of EMNLP 2026.', papers['clueaegis']['links'][0]['url']),
        ('2026-05-11', 'May 2026', 'Our weighted-average CSI work was selected for an ISMRM 2026 Power Pitch Oral.', papers['ismrm-2026']['links'][0]['url']),
        ('2026-04-06', 'Apr 2026', 'Our physics-embedded CycleGAN study is published online in Magnetic Resonance Letters.', papers['mrl-cyclegan']['links'][0]['url']),
        ('2026-01-29', 'Jan 2026', 'Our NMR phase correction study is published in The Journal of Physical Chemistry Letters.', papers['jpcl-phase-correction']['links'][0]['url']),
        ('2024-04-19', 'Apr 2024', 'My first-author work on druggable proteins was published in IJMS.', papers['ijms-druggable-proteins']['links'][0]['url']),
    ]
    news = el('ol', *(el('li', el('time', label, datetime=date, cls='news__date'),
                             el('p', external(text, url), cls='news__text'), cls='news__item')
                      for date, label, text, url in news_records), cls='news')
    home = el('main', hero,
        section('News', 'news', news),
        section('Selected Projects', 'selected-projects', el('div', *(card(x) for x in projects), cls='cards'),
                more=('All projects', '/projects')),
        section('Publications', 'selected-publications',
                el('ol', *(publication(p, 'selected-') for p in data['papers']), cls='pubs'),
                more=('Summaries', '/publications')),
        section('Experience', 'experience', el('ol', *(experience(x, papers, compact=True) for x in data['experiences']),
                                                   cls='timeline timeline--compact'), more=('Details', '/researches')),
        id='main', cls='page page--home')
    years = sorted({p['year'] for p in data['papers']}, reverse=True)
    everything = data['papers'] + projects + [VERTEBRAE]
    pages = {
        '/': home, '/about': copy.deepcopy(home),
        '/researches': page('Research',
            'My research connects multimodal learning and media forensics with deep learning for magnetic resonance '
            'imaging and spectroscopy.',
            section('Research Areas', 'areas', el('div', *(area(k, everything) for k in AREAS), cls='areas')),
            section('Experience', 'experience', el('ol', *(experience(x, papers) for x in data['experiences']), cls='timeline')),
            section('Education', 'education', el('ol', *(education(x) for x in data['education']), cls='timeline')),
            kind='research'),
        '/publications': page('Publications', 'Click a figure to view it full size. My name is shown in bold.',
            *(section(year, 'year-' + year, el('ol', *(publication(p, summary=True) for p in data['papers'] if p['year'] == year),
                                              cls='pubs')) for year in years),
            kind='publications'),
        '/projects': page('Projects', 'Selected research projects and interactive studies.',
            el('div', *(card(x) for x in projects),
               card(VERTEBRAE, VERTEBRAE['meta'], el('span', 'Interactive', cls='status status--preprint')),
               *(paper_card(papers[id]) for id in ('medcaseagent', 'trace', 'clueaegis', 'ismrm-2026')),
               cls='cards cards--page'),
            kind='projects'),
        '/projects/vertebrae': page('Vertebrae Study', 'SuPreM vertebrae segmentation and postprocessing.', kind='vertebrae'),
        '/teaching': page('Teaching', 'Teaching information will be added here.', kind='teaching'),
        '/talks': page('Personal', 'More about me soon.', kind='personal'),
    }
    return {'source': 'https://chuhongkang.com/', 'captured_at': '2026-11-23', 'name': data['name'],
        'institution': data['institution'], 'profile': profile_card(data),
        'navigation': [{'label': label, 'path': path} for label, path in [('About', '/about'), ('Research', '/researches'),
            ('Publications', '/publications'), ('Projects', '/projects')]],
        'pages': pages, 'documents': {}}


def tex(text: str) -> str:
    replacements = {'\\': r'\textbackslash{}', '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#',
        '_': r'\_', '{': r'\{', '}': r'\}', '–': '--', '’': "'", '·': r'\textperiodcentered{}'}
    return ''.join(replacements.get(c, c) for c in text)


def cv_source(data: dict, resume: bool = False) -> str:
    preamble = r'''\documentclass[10pt,letterpaper]{article}
\usepackage[margin=0.65in]{geometry}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\setlength{\parindent}{0pt}
\setlength{\emergencystretch}{2em}
\titleformat{\section}{\large\bfseries}{}{0pt}{}[\titlerule]
\titlespacing{\section}{0pt}{12pt}{7pt}
\setlist[itemize]{leftmargin=15pt,itemsep=3pt,topsep=4pt}
\pagestyle{fancy}\fancyhf{}\renewcommand{\headrulewidth}{0pt}
\fancyfoot[R]{\scriptsize Hongkang Chu\quad|\quad\thepage}
\hypersetup{pdfauthor={Hongkang Chu},pdftitle={Hongkang Chu - Public CV}}
\begin{document}
\begin{center}{\LARGE\bfseries Hongkang Chu}\\[5pt]
\href{mailto:chuhongkang25@mails.ucas.ac.cn}{chuhongkang25@mails.ucas.ac.cn}\quad|\quad
\href{https://chuhongkang.com}{chuhongkang.com}\end{center}
'''
    lines = [preamble, r'{\small ' + tex(data['interests']) + '}', r'\section{Education}']
    for x in data['education']:
        lines += [r'\textbf{' + tex(x['institution']) + r'}\hfill ' + tex(x['dates']) + r'\\',
            tex(x['degree']) + '. ' + tex(x['details']) + r'\par\vspace{5pt}']
    lines.append(r'\section{Research Experience}')
    for x in data['experiences']:
        lines += [r'\textbf{' + tex(x['institution']) + r'}\hfill ' + tex(x['dates']) + r'\\',
            r'\textit{' + tex(x['role']) + r'}\par']
        if resume:
            lines.append(tex(x['description']) + r'\par\vspace{6pt}')
        else:
            lines.append(tex(x['description']) + r'\par')
            if x['bullets']:
                lines += [r'\begin{itemize}', *[r'\item ' + tex(b) for b in x['bullets']], r'\end{itemize}']
            lines.append(r'\vspace{6pt}')
    if not resume:
        lines += [r'\section{Technical Skills}', tex('; '.join(data['skills'])) + '.', r'\newpage']
    lines.append(r'\section{Selected Publications and Conference Contributions}')
    for p in data['papers']:
        lines += [r'\begin{minipage}{\linewidth}', r'\small\textbf{\href{' + p['links'][0]['url'] + '}{' + tex(p['title']) + r'}}\par']
        if not resume:
            lines += [tex(', '.join(p['authors'])).replace('Hongkang Chu', r'\textbf{Hongkang Chu}') + r'.\par']
        lines += [r'\textit{' + tex(p['venue'] if resume else p['citation']) + '}. ' + tex(p['status']) +
                  '. ' + tex(p['role']) + r'.\end{minipage}\par\vspace{' + ('5' if resume else '13') + 'pt}']
    lines.append(r'\end{document}')
    return '\n'.join(lines)


def build_documents(data: dict) -> None:
    output = ROOT / 'artifacts' / 'documents'
    output.mkdir(parents=True, exist_ok=True)
    previews = output / 'previews'
    previews.mkdir(exist_ok=True)
    sources = ROOT / 'backend' / 'content' / 'documents'
    sources.mkdir(exist_ok=True)
    for id, filename, expected in [('cv', 'CV.pdf', 2), ('resume', 'resume.pdf', 1)]:
        source = cv_source(data, resume=id == 'resume')
        (sources / (id + '.tex')).write_text(source)
        with tempfile.TemporaryDirectory(prefix='public-cv-') as temp:
            temp = Path(temp)
            (temp / 'document.tex').write_text(source)
            for _ in range(2):
                result = subprocess.run(['pdflatex', '-interaction=nonstopmode', '-halt-on-error', 'document.tex'],
                    cwd=temp, capture_output=True, text=True)
                if result.returncode:
                    raise RuntimeError(result.stdout[-3000:])
            pdf = temp / 'document.pdf'
            info = subprocess.check_output(['pdfinfo', str(pdf)], text=True)
            page_count = int(next(line.split(':')[1] for line in info.splitlines() if line.startswith('Pages:')))
            if page_count != expected:
                raise RuntimeError(f'{id}: expected {expected} pages, got {page_count}')
            content = subprocess.check_output(['pdftotext', str(pdf), '-'], text=True)
            if 'Hongkang Chu' not in content or 'chuhongkang25@mails.ucas.ac.cn' not in content:
                raise RuntimeError('Public document identity missing')
            (output / filename).write_bytes(pdf.read_bytes())
            for i in range(1, expected + 1):
                subprocess.run(['pdftoppm', '-f', str(i), '-l', str(i), '-scale-to', '1300', '-png', '-singlefile',
                    str(pdf), str(previews / f'{id}-{i}')], check=True, capture_output=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--documents', action='store_true', help='Also generate local CV/Resume in artifacts/documents; these are never published.')
    args = parser.parse_args()
    data = json.loads((ROOT / 'backend/content/public_profile.json').read_text())
    payload = ReferenceSite.model_validate(site(data)).model_dump(mode='json')
    if args.documents:
        build_documents(data)
    (ROOT / 'backend/content/reference.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    print('Built personal website content without a CV section or document downloads.')


if __name__ == '__main__':
    main()
