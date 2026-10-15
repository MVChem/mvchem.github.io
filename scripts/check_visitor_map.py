"""Check map fallback, bounded retries, recovery and layout without adding pageviews."""

import json
from pathlib import Path
import sys

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8038').rstrip('/')
OUT = ROOT / 'artifacts/visitors'
SNAPSHOT = ROOT / 'frontend/src/assets/visitor-map.png'
WIDGET = 'https://mapmyvisitors.com/map.png?**'


def check_saved_map(page) -> None:
    image = page.locator('.site-visitors__map img').first
    expect(image).to_be_visible()
    expect(page.locator('.site-visitors__notice')).to_contain_text('Saved map')
    expect(page.locator('.site-visitors__notice time')).to_have_attribute('datetime', json.loads(SNAPSHOT.with_suffix('.json').read_text())['updatedAt'])
    page.wait_for_function("document.querySelector('.site-visitors__map img').naturalWidth === 420")
    assert page.locator('.site-visitors__map').get_attribute('href') == 'https://mapmyvisitors.com/web/1c8re'
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')


def check_live_map(page) -> None:
    image = page.locator('.site-visitors__map img').last
    expect(image).to_be_visible()
    expect(page.locator('.site-visitors__notice')).to_have_count(0)
    assert image.evaluate('(img) => img.complete && img.naturalWidth === 420')
    expect(page.locator('.site-visitors__map img').first).to_be_hidden()


def main() -> None:
    OUT.mkdir(exist_ok=True)
    checks, errors = [], []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1000})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.clock.install()
        requests = []
        healthy = False

        def widget(route):
            requests.append(route.request.url)
            if healthy:
                route.fulfill(path=SNAPSHOT, content_type='image/png')
            else:
                route.abort('connectionrefused')

        page.route(WIDGET, widget)
        page.goto(BASE, wait_until='networkidle')
        expect(page.get_by_role('button', name='Retry live map')).to_be_visible()
        check_saved_map(page)
        assert len(requests) == 1
        for attempt, delay in [(1, 2500), (2, 5000)]:
            with page.expect_request(WIDGET):
                page.clock.fast_forward(delay)
            expect(page.locator('.site-visitors__map img').last).to_have_attribute('src', requests[0] + f'&retry={attempt}')
            expect(page.get_by_role('button', name='Retry live map')).to_be_visible()
            check_saved_map(page)
        page.clock.fast_forward(60000)
        assert len(requests) == 3, 'Automatic retries must stop after two retries'
        checks.append('Connection failure: dated same-origin map remains visible; exactly two automatic retries')

        for width in [1440, 390, 320]:
            page.set_viewport_size({'width': width, 'height': 1000})
            check_saved_map(page)
            page.locator('.site-visitors').screenshot(path=str(OUT / f'fallback-{width}.png'))
        checks.append('Saved map and retry control fit 1440px, 390px and 320px viewports')

        healthy = True
        page.get_by_role('button', name='Retry live map').click()
        check_live_map(page)
        checks.append('Manual retry replaces the snapshot with the live image and removes the saved-map notice')
        page.locator('.site-visitors').screenshot(path=str(OUT / 'recovered.png'))

        healthy = False
        page.reload(wait_until='networkidle')
        expect(page.get_by_role('button', name='Retry live map')).to_be_visible()
        healthy = True
        page.evaluate("window.dispatchEvent(new Event('online'))")
        check_live_map(page)
        checks.append('Network reconnection automatically restores the live image')

        healthy = False
        page.set_viewport_size({'width': 1440, 'height': 1000})
        page.reload(wait_until='networkidle')
        expect(page.get_by_role('button', name='Retry live map')).to_be_visible()
        page.locator('.nav__link[href="/researches"]').click()
        expect(page.locator('.site-visitors')).to_have_count(0)
        count = len(requests)
        page.clock.fast_forward(60000)
        assert len(requests) == count, 'Leaving the homepage must cancel retry timers'
        checks.append('Navigating away cancels pending map retries')

        page.unroute(WIDGET)
        pending = []
        page.route(WIDGET, lambda route: pending.append(route))
        page.goto(BASE, wait_until='domcontentloaded')
        expect(page.locator('.site-visitors__notice')).to_contain_text('Connecting to live map')
        page.wait_for_function("document.querySelector('.site-visitors__map img:last-child').src.includes('mapmyvisitors.com')")
        assert len(pending) == 1
        check_saved_map(page)
        page.clock.fast_forward(8000)
        expect(page.get_by_role('button', name='Retry live map')).to_be_visible()
        check_saved_map(page)
        pending[0].fulfill(path=SNAPSHOT, content_type='image/png')
        check_live_map(page)
        checks.append('Stalled request times out after eight seconds; a late success still restores the live map')
        browser.close()
    assert not errors, errors
    report = {'base': BASE, 'status': 'passed', 'checks': checks, 'pageErrors': errors}
    (OUT / 'reliability-verification.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
