"""Validate served SEO artifacts and language navigation locally or with SITE_BASE_URL."""
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json, os, xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
BASE=os.environ.get('SITE_BASE_URL','http://127.0.0.1:4173/').rstrip('/')+'/'
PUBLIC='https://dpnzdy.github.io/ZinniaSharkNote/'
LOCALES=['ko','en','de','es','fr','ja']
QA=ROOT/'.qa'; QA.mkdir(exist_ok=True)
FILES=list(ROOT.glob('*.html'))
for locale in LOCALES: FILES.extend((ROOT/locale).glob('*.html'))
FILES.extend(ROOT/name for name in ['assets/language.js','assets/site.js','assets/style.css','sitemap.xml'])

class Head(HTMLParser):
    def __init__(self,source):
        super().__init__(); self.canonical=None; self.noindex=False; self.feed(source)
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='link' and attrs.get('rel')=='canonical': self.canonical=attrs['href']
        if tag=='meta' and attrs.get('name')=='robots': self.noindex='noindex' in attrs['content']

def fetch(file):
    name=file.relative_to(ROOT).as_posix()
    with urlopen(Request(BASE+name,headers={'Cache-Control':'no-cache'}),timeout=45) as response:
        assert response.status==200,(name,response.status)
        content=response.read().decode('utf-8').replace('\r\n','\n')
        assert content==file.read_text(encoding='utf-8'),('Served content differs from generated file',name)
        if name=='sitemap.xml': assert 'xml' in response.headers.get('Content-Type',''),response.headers
        return name,content

with ThreadPoolExecutor(max_workers=6) as pool: served=dict(pool.map(fetch,FILES))
xml=ET.fromstring(served['sitemap.xml'])
urls=[loc.text for loc in xml.findall('{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
assert len(urls)==len(set(urls))
for url in urls:
    path=url.removeprefix(PUBLIC)
    assert path in served,url
    metadata=Head(served[path])
    assert metadata.canonical==url and not metadata.noindex,url
assert all(Head(html).canonical in urls for name,html in served.items() if name.endswith('.html') and not Head(html).noindex)
print(f'PASS: {len(served)} served files match generated content; valid XML with {len(urls)} canonical indexable URLs',flush=True)

errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    context=browser.new_context(locale='en-US',viewport={'width':1440,'height':1000})
    page=context.new_page(); page.on('pageerror',lambda error:errors.append(str(error)))
    key=f'zinniashark-note:{urlparse(BASE).path}:language'
    for locale in LOCALES:
        for name in ['index','download']:
            page.goto(BASE+f'{locale}/{name}.html',wait_until='networkidle')
            data=json.loads(page.locator('#app-structured-data').text_content())
            apps=[item for item in data['@graph'] if item['@type']=='SoftwareApplication']
            assert [item['offers']['price'] for item in apps]==[0,15.99]
            assert all('softwareVersion' not in item and 'aggregateRating' not in item for item in apps)
            assert page.locator('.site-language-links a').count()==6
            for width in [1440,1024,768,390,320]:
                page.set_viewport_size({'width':width,'height':844})
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(locale,name,width)
                assert page.locator('.site-language-links').is_visible()
            if name=='index' and locale in ['ko','en','ja']:
                page.locator('.site-language-links').scroll_into_view_if_needed()
                page.screenshot(path=str(QA/f'seo-footer-{locale}-mobile.png'))
            page.set_viewport_size({'width':1440,'height':1000})
        page.goto(BASE+f'{locale}/guide.html?seo=1#start',wait_until='networkidle')
        page.locator('.guide-sidebar a[href="#save"]').click()
        target=LOCALES[(LOCALES.index(locale)+1)%len(LOCALES)]
        page.locator(f'[data-site-language={target}]').click()
        page.wait_for_url(BASE+f'{target}/guide.html?seo=1#save')
        assert page.evaluate('(key)=>localStorage.getItem(key)',key)==target
        assert page.locator('#site-language').input_value()==target
        page.goto(BASE+'support.html',wait_until='networkidle')
        page.wait_for_url(BASE+f'{target}/support.html')
    # Legacy policy endpoints keep their content and consolidate with the /ko/ representative.
    for name in ['app-privacy','android-app-privacy','privacy','support-consent']:
        page.goto(BASE+name+'.html',wait_until='networkidle')
        assert page.url==BASE+name+'.html'
        assert page.locator('html').get_attribute('lang')=='ko'
        assert page.locator('link[rel=canonical]').get_attribute('href')==PUBLIC+f'ko/{name}.html'
    static=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    tab=static.new_page()
    for locale in LOCALES:
        tab.goto(BASE+f'{locale}/index.html',wait_until='networkidle')
        assert tab.locator('.site-language-links a').count()==6
        for code in LOCALES:
            assert tab.locator(f'[data-site-language={code}]').evaluate('(e)=>e.href')==BASE+f'{code}/index.html'
        target=LOCALES[(LOCALES.index(locale)+1)%len(LOCALES)]
        tab.locator(f'[data-site-language={target}]').click()
        assert tab.locator('html').get_attribute('lang')==target
        assert json.loads(tab.locator('#app-structured-data').text_content())['@context']=='https://schema.org'
    assert not errors,errors
    browser.close()
(QA/'seo-report.json').write_text(json.dumps({'base':BASE,'files':len(served),'sitemapUrls':len(urls),'consoleErrors':errors},indent=2),encoding='utf-8')
print('PASS: 12 app pages at five widths, six-language links, saved preference/query/anchor, legacy policy aliases and no-JS access')
