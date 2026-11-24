"""Check translated release/development news locally or with SITE_BASE_URL set to the public site."""
from pathlib import Path
from urllib.parse import urlparse
import json, os, subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
QA = ROOT / '.qa'
QA.mkdir(exist_ok=True)
BASE = os.environ.get('SITE_BASE_URL', 'http://127.0.0.1:4173/').rstrip('/') + '/'
LOCALES = ['ko', 'en', 'de', 'es', 'fr', 'ja']
DATA = json.loads(subprocess.check_output(['node','--input-type=module','-e', """
import {locales,translate} from './src/i18n.mjs';
import {release} from './src/release.mjs';
import {config} from './src/config.mjs';
const messages={
  saving:'현재 앱은 Ctrl+S로 파일에 저장하며, 종료 시 변경된 문서마다 저장·버리기·취소를 선택합니다. 작업 이어하기와 주기적 복구 사본 기록은 제공하지 않습니다.',
  history:'이전 1.0 버전에는 로컬 작업 이어하기가 있었으나 현재 Windows 앱에서는 제거되었습니다.',
  platforms:'Windows는 현재 앱 안내, Android는 개발 상태를 구분합니다.',
  legacy:'· 남아 있는 작업 문서나 복구 사본은 파일 → 이전 버전 문서 내보내기에서 새 .adq 파일로 내보낼 수 있습니다. 현재 문서의 자동 보존 기능이 아닙니다.'
};
console.log(JSON.stringify({publicBase:config.publicSiteUrl,version:release.version,date:release.date,locales:Object.fromEntries(locales.map(l=>[l,{
  ...Object.fromEntries(Object.entries(messages).map(([key,value])=>[key,translate(value,l)])),
  price:translate(release.priceAnswer,l),
  releaseDate:new Intl.DateTimeFormat(l,{dateStyle:'long',timeZone:'UTC'}).format(new Date(release.date+'T00:00:00Z')),
  firstDate:new Intl.DateTimeFormat(l,{dateStyle:'long',timeZone:'UTC'}).format(new Date(release.firstReleaseDate+'T00:00:00Z'))
}]))}));
"""], cwd=ROOT, encoding='utf-8'))
reports, errors = [], []

with sync_playwright() as p:
    browser = p.chromium.launch(channel='msedge', headless=True)
    context = browser.new_context(locale='ko-KR', viewport={'width':1440,'height':1000})
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    for index, locale in enumerate(LOCALES):
        expected = DATA['locales'][locale]
        for name, anchor in [('releases','release-history'),('development','android')]:
            url = BASE + f'{locale}/{name}.html'
            response = page.goto(url, wait_until='networkidle')
            assert response.status == 200
            assert page.locator('html').get_attribute('lang') == locale
            assert page.locator('h1').count() == 1
            assert page.locator('#site-language option').count() == 7
            assert page.locator('link[rel=canonical]').get_attribute('href') == DATA['publicBase']+f'{locale}/{name}.html'
            assert page.locator('link[rel=alternate][hreflang]').count() == 7
            assert page.locator('a[href^="../releases.html"],a[href^="../development.html"]').count() == 0
            assert page.locator('a[href="guide.html#save"]').count() >= 1
            text = page.locator('main').inner_text()
            assert expected['price'] in text
            for amount in ['500','15','30','USD $15.99']: assert amount in text
            if name == 'releases':
                history = page.locator('#release-history')
                assert DATA['version'] in history.inner_text()
                assert history.locator('time').get_attribute('datetime') == DATA['date']
                assert expected['releaseDate'] in history.inner_text()
                assert expected['firstDate'] in history.inner_text()
                assert expected['history'] in history.inner_text()
                assert expected['saving'] in page.locator('main>article>section').first.inner_text()
                for edition, product in [('free','9NKD9SB9HXMM'),('pro','9PFRH9QLST85')]:
                    assert page.locator(f'[data-edition={edition}]').get_attribute('href') == f'https://apps.microsoft.com/detail/{product}'
                assert page.locator('[data-edition=free]').evaluate('(e)=>getComputedStyle(e).color') == 'rgb(255, 255, 255)'
                assert page.locator('[data-edition=free]').evaluate('(e)=>getComputedStyle(e).textDecorationLine') == 'none'
            else:
                assert expected['platforms'] in page.locator('.intro-copy').inner_text()
                assert expected['legacy'] in page.locator('#windows').inner_text()
                assert 'Google Play' in page.locator('#android').inner_text()
                assert 'TalkBack' in page.locator('#android').inner_text()
                for amount in ['8 MiB','16 MiB','32 MiB','128 MiB','256 MiB']:
                    assert amount in page.locator('#media').inner_text()
                assert page.locator('.help-jump a').count() == 4
                for section in ['windows','editions','android','media']:
                    page.locator(f'.help-jump a[href="#{section}"]').click()
                    page.wait_for_function('(id)=>location.hash=="#"+id',arg=section)
                    assert page.locator('#'+section).is_visible()
                assert page.locator('#android a[href="../android-app-privacy.html"][hreflang=ko]').count() == (0 if locale=='ko' else 1)
            for width in [1440,1024,768,390,320]:
                page.set_viewport_size({'width':width,'height':1000 if width>620 else 844})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), (locale,name,width)
            page.set_viewport_size({'width':390,'height':844})
            page.goto(url,wait_until='networkidle')
            page.screenshot(path=str(QA/f'news-{locale}-{name}-mobile.png'),full_page=True)
            page.locator('.menu-toggle').click()
            assert page.locator('#main-nav').is_visible()
            page.keyboard.press('Escape')
            assert page.locator('.menu-toggle').get_attribute('aria-expanded')=='false'
            page.goto(url+'?news=1#'+anchor,wait_until='networkidle')
            target = LOCALES[(index+1)%len(LOCALES)]
            page.locator('#site-language').select_option(target)
            page.wait_for_url(BASE+f'{target}/{name}.html?news=1#{anchor}')
            page.reload(wait_until='networkidle')
            assert page.locator('html').get_attribute('lang') == target
            page.set_viewport_size({'width':1440,'height':1000})
            reports.append({'locale':locale,'page':name,'status':200})
        print(f'PASS: {locale} release/development news, historical dates, current saving, Android status and limits.',flush=True)

    # Existing pages should now open the translated news directly.
    page.goto(BASE+'en/guide.html',wait_until='networkidle')
    page.locator('.help-card[href="releases.html"]').click()
    page.wait_for_url(BASE+'en/releases.html')
    page.goto(BASE+'fr/index.html',wait_until='networkidle')
    page.locator('a[href="development.html#android"]').first.click()
    page.wait_for_url(BASE+'fr/development.html#android')
    page.locator('#site-language').select_option('ja')
    page.wait_for_url(BASE+'ja/development.html#android')
    page.goto(BASE+'releases.html?news=1#release-history',wait_until='networkidle')
    page.wait_for_url(BASE+'ja/releases.html?news=1#release-history')
    page.locator('#site-language').select_option('system')
    page.wait_for_url(BASE+'ko/releases.html?news=1#release-history')

    # Both pages expose their text and six language links without JavaScript.
    static = browser.new_context(java_script_enabled=False)
    for locale in LOCALES:
        tab = static.new_page()
        for name in ['releases','development']:
            response = tab.goto(BASE+f'{locale}/{name}.html',wait_until='networkidle')
            assert response.status == 200
            assert tab.locator('.language-links a').count() == 6
            assert tab.locator('html').get_attribute('lang') == locale
            assert DATA['locales'][locale]['price'] in tab.locator('main').inner_text()
        tab.close()
    static.close()
    assert not errors, errors
    browser.close()

report={'base':BASE,'pages':reports,'widths':[1440,1024,768,390,320],'tests':['historical version and localized dates','current saving versus old session resumption','Free/Pro pricing and links','Android preparation and pending validation','media limits unchanged','development contents and anchors','same-page language switching and query/hash preservation','existing-page news links','system-language routing','no-JavaScript static text and language links'],'errors':errors}
(QA/('news-public-report.json' if BASE.startswith('https://') else 'news-report.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('PASS: 12 translated news pages, five widths, routing, historical/current distinctions and static fallback.')
