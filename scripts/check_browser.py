"""Check reference layouts, navigation, persistence, and playable controls."""
import json
import os
from pathlib import Path
import sys
from playwright.sync_api import expect, sync_playwright

base = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8026'
artifacts = Path(__file__).resolve().parents[1] / 'artifacts'
artifacts.mkdir(exist_ok=True)
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROME_PATH', '/usr/bin/google-chrome'), headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + '/zh/', wait_until='networkidle')
    page.evaluate('localStorage.clear(); sessionStorage.clear()')
    page.reload(wait_until='networkidle')
    expect(page.locator('h1')).to_have_text('MVChem')
    assert page.locator('header').bounding_box()['height'] == 112
    assert page.locator('.game-pong').bounding_box()['height'] == 260
    assert page.locator('.hero-identity h1').evaluate('(e)=>getComputedStyle(e).fontSize') == '112px'
    assert page.locator('.experience-deck').bounding_box()['height'] == 720
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    assert page.locator('.hero-stats>div').count() == 4
    assert page.locator('.skill-pill').count() == 50
    page.locator('.experience-card').nth(1).click()
    expect(page.locator('.experience-card').nth(1)).to_have_attribute('aria-expanded', 'true')
    page.locator('.experience-card').first.click()
    page.evaluate('scrollTo(0,0)')
    page.locator('.reference-player-level').hover()
    expect(page.locator('.reference-player-level .reference-tooltip')).to_be_visible()
    page.mouse.move(1100, 400)
    page.keyboard.press('w')
    expect(page.locator('.game-pong-overlay')).to_have_count(0)
    assert page.evaluate("localStorage.getItem('pongHasStarted')") == 'true'
    expect(page.locator('.reference-experience-row .reference-exp-rate')).to_have_text('+2/秒')
    page.locator('.reference-player-level').click()
    expect(page.locator('.game-pong-overlay')).to_be_visible()
    separator = page.locator('.game-resize-handle')
    separator.focus()
    page.keyboard.press('ArrowDown')
    expect(separator).to_have_attribute('aria-valuenow', '280')
    page.keyboard.press('Home')
    expect(separator).to_have_attribute('aria-valuenow', '260')
    page.locator('.game-bricks').scroll_into_view_if_needed()
    page.keyboard.press('a')
    expect(page.locator('.game-brick-overlay')).to_have_count(0)
    assert page.evaluate("localStorage.getItem('brickHasStarted')") == 'true'
    expect(page.locator('.reference-experience-row .reference-exp-rate')).to_have_text('+3/秒')
    page.locator('.skill-category h3').first.click()
    expect(page.locator('.game-brick-overlay')).to_be_visible()
    page.locator('.reference-desktop-nav a[href="/zh/portfolio/"]').click()
    expect(page).to_have_url(base + '/zh/portfolio/')
    page.wait_for_load_state('networkidle')
    assert page.locator('main h1').count() == 1
    page.locator('.reference-language-trigger').click()
    page.locator('.reference-language-options a[lang="ja"]').click()
    expect(page).to_have_url(base + '/ja/portfolio/')
    expect(page.locator('html')).to_have_attribute('lang', 'ja')
    page.reload(wait_until='networkidle')
    expect(page.locator('html')).to_have_attribute('lang', 'ja')
    page.goto(base + '/zh/aboutme/', wait_until='networkidle')
    assert page.locator('main h1').count() == 1
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    page.goto(base + '/zh/', wait_until='networkidle')
    expect(page.locator('.reference-experience-row .reference-exp-rate')).to_have_text('+3/秒')
    page.screenshot(path=str(artifacts / 'desktop.png'), full_page=True)
    page.screenshot(path=str(artifacts / 'hero.png'))
    for width, height in [(768,80), (390,64), (360,64)]:
        page.set_viewport_size({'width':width,'height':844})
        assert page.locator('header').bounding_box()['height'] == height
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), f'Overflow at {width}'
    page.set_viewport_size({'width':390,'height':844})
    expect(page.locator('.reference-experience-row')).to_be_hidden()
    page.locator('.reference-mobile-trigger').click()
    expect(page.locator('.reference-mobile-menu')).to_have_attribute('aria-hidden','false')
    assert page.evaluate('getComputedStyle(document.body).overflow') == 'hidden'
    page.locator('.reference-mobile-nav-link[href="/zh/portfolio/"]').click()
    expect(page).to_have_url(base + '/zh/portfolio/')
    expect(page.locator('.reference-mobile-menu')).to_have_attribute('aria-hidden','true')
    page.goto(base + '/zh/', wait_until='networkidle')
    page.screenshot(path=str(artifacts / 'mobile.png'), full_page=True)
    browser.close()
assert not errors, errors
print(json.dumps({'result':'passed','base':base,'browser_errors':errors,'viewports':[360,390,768,1440]},indent=2))
