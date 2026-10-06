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


def links(paper: dict) -> dict:
    return el('div', *(external(x['label'], x['url'], 'link-chip') for x in paper['links']), cls='link-row')


def authors(paper: dict) -> dict:
    children: list[dict | str] = []
    for i, name in enumerate(paper['authors']):
        if i:
            children.append(', ')
        children.append(el('strong', name, cls='authors__me') if name == 'Hongkang Chu' else name)
    return el('p', *children, cls='authors')


def publication(paper: dict, prefix: str = '') -> dict:
    status_class = 'tag--review' if paper['status'] == 'Under Review' else 'tag--accepted'
    return el('li', el('div',
        el('h2', external(paper['title'], paper['links'][0]['url']), cls='pub__title'),
        authors(paper),
        el('ul', el('li', el('span', paper['citation'], cls='venue__name'),
                    el('span', paper['status'], cls='tag ' + status_class), cls='venue'), cls='venues'),
        links(paper), cls='pub__body'), cls='pub', id=prefix + paper['id'])


def page(title: str, *children: dict, kind: str = '') -> dict:
    return el('main', el('article',
        el('header', el('h1', title, cls='page-title'), cls='page-head'),
        *children, cls='page page--' + (kind or title.lower())), id='main', cls='content')


def section(title: str, id: str, *children: dict) -> dict:
    return el('section', el('h2', title, cls='section__title', id=id + '-title'),
              el('div', *children, cls='section__body'), cls='section', id=id, aria_labelledby=id + '-title')


def experience(item: dict, papers: dict) -> dict:
    return el('li', el('div', el('h3', item['institution'], cls='row__title'),
                el('p', item['role'] + ' · ' + item['dates'], cls='row__meta'), cls='row__head'),
              el('p', item['description'], cls='row__text'),
              *( [el('ul', *(el('li', x) for x in item['bullets']), cls='build__list')] if item['bullets'] else []),
              *( [el('div', *(el('a', papers[id]['title'].split(':')[0], href='/researches#' + id, cls='link-chip') for id in item['paper_ids']), cls='link-row')] if item['paper_ids'] else []),
              cls='row', id=item['id'])


def research(paper: dict) -> dict:
    return el('li', el('div',
        el('div', el('h2', paper['title'], cls='project__title'), el('span', paper['role'], cls='role'), cls='project__head'),
        el('div', el('p', paper['summary']), cls='project__text'),
        el('p', paper['venue'] + ' · ' + paper['status'], cls='row__meta'),
        el('div', links(paper), cls='project__foot'), cls='project__body'),
        cls='project project--text', id=paper['id'])


def documents(document_id: str, pages: int) -> dict:
    url = '/CV.pdf' if document_id == 'cv' else '/resume.pdf'
    label = 'Curriculum Vitae' if document_id == 'cv' else 'Resume'
    tabs = el('div', *(el('button', name, cls='doc-tab' + (' is-active' if id == document_id else ''),
        role='tab', type='button', id='doc-tab-' + id, aria_selected=str(id == document_id).lower(),
        aria_controls='doc-panel', tabindex='0' if id == document_id else '-1')
        for id, name in [('cv', 'Curriculum Vitae'), ('resume', 'Resume')]), cls='doc-tabs', role='tablist', aria_label='Document')
    previews = [el('a', el('img', src=f'/previews/{document_id}-{i}.png', alt=f'{label}, page {i} of {pages}',
        loading='lazy' if i > 1 else 'eager', decoding='async'), cls='doc-page', href=url + f'#page={i}',
        target='_blank', rel='noopener noreferrer', aria_label=f'{label}, page {i} of {pages} (opens the PDF)') for i in range(1, pages + 1)]
    return page('CV & Resume', el('div', tabs, el('div', external('Open PDF', url, 'doc-action'),
        el('a', 'Download', href=url, download='Hongkang_Chu_CV.pdf' if document_id == 'cv' else 'Hongkang_Chu_Resume.pdf', cls='doc-action'),
        cls='doc-actions'), cls='doc-bar'),
        el('div', *previews, id='doc-panel', role='tabpanel', aria_labelledby='doc-tab-' + document_id, cls='doc-pages'), kind='cv')


def site(data: dict) -> dict:
    papers = {p['id']: p for p in data['papers']}
    profile = el('aside',
        el('div', el('img', src=data['portrait'], alt=data['name'], width='1448', height='1086',
            fetchpriority='high', decoding='async', cls='profile__portrait-image'),
            cls='profile__avatar profile__portrait'),
        el('div', el('p', el('span', 'Master’s Student @ UCAS'), el('span', 'AI · MRI · Multimodal Learning'), cls='profile__roles'), cls='profile__id'),
        el('ul',
            el('li', external('UCAS', 'https://english.ucas.ac.cn/')),
            el('li', el('a', 'Email', href='mailto:' + data['email'])),
            el('li', external('OpenReview', data['openreview'])),
            el('li', external('GitHub', data['github'])), cls='profile__links'), cls='profile', aria_label='Profile')
    hero = el('header', el('div',
        el('h1', 'Hi, I’m ', el('span', data['name'], cls='hp', data_p='name'), '.', cls='hero__title'),
        el('p', 'I study ', el('span', 'multimodal learning', cls='hp', data_p='people'), ', ',
            el('span', 'synthetic media detection', cls='hp', data_p='eyes'), ', and ',
            el('span', 'AI for magnetic resonance imaging/medical', cls='hp', data_p='health'), '.', cls='hero__lede'),
        cls='hero'), cls='page-head page-head--hero')
    news_records = [
        ('2026-09-22', 'Sep 2026', 'TRACE is available on arXiv and submitted to ICLR 2027.', papers['trace']['links'][1]['url']),
        ('2026', '2026', 'ClueAegis was accepted to Findings of EMNLP 2026.', papers['clueaegis']['links'][0]['url']),
        ('2026-05-11', 'May 2026', 'Our weighted-average CSI work was selected for an ISMRM 2026 Power Pitch Oral.', papers['ismrm-2026']['links'][0]['url']),
        ('2026-04-06', 'Apr 2026', 'Our physics-embedded CycleGAN study is published online in Magnetic Resonance Letters.', papers['mrl-cyclegan']['links'][0]['url']),
        ('2026-01-29', 'Jan 2026', 'Our NMR phase correction study is published in The Journal of Physical Chemistry Letters.', papers['jpcl-phase-correction']['links'][0]['url']),
        ('2024-04-19', 'Apr 2024', 'My first-author work on druggable proteins was published in IJMS.', papers['ijms-druggable-proteins']['links'][0]['url']),
    ]
    news = el('div', el('div', el('ul', *(el('li', el('time', label, datetime=date, cls='news__date'),
        el('p', external(text, url), cls='news__text'), cls='news__item') for date, label, text, url in news_records), cls='news'),
        cls='news-scroll', tabindex='0', aria_label='Research news'), cls='news-box')
    about = el('main', el('article', hero,
        section('About', 'about', el('p', data['intro']),
            el('p', 'I collaborate with researchers at Zhejiang University on synthetic image and video detection and have worked remotely with UIUC on medical AI. Previously, I studied Computer Science and Technology at Shanghai Ocean University.')),
        section('News', 'news', news),
        section('Research Experience', 'experience', el('ol', *(experience(x, papers) for x in data['experiences']), cls='rows')),
        section('Selected Publications', 'selected-publications', el('ol', *(publication(p, 'selected-') for p in data['papers']), cls='pubs')),
        cls='page page--about'), id='main', cls='content')
    pages = {'/': about, '/about': copy.deepcopy(about),
        '/researches': page('Research', el('p', 'My research connects multimodal learning and media forensics with deep learning for magnetic resonance imaging and spectroscopy.', cls='page-intro'),
            section('Experience', 'experience', el('ol', *(experience(x, papers) for x in data['experiences']), cls='rows')),
            el('ol', *(research(p) for p in data['papers']), cls='projects'), kind='research'),
        '/publications': page('Publications', el('ol', *(publication(p) for p in data['papers']), cls='pubs')),
        '/projects': page('Projects', el('p', 'Selected research projects. Publication details and links are listed below.', cls='page-intro'),
            el('ol', *(research(papers[id]) for id in ('trace', 'clueaegis', 'ismrm-2026')), cls='projects')),
        '/teaching': page('Teaching', el('p', 'Teaching information will be added here.', cls='page-intro')),
        '/talks': page('Personal', el('p', 'More about me soon.', cls='page-intro'), kind='personal')}
    return {'source': 'https://chuhongkang.com/', 'captured_at': '2026-10-06', 'name': data['name'],
        'institution': data['institution'], 'profile': profile,
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
