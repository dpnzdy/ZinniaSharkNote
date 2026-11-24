import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { pages } from '../src/pages.mjs';
import { config } from '../src/config.mjs';
import { release } from '../src/release.mjs';
import { shell, esc } from '../src/components.mjs';
import { localizedHtml, pageLocales, localizedPageIds, translate } from '../src/i18n.mjs';
import { canonicalUrl, sitemapXml, verificationMeta } from '../src/seo.mjs';

const root=new URL('../',import.meta.url);
const xml=await readFile(new URL('sitemap.xml',root),'utf8');
assert.equal(xml,sitemapXml(pages),'Sitemap is stale');
assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
assert.ok(xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
assert.ok(!/<(?:lastmod|priority|changefreq)>/.test(xml),'No fabricated update dates or ranking hints');
const listed=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.equal(new Set(listed).size,listed.length,'No duplicate sitemap URLs');
for (const file of config.seo?.verificationFiles || []) {
  assert.match(file,/^google[a-f0-9]+\.html$/);
  assert.equal((await readFile(new URL(file,root),'utf8')).trim(),`google-site-verification: ${file}`);
  assert.ok(!listed.includes(new URL(file,config.publicSiteUrl).href),'Verification files are not sitemap content');
}

const expected=[];
let documents=0,appPages=0;
for(const page of pages) {
  const legacy=await readFile(new URL(`${page.id}.html`,root),'utf8');
  assert.ok(legacy.includes(`rel="canonical" href="${config.publicSiteUrl}ko/${page.id}.html"`),`${page.id}: consolidate legacy Korean alias`);
  for(const locale of pageLocales(page.id)) {
    const html=await readFile(new URL(`${locale}/${page.id}.html`,root),'utf8');
    const canonical=html.match(/rel="canonical" href="([^"]+)"/)[1];
    assert.equal(canonical,`${config.publicSiteUrl}${locale}/${page.id}.html`);
    assert.ok(html.includes(`property="og:url" content="${canonical}"`));
    const noindex=html.includes('name="robots" content="noindex,follow"');
    if(!noindex)expected.push(canonical);
    else assert.ok(!listed.includes(canonical),'Draft/noindex excluded from sitemap');
    const alternate=[...html.matchAll(/rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
    assert.equal(alternate.length,pageLocales(page.id).length+1);
    assert.equal(alternate.find(m=>m[1]==='x-default')[2],`${config.publicSiteUrl}en/${page.id}.html`);
    for(const [,code,url] of alternate) {
      const target=await readFile(new URL(url.slice(config.publicSiteUrl.length),root),'utf8');
      assert.ok(target.includes(`rel="canonical" href="${url}"`),'Alternates target canonical pages');
      if(code!=='x-default') assert.ok(target.includes(`hreflang="${locale}" href="${canonical}"`),'Reciprocal language links');
    }
    if(localizedPageIds.includes(page.id)) {
      const bar=html.match(/<!--site-language-links-->([\s\S]*?)<!--\/site-language-links-->/)?.[1];
      assert.ok(bar && !bar.includes('<noscript>'),'Language links visible without a script condition');
      for(const code of pageLocales(page.id))assert.ok(bar.includes(`href="../${code}/${page.id}.html" lang="${code}"`));
    }
    const scripts=[...html.matchAll(/<script type="application\/ld\+json" id="app-structured-data">([\s\S]*?)<\/script>/g)];
    if(['index','download'].includes(page.id) && release.released) {
      assert.equal(scripts.length,1);
      const data=JSON.parse(scripts[0][1]);
      assert.equal(data['@context'],'https://schema.org');
      const webpage=data['@graph'].find(item=>item['@type']==='WebPage');
      assert.equal(webpage.url,canonical); assert.equal(webpage.inLanguage,locale);
      const apps=data['@graph'].filter(item=>item['@type']==='SoftwareApplication');
      assert.equal(apps.length,2);
      const visible=html.slice(html.indexOf('<main'),html.indexOf('</main>')).replace(/<script[\s\S]*?<\/script>/g,'');
      for(const [i,app] of apps.entries()) {
        assert.equal(app.applicationCategory,'ProductivityApplication');
        assert.equal(app.operatingSystem,translate(release.systemRequirements,locale));
        assert.ok(!('softwareVersion' in app) && !('datePublished' in app),'Historical release facts are not current app metadata');
        assert.ok(!('aggregateRating' in app) && !('review' in app),'No invented reviews');
        assert.equal(app.downloadUrl,i?release.proStoreUrl:release.storeUrl);
        assert.equal(app.offers.url,app.downloadUrl);
        assert.equal(app.offers.price,i?config.windowsEditions.proPriceUSD:0);
        assert.equal(app.offers.priceCurrency,'USD');
        assert.ok(visible.includes(`href="${app.offers.url}"`));
        assert.ok(visible.includes(esc(app.description)),`${locale}/${page.id}: app description appears in visible content`);
      }
      appPages++;
    } else assert.equal(scripts.length,0);
    documents++;
  }
}
assert.deepEqual(listed.sort(),expected.sort(),'Sitemap contains exactly indexable canonical pages');
assert.throws(()=>canonicalUrl('app-privacy','de'),/No de page/);
assert.throws(()=>sitemapXml([...pages,pages.find(page=>page.id==='index')]),/Duplicate/);
assert.equal(verificationMeta({seo:{verification:{google:'',bing:'',naver:''}}},{}),'');
assert.throws(()=>verificationMeta({seo:{verification:{google:'<meta name="google-site-verification">'}}},{}),/content value/);
const tokens={google:'google_test-01',bing:'BING_TEST_02',naver:'NAVER_TEST_03'};
const settings={seo:{verification:tokens}};
const tags=verificationMeta(settings,{});
for(const [name,value] of [['google-site-verification',tokens.google],['msvalidate.01',tokens.bing],['naver-site-verification',tokens.naver]])assert.ok(tags.includes(`name="${name}" content="${value}"`));
assert.ok(verificationMeta(settings,{GOOGLE_SITE_VERIFICATION:'env_override'}).includes('content="env_override"'));

// Render configured tokens in an isolated process; test values never enter generated deployment files.
assert.equal(verificationMeta(settings,{GOOGLE_SITE_VERIFICATION:'',BING_SITE_VERIFICATION:'',NAVER_SITE_VERIFICATION:''}),'','Explicit empty environment values suppress tags');
const configured=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`
  import {config} from './src/config.mjs';
  config.seo.verification=${JSON.stringify(tokens)};
  const {pages}=await import('./src/pages.mjs');
  const {shell}=await import('./src/components.mjs');
  const {localizedHtml,pageLocales}=await import('./src/i18n.mjs');
  console.log(JSON.stringify(pages.flatMap(page=>[shell(page,page.render()),...pageLocales(page.id).map(locale=>localizedHtml(page,shell(page,page.render(locale)),locale))])));
`],{cwd:root,encoding:'utf8',maxBuffer:12*1024*1024,env:Object.fromEntries(Object.entries(process.env).filter(([key])=>!['GOOGLE_SITE_VERIFICATION','BING_SITE_VERIFICATION','NAVER_SITE_VERIFICATION'].includes(key)))}));
assert.equal(configured.length,pages.reduce((count,page)=>count+1+pageLocales(page.id).length,0));
for(const html of configured) {
  const head=html.slice(0,html.indexOf('</head>'));
  assert.ok(head.includes(tags),'Verification tokens embedded unchanged in every static head');
}
console.log(`PASS: ${documents} localized documents + ${pages.length} aliases; ${listed.length} sitemap URLs; ${appPages} app JSON-LD pages; canonical/hreflang, visible language links and verification configuration.`);
