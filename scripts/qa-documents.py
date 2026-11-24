"""Bilingual policy/consent QA; SITE_BASE_URL also supports the published site."""
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import json, os, re
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
BASE = os.environ.get('SITE_BASE_URL', 'http://127.0.0.1:4173/').rstrip('/')+'/'
QA = ROOT/'.qa'
QA.mkdir(exist_ok=True)
PAGES = ['policies','app-privacy','android-app-privacy','eula','license','lifecycle','support-consent','privacy']
KEY = f'zinniashark-note:{urlparse(BASE).path}:language'
errors, reports = [], []

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    context = browser.new_context(locale='en-US', viewport={'width':1440,'height':1000})
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    for locale in ['ko','en']:
        for name in PAGES:
            url=BASE+f'{locale}/{name}.html'
            assert page.goto(url,wait_until='networkidle').status==200
            assert page.locator('html').get_attribute('lang')==locale
            assert page.locator('h1').count()==1
            assert page.locator('link[rel=alternate]').count()==3
            assert page.locator('[data-document-language]').count()==2
            assert page.locator(f'[data-document-language={locale}]').get_attribute('aria-current')=='true'
            text=page.locator('main').inner_text()
            if locale=='en':
                assert not re.search('[가-힣]',text.replace('한국어','')),name
                assert 'English reference translation' in text
            if name in ['eula','license','lifecycle']:
                assert page.locator('.policy-draft').is_visible()
                assert page.locator('meta[name=robots]').get_attribute('content')=='noindex,follow'
            if name=='app-privacy':
                note=page.locator('.policy-version-note').inner_text()
                assert ('manual' in note if locale=='en' else '수동' in note)
                assert '1.0' in page.locator('.policy-effective').inner_text()
            if name=='android-app-privacy':
                assert '1.1' in page.locator('.policy-effective').inner_text()
                assert 'Google Play' in text
                assert '90' in text and '30' in text and '690-07-03662' in text
            for width in [1440,1024,768,390,320]:
                page.set_viewport_size({'width':width,'height':844})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(locale,name,width)
            if locale=='en' and name in ['support-consent','android-app-privacy','privacy']:
                page.screenshot(path=str(QA/f'doc-{name}-mobile.png'),full_page=True)
            page.locator('.menu-toggle').click()
            assert page.locator('#main-nav').is_visible()
            page.keyboard.press('Escape')
            assert page.locator('.menu-toggle').get_attribute('aria-expanded')=='false'
            page.set_viewport_size({'width':1440,'height':1000})
            # Explicit document switches preserve query/hash, without changing the site preference.
            page.evaluate('(key)=>localStorage.setItem(key,"de")',KEY)
            page.goto(url+'?platform=android#main',wait_until='networkidle')
            anchor='policy-section-2' if name in ['app-privacy','android-app-privacy','eula','license','lifecycle'] else 'main'
            page.evaluate('(anchor)=>{location.hash=anchor}',anchor)
            target='en' if locale=='ko' else 'ko'
            page.locator(f'[data-document-language={target}]').click()
            page.wait_for_url(BASE+f'{target}/{name}.html?platform=android#{anchor}')
            assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)=='de'
            assert page.locator('.brand').first.evaluate('(e)=>e.href')==BASE+'de/index.html'
            reports.append(f'{locale}/{name}')
        print(f'PASS: {locale} documents, five widths, static metadata, menu and language switches',flush=True)

    # Root app/Store links remain Korean, even with another saved site language.
    for name in PAGES:
        page.goto(BASE+name+'.html',wait_until='networkidle')
        assert page.url==BASE+name+'.html'
        assert page.locator('html').get_attribute('lang')=='ko'
    # Every site's language links to an available document; fallback never overwrites preferences.
    for language in ['ko','en','de','es','fr','ja']:
        page.goto(BASE+f'{language}/support.html',wait_until='networkidle')
        page.locator('#site-language').select_option(language)
        link=page.locator('.site-footer a[href$="policies.html"]')
        assert link.evaluate('(e)=>e.href')==BASE+f'{"ko" if language=="ko" else "en"}/policies.html'
        link.click()
        assert page.locator('html').get_attribute('lang')==('ko' if language=='ko' else 'en')
        assert page.evaluate('(key)=>localStorage.getItem(key)',KEY)==language
        assert page.locator('.brand').first.evaluate('(e)=>e.href')==BASE+f'{language}/index.html'

    # Validate consent for both languages, both platforms and both material types without sending mail.
    for locale in ['ko','en']:
        page.goto(BASE+f'{locale}/support-consent.html?platform=android',wait_until='networkidle')
        assert page.locator('#consent-platform').input_value()=='android'
        for platform,version,date in [('android','1.1','2026-11-13'),('windows','1.0','2026-11-01')]:
            page.locator('#consent-platform').select_option(platform)
            assert not page.locator('#consent-collect').is_checked()
            assert not page.locator('#consent-overseas').is_checked()
            assert page.locator('[data-consent-mail]').get_attribute('href') is None
            assert version in page.locator('[data-consent-policy-date]').inner_text()
            for purpose in ['feedback','diagnostic']:
                page.locator('#consent-purpose').select_option(purpose)
                assert not page.locator('#consent-collect').is_checked()
                page.locator('#consent-collect').check()
                assert page.locator('[data-consent-mail]').get_attribute('href') is None
                page.locator('#consent-overseas').check()
                if purpose=='diagnostic':
                    page.locator('#consent-case').fill('invalid')
                    assert page.locator('[data-consent-mail]').get_attribute('href') is None
                    page.locator('#consent-case').fill('ADQ-20261124-1234ABCD')
                    assert '90' in page.locator('[data-consent-collection]').inner_text()
                href=page.locator('[data-consent-mail]').get_attribute('href')
                assert href and href.startswith('mailto:dpnzdy@zinniashark.com?')
                mail=parse_qs(urlparse(href).query)
                body=mail['body'][0]
                assert f'{platform.title()} {version}' in body and date in body
                policy='android-app-privacy' if platform=='android' else 'app-privacy'
                assert BASE+f'{locale}/{policy}.html' in body
                assert '(한국 시간)' in body if locale=='ko' else '(Korea Standard Time)' in body
                assert '수집·이용 동의:' in body if locale=='ko' else 'Collection/use consent:' in body
                assert '국외 이전 별도 동의:' in body if locale=='ko' else 'Separate overseas transfer consent:' in body
                if locale=='en': assert not re.search('[가-힣]',body+mail['subject'][0])
                assert ('한국어 (ko)' if locale=='ko' else 'English (en)') in body
                page.locator('#consent-collect').uncheck()
                assert page.locator('[data-consent-mail]').get_attribute('href') is None
        page.locator('#consent-purpose').select_option('feedback')
        page.locator('#consent-collect').check(); page.locator('#consent-overseas').check()
        # Even a global language change with the same document fallback resets consent.
        page.locator('#site-language').select_option('fr')
        page.wait_for_url(BASE+'en/support-consent.html?platform=windows')
        assert page.locator('.brand').first.evaluate('(e)=>e.href')==BASE+'fr/index.html'
        assert not page.locator('#consent-collect').is_checked()
        assert page.locator('[data-consent-mail]').get_attribute('href') is None
        page.locator('#consent-collect').check(); page.locator('#consent-overseas').check()
        page.locator('[data-document-language=ko]').click()
        page.wait_for_url(BASE+'ko/support-consent.html?platform=windows')
        assert page.locator('#consent-platform').input_value()=='windows'
        assert not page.locator('#consent-collect').is_checked()
        page.go_back(wait_until='networkidle')
        assert not page.locator('#consent-collect').is_checked()
    print('PASS: legacy URLs, six-language fallback, preference retention and all consent cases',flush=True)
    # Entire documents and language links remain accessible without JavaScript.
    static=browser.new_context(java_script_enabled=False)
    nojs=static.new_page()
    for locale in ['ko','en']:
        for name in PAGES:
            assert nojs.goto(BASE+f'{locale}/{name}.html',wait_until='networkidle').status==200
            assert len(nojs.locator('main').inner_text())>700
            assert nojs.locator('[data-document-language]').count()==2
            if name=='support-consent':
                assert nojs.locator('[data-consent-mail]').get_attribute('href') is None
                assert nojs.locator('main noscript').is_visible()
    assert not errors,errors
    (QA/'documents-report.json').write_text(json.dumps({'base':BASE,'pages':reports,'errors':errors},indent=2),encoding='utf-8')
    browser.close()
print('PASS: 16 bilingual pages, five widths, eight stable legacy URLs, no-JS access and consent workflows')
