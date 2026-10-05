"""Exercise all pages, local media, responsive navigation, CV tabs, and export."""
import json
from pathlib import Path
import sys
from playwright.sync_api import expect, sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:5178'
OUT = Path(__file__).resolve().parents[1] / 'artifacts'
OUT.mkdir(exist_ok=True)
errors = []
routes = ['/', '/researches', '/publications', '/teaching', '/projects', '/cv', '/talks']
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
        layouts[route] = page.locator('main section').evaluate_all('(sections)=>sections.map(s=>({id:s.id,rect:s.getBoundingClientRect().toJSON()}))')
        name = route.strip('/') or 'home'
        page.screenshot(path=str(OUT/f'{name}-desktop.png'), full_page=True)
        page.screenshot(path=str(OUT/f'{name}-hero.png'))
    page.goto(BASE + '/cv', wait_until='networkidle')
    page.get_by_role('tab', name='Resume', exact=True).click()
    expect(page).to_have_url(BASE + '/cv?doc=resume')
    expect(page.get_by_role('tab', name='Resume', exact=True)).to_have_attribute('aria-selected', 'true')
    assert page.locator('.doc-page').count() == 2
    assert page.locator('.doc-action').first.get_attribute('href') == '/resume.pdf'
    page.reload(wait_until='networkidle')
    expect(page.get_by_role('tab', name='Resume', exact=True)).to_have_attribute('aria-selected', 'true')
    page.get_by_role('tab', name='Resume', exact=True).focus()
    page.keyboard.press('ArrowLeft')
    expect(page.get_by_role('tab', name='Curriculum Vitae')).to_be_focused()
    assert page.locator('.doc-page').count() == 2
    for path in ['/CV.pdf','/resume.pdf']:
        response = page.request.get(BASE + path)
        assert response.status == 200 and response.body().startswith(b'%PDF'), path
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
    for width in [960, 768, 390, 360]:
        page.set_viewport_size({'width':width,'height':844})
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), width
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
        page.screenshot(path=str(OUT/f'{route.strip("/") or "home"}-mobile.png'), full_page=True)
    browser.close()
assert not errors, errors
(OUT/'verification.json').write_text(json.dumps({'status':'passed','routes':routes,'widths':[360,390,768,960,1440],'errors':errors,'layouts':layouts},indent=2))
print(json.dumps({'status':'passed','pages':len(routes),'widths':[360,390,768,960,1440],'errors':errors},indent=2))
