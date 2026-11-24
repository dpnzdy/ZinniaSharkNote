import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pages } from '../src/pages.mjs';
import { shell } from '../src/components.mjs';
import { bilingualPageIds, pageLocales, localizedHtml } from '../src/i18n.mjs';
import { config } from '../src/config.mjs';
import { consentPolicies } from '../src/consent-data.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await readFile(path.join(root,'content/policies/en/review.json'),'utf8'));
let links=0;
for (const [id,policy] of Object.entries(config.policies)) {
  const originals=await Promise.all(['','en/'].map(prefix=>readFile(path.join(root,'content/policies',prefix,policy.file),'utf8')));
  for (const [index,source] of originals.entries()) {
    const label=index?'en':'ko';
    assert.equal(createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex'),manifest[id][label],`${id}: source/translation changed; review the pair and update review.json`);
    assert.equal(source.match(index ? /Document version:?\s*([\d.]+)/ : /문서 버전:?\s*([\d.]+)/)?.[1],policy.version,`${id}: ${label} version`);
  }
  // Check complete structure rather than a summary substituted for the source.
  for(const pattern of [/^#{2,4} /gm,/^\|/gm,/^- /gm,/^\d+\. /gm])
    assert.equal((originals[0].match(pattern)||[]).length,(originals[1].match(pattern)||[]).length,`${id}: translated structure ${pattern}`);
  const columns=source=>source.split('\n').filter(line=>line.startsWith('|')).map(line=>line.split('|').length);
  assert.deepEqual(columns(originals[0]),columns(originals[1]),`${id}: table columns`);
  const external=source=>[...source.matchAll(/\]\((https:[^)]+)\)/g)].map(m=>m[1]).filter(url=>!url.startsWith(config.publicSiteUrl)).sort();
  assert.deepEqual(external(originals[0]),external(originals[1]),`${id}: external policy references`);
}
assert.equal(consentPolicies.android.version,'1.1');
assert.equal(consentPolicies.windows.version,'1.0');
for (const page of pages.filter(p=>bilingualPageIds.includes(p.id))) for (const locale of pageLocales(page.id)) {
  const file=path.join(root,locale,`${page.id}.html`), html=await readFile(file,'utf8');
  assert.equal(html,localizedHtml(page,shell(page,page.render(locale)),locale),`${locale}/${page.id}: stale build`);
  assert.ok(html.includes(`<html lang="${locale}">`));
  assert.ok(html.includes(`rel="canonical" href="${config.publicSiteUrl}${locale}/${page.id}.html"`));
  assert.equal((html.match(/rel="alternate" hreflang=/g)||[]).length,3);
  assert.equal((html.match(/<h1[\s>]/g)||[]).length,1);
  assert.equal((html.match(/data-document-language=/g)||[]).length,2);
  if(locale==='en') {
    const visible=html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<select[\s\S]*?<\/select>/g,'').replace(/<noscript[\s\S]*?<\/noscript>/g,'').replace(/<a[^>]*data-document-language="ko"[^>]*>[\s\S]*?<\/a>/g,'');
    assert.ok(!/[가-힣]/.test(visible),`${page.id}: Korean text leaked into English`);
    assert.ok(html.includes('English reference translation'));
  }
  if(config.policies[page.id]) {
    const policy=config.policies[page.id];
    if(policy.status==='draft') { assert.ok(html.includes('class="policy-draft"')); assert.ok(html.includes('noindex,follow')); }
    else { assert.ok(!html.includes('class="policy-draft"')); assert.ok(html.includes(`Document version ${policy.version}`)||html.includes(`문서 버전 ${policy.version}`)); }
  }
  for(const [,ref] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if(/^(?:https?:|mailto:|data:)/.test(ref))continue;
    const [relative,hash]=ref.split('#');
    const target=relative?path.resolve(path.dirname(file),decodeURI(relative.split('?')[0])):file;
    assert.ok((await stat(target)).isFile(),`${locale}/${page.id}: ${ref}`);
    if(hash)assert.ok((await readFile(target,'utf8')).includes(`id="${hash}"`),`${locale}/${page.id}: ${ref}`);
    links++;
  }
}
console.log(`PASS: 16 bilingual documents, ${links} links/assets, full translation structure, reviewed source pairs, versions, draft status and SEO.`);
