"""Browser smoke test against a running FastAPI server or deployed Pages site."""
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
    expect(page.locator('h1')).to_have_text('MVChem')
    expect(page.locator('.mobile-menu')).to_be_hidden()
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    expect(page.locator('.project-card')).to_have_count(3)
    page.locator('.experience-selector').nth(1).click()
    expect(page.locator('.experience-selector').nth(1)).to_have_attribute('aria-expanded', 'true')
    page.locator('.project-art-button').first.click()
    expect(page.locator('dialog')).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.locator('dialog')).not_to_be_visible()
    page.locator('.language-trigger').click()
    page.get_by_role('button', name='English', exact=True).click()
    assert '/en/' in page.url
    expect(page.locator('html')).to_have_attribute('lang', 'en')
    page.reload(wait_until='networkidle')
    expect(page.locator('.hero-intro h2')).to_contain_text('Welcome')
    page.locator('.game-pong-start').click()
    expect(page.locator('.game-pong')).to_have_class('game-pong game-surface game-active')
    page.keyboard.press('Space')
    expect(page.locator('.game-pong .game-overlay')).to_be_visible()
    page.locator('.game-bricks .game-start-card').click()
    expect(page.locator('.game-bricks')).to_have_class('game-bricks game-surface game-active')
    page.keyboard.down('ArrowRight')
    page.wait_for_timeout(180)
    page.keyboard.up('ArrowRight')
    page.keyboard.press('Space')
    expect(page.locator('.game-bricks .game-overlay')).to_be_visible()
    page.set_viewport_size({'width': 390, 'height': 844})
    page.goto(base + '/zh/', wait_until='networkidle')
    expect(page.locator('.mobile-menu')).to_be_visible()
    expect(page.locator('.header-nav')).to_be_hidden()
    page.locator('.mobile-menu').click()
    expect(page.locator('.header-nav')).to_be_visible()
    page.locator('.header-nav a[href="#projects"]').click()
    expect(page.locator('.header-nav')).to_be_hidden()
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    page.goto(base + '/zh/', wait_until='networkidle')
    page.screenshot(path=str(artifacts / 'mobile.png'), full_page=True)
    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.screenshot(path=str(artifacts / 'desktop.png'), full_page=True)
    page.screenshot(path=str(artifacts / 'hero.png'))
    for width in [360, 768, 1024]:
        page.set_viewport_size({'width': width, 'height': 900})
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth'), f'Overflow at {width}'
    browser.close()
assert not errors, errors
print(json.dumps({'result': 'passed', 'base': base, 'browser_errors': errors, 'viewports': [360, 390, 768, 1024, 1440]}, indent=2))
