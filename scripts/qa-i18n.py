"""Browser checks for language routing, static content and shared interactions. Run npm run dev first."""
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
QA = ROOT / '.qa'
QA.mkdir(exist_ok=True)
BASE = 'http://127.0.0.1:4173/'
LOCALES = ['ko', 'en', 'de', 'es', 'fr', 'ja']
errors, reports = [], []

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    context = browser.new_context(locale='en-US', viewport={'width':1440, 'height':1000})
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    for locale in LOCALES:
        for name in ['index', 'download', 'support']:
            response = page.goto(f'{BASE}{locale}/{name}.html', wait_until='networkidle')
            assert response.status == 200
            assert page.locator('html').get_attribute('lang') == locale
            assert page.locator('h1').count() == 1
            assert page.locator('#site-language option').count() == 7
            assert page.locator('#site-language').input_value() in [locale, 'system']
            page.locator('img').evaluate_all('(images)=>images.forEach(i=>i.loading="eager")')
            page.wait_for_function('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
            assert page.locator('#main-nav a[aria-current=page]').count() == 1
            for width in [1440, 1024, 768, 390, 320]:
                page.set_viewport_size({'width':width, 'height':1000 if width > 620 else 844})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), f'{locale}/{name}: overflow at {width}'
                if name == 'index' and width in [1440,390]:
                    page.screenshot(path=str(QA / f'i18n-{locale}-{width}.png'), full_page=True)
            if name == 'index':
                expected = page.locator('[data-demo-title]').inner_text()
                page.locator('[data-demo=study]').click()
                assert page.locator('[data-demo-title]').inner_text() != expected
                assert page.locator('[data-demo-image]').evaluate('(i)=>i.src').startswith(BASE+'assets/')
                if locale != 'ko': assert '테이블' not in page.locator('[data-demo-image]').get_attribute('alt')
                page.locator('[data-demo=study]').press('ArrowLeft')
                assert page.locator('[data-demo-title]').inner_text() == expected
                page.locator('[data-media-tab=video]').click()
                assert page.locator('#panel-video').is_visible()
                assert page.locator('[data-lazy-video]').evaluate('(v)=>v.src') == BASE+'assets/sample-video.mp4'
                page.locator('[data-media-tab=image]').click()
                assert page.locator('#panel-video').is_hidden()
            if name == 'download':
                comparison = page.locator('#editions')
                for value in ['USD $15.99','500','15','30']:
                    assert value in comparison.inner_text(), (locale, value)
                for edition, product in [('free','9NKD9SB9HXMM'),('pro','9PFRH9QLST85')]:
                    button = page.locator(f'.store-card [data-edition={edition}]')
                    assert button.get_attribute('href') == f'https://apps.microsoft.com/detail/{product}'
                    assert button.get_attribute('target') == '_blank'
                page.screenshot(path=str(QA / f'editions-{locale}-download-mobile.png'), full_page=True)
            if name == 'support':
                faq_download = page.locator('.faq-item').nth(1)
                faq_download.locator('summary').click()
                assert faq_download.locator('[data-edition=free]').get_attribute('href').endswith('/9NKD9SB9HXMM')
                assert faq_download.locator('[data-edition=pro]').get_attribute('href').endswith('/9PFRH9QLST85')
                faq_price = page.locator('.faq-item').nth(2)
                faq_price.locator('summary').click()
                assert 'USD $15.99' in faq_price.inner_text()
                assert faq_price.locator('a').get_attribute('href') == 'download.html#editions'
                page.locator('.faq-item').nth(6).locator('summary').click()
                if locale == 'ko': assert '주기적 복구 사본 기록을 제공하지 않습니다' in page.locator('.faq-item').nth(6).inner_text()
                page.screenshot(path=str(QA / f'editions-{locale}-faq-mobile.png'), full_page=True)
                term = {'ko':'비밀번호', 'en':'password', 'de':'Passwort', 'es':'contraseña', 'fr':'mot de passe', 'ja':'パスワード'}[locale]
                page.locator('#faq-search').fill(term)
                visible = page.locator('.faq-item:visible').count()
                assert 0 < visible < 14
                assert str(visible) in page.locator('.faq-search-status').inner_text()
                page.locator('#faq-search').fill('no-results-987654321')
                assert page.locator('.faq-empty').is_visible()
                page.locator('[data-clear-search]').click()
                assert page.locator('.faq-item:visible').count() == 14
                page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable:true,value:{writeText:async text=>{window.copied=text}}})")
                page.locator('[data-copy-email]').click()
                page.locator('.toast').wait_for(state='visible')
                assert page.evaluate('window.copied') == 'dpnzdy@zinniashark.com'
                if locale != 'ko': assert '복사' not in page.locator('.toast').inner_text()
                page.evaluate("()=>{navigator.clipboard.writeText=async()=>{throw new Error('denied')}}")
                page.locator('[data-copy-email]').click()
                assert page.evaluate('window.getSelection().toString()').strip() == 'dpnzdy@zinniashark.com'
                href = page.locator('.contact-topics a').last.get_attribute('href')
                if locale != 'ko': assert '앱 버전' not in parse_qs(urlparse(href).query)['body'][0]
            page.locator('.menu-toggle').click()
            assert page.locator('#main-nav').is_visible()
            page.keyboard.press('Escape')
            assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false'
            if locale != 'ko': assert '메뉴' not in page.locator('.menu-toggle').get_attribute('aria-label')
            page.set_viewport_size({'width':1440, 'height':1000})
            reports.append(f'{locale}/{name}')
        print(f'PASS: {locale} pages, five viewport sizes and localized interactions', flush=True)

    # Match regional preferences and scan beyond unsupported languages; default to English.
    for preferences, expected in [(['ko-KR'],'ko'), (['en-GB'],'en'), (['de-AT'],'de'), (['es-MX'],'es'), (['fr-CA'],'fr'), (['ja-JP'],'ja'), (['zh-CN','fr-CA'],'fr'), (['ru-RU'],'en')]:
        ctx = browser.new_context()
        ctx.add_init_script(f'Object.defineProperty(navigator,"languages",{{get:()=>{json.dumps(preferences)}}})')
        tab = ctx.new_page()
        tab.goto(BASE+'support.html?test=1#faq', wait_until='networkidle')
        tab.wait_for_url(f'**/{expected}/support.html?test=1#faq')
        assert tab.locator('#site-language').input_value() == 'system'
        ctx.close()

    page.goto(BASE+'en/support.html?source=test#faq', wait_until='networkidle')
    page.locator('#site-language').select_option('ja')
    page.wait_for_url('**/ja/support.html?source=test#faq')
    page.reload(wait_until='networkidle')
    assert page.locator('#site-language').input_value() == 'ja'
    page.goto(BASE+'download.html', wait_until='networkidle')
    page.wait_for_url('**/ja/download.html')
    page.goto(BASE+'de/support.html', wait_until='networkidle')
    assert page.locator('html').get_attribute('lang') == 'de', 'Explicit URL wins over saved Japanese'
    page.locator('#site-language').select_option('system')
    page.wait_for_url('**/en/support.html')
    page.evaluate("Object.defineProperty(navigator,'languages',{configurable:true,get:()=>['fr-CA']});window.dispatchEvent(new Event('languagechange'))")
    page.wait_for_url('**/fr/support.html')
    page.goto(BASE+'app-privacy.html', wait_until='networkidle')
    assert page.url == BASE+'app-privacy.html', 'Policy URLs never redirect'
    page.locator('#site-language').select_option('es')
    page.wait_for_url('**/es/index.html')

    # Disabled storage must not break navigation or introduce redirect loops.
    ctx = browser.new_context(locale='fr-FR')
    ctx.add_init_script("Object.defineProperty(window,'localStorage',{get:()=>{throw new Error('blocked')}})")
    tab = ctx.new_page()
    tab.goto(BASE, wait_until='networkidle')
    tab.wait_for_url('**/fr/index.html')
    tab.locator('#site-language').select_option('de')
    tab.wait_for_url('**/de/index.html')
    tab.reload(wait_until='networkidle')
    assert tab.locator('html').get_attribute('lang') == 'de'
    ctx.close()

    # The same files must work under the GitHub project path, including routing and assets.
    ctx = browser.new_context(locale='ja-JP')
    def project_route(route):
        suffix = route.request.url.split('/ZinniaSharkNote/',1)[1]
        route.fulfill(response=route.fetch(url=BASE+suffix))
    ctx.route(BASE+'ZinniaSharkNote/**', project_route)
    tab = ctx.new_page()
    tab.goto(BASE+'ZinniaSharkNote/', wait_until='networkidle')
    tab.wait_for_url('**/ZinniaSharkNote/ja/index.html')
    assert tab.locator('.brand img').first.evaluate('(i)=>i.complete&&i.naturalWidth>0')
    tab.locator('#site-language').select_option('fr')
    tab.wait_for_url('**/ZinniaSharkNote/fr/index.html')
    tab.locator('#main-nav a[href="support.html"]').click()
    tab.wait_for_url('**/ZinniaSharkNote/fr/support.html')
    ctx.close()

    # Each locale is readable and linked even when JavaScript is disabled.
    ctx = browser.new_context(java_script_enabled=False)
    for locale in LOCALES:
        tab = ctx.new_page()
        tab.goto(f'{BASE}{locale}/support.html', wait_until='networkidle')
        assert tab.locator('.faq-item').count() == 14
        assert tab.locator('.language-links a').count() == 6
        assert tab.locator('html').get_attribute('lang') == locale
        tab.close()
    ctx.close()
    assert not errors, errors
    browser.close()

(QA/'i18n-report.json').write_text(json.dumps({'pages':reports, 'viewportWidths':[1440,1024,768,390,320], 'tests':['regional and ordered language detection','unsupported-language English fallback','manual selection and persistence','explicit URLs override saved preference','query and hash preservation','languagechange event','policy URLs unchanged','blocked localStorage','GitHub project subpath','no-JavaScript static content','Free/Pro official links and comparison in all locales','current manual saving FAQ','localized FAQ search and reset','localized clipboard success/fallback','localized demo tabs and media','mobile menu and Escape'], 'errors':errors}, ensure_ascii=False, indent=2), encoding='utf-8')
print('PASS: 18 locale pages, responsive layouts, automatic/manual routing, storage failures, project subpath and static fallback.')
