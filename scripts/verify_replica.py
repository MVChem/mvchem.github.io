"""Exercise public pages, media, responsive navigation, and removed CV links."""
import json
from pathlib import Path
import sys
from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5178'
OUT = Path(__file__).resolve().parents[1] / 'artifacts'
OUT.mkdir(exist_ok=True)
errors = []
routes = ['/', '/researches', '/publications', '/teaching', '/projects', '/talks']


def assert_link_chips_fit(page) -> None:
    overflow = page.locator('.link-chip').evaluate_all('''links => links.flatMap(link => {
        const box = link.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(link);
        const outside = [...range.getClientRects()].some(text =>
            text.top < box.top - 1 || text.bottom > box.bottom + 1 ||
            text.left < box.left - 1 || text.right > box.right + 1);
        return outside ? [link.textContent] : [];
    })''')
    assert not overflow, {'url': page.url, 'viewport': page.viewport_size, 'overflowing_links': overflow}


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' else None)
    page.on('response', lambda response: errors.append(f'{response.status} {response.url}') if response.url.startswith(BASE) and response.status >= 400 else None)
    layouts = {}
    for route in routes:
        response = page.goto(BASE + route, wait_until='networkidle')
        assert response.status == 200
        page.evaluate('() => document.fonts.ready')
        expect(page.locator('main')).to_be_visible()
        for image in page.locator('main img').all():
            image.scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.evaluate('scrollTo(0,0)')
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), route
        assert page.locator('main h1').count() == 1
        assert page.locator('img').evaluate_all('(images)=>images.every(i=>i.complete && i.naturalWidth>0)'), route
        assert_link_chips_fit(page)
        layouts[route] = page.locator('main section').evaluate_all('(sections)=>sections.map(s=>({id:s.id,rect:s.getBoundingClientRect().toJSON()}))')
        name = route.strip('/') or 'home'
        page.screenshot(path=str(OUT/f'{name}-desktop.png'), full_page=True)
        page.screenshot(path=str(OUT/f'{name}-hero.png'))
    assert page.locator('a[href="/cv"], a[href="/CV.pdf"], a[href="/resume.pdf"]').count() == 0
    for path in ['/cv','/CV.pdf','/resume.pdf','/previews/cv-1.png']:
        assert page.request.get(BASE + path).status == 404, path
    page.goto(BASE + '/', wait_until='networkidle')
    feed = page.locator('.news-scroll')
    feed.evaluate('(el)=>el.scrollTop=el.scrollHeight')
    expect(page.locator('.news-box')).to_have_class('news-box has-above')
    feed.evaluate('(el)=>el.scrollTop=0')
    expect(page.locator('.news-box')).to_have_class('news-box has-below')
    page.locator('.nav__link[href="/researches"]').click()
    expect(page).to_have_url(BASE + '/researches')
    page.go_back()
    expect(page).to_have_url(BASE + '/')
    for width in [960, 768, 640, 412, 390, 360, 320]:
        page.set_viewport_size({'width':width,'height':844})
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), width
        assert_link_chips_fit(page)
    page.set_viewport_size({'width':390,'height':844})
    page.locator('.nav__toggle').click()
    expect(page.locator('.nav__toggle')).to_have_attribute('aria-expanded','true')
    page.keyboard.press('Escape')
    expect(page.locator('.nav__toggle')).to_have_attribute('aria-expanded','false')
    page.locator('.nav__toggle').click()
    page.locator('.nav__link[href="/projects"]').click()
    expect(page).to_have_url(BASE + '/projects')
    expect(page.locator('.nav__toggle')).to_have_attribute('aria-expanded','false')
    expect(page.locator('.profile')).to_be_hidden()
    for route in routes:
        page.goto(BASE + route, wait_until='networkidle')
        for image in page.locator('main img').all():
            image.scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.evaluate('scrollTo(0,0)')
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), route
        assert_link_chips_fit(page)
        page.screenshot(path=str(OUT/f'{route.strip("/") or "home"}-mobile.png'), full_page=True)
    browser.close()
assert not errors, errors
(OUT/'verification.json').write_text(json.dumps({'status':'passed','routes':routes,'widths':[320,360,390,412,640,768,960,1440],'errors':errors,'layouts':layouts},indent=2))
print(json.dumps({'status':'passed','pages':len(routes),'widths':[320,360,390,412,640,768,960,1440],'errors':errors},indent=2))
