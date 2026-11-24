import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pages } from '../src/pages.mjs';
import { shell } from '../src/components.mjs';
import { config } from '../src/config.mjs';
import { release } from '../src/release.mjs';
import { locales, localizedPageIds, localizedHtml, translate } from '../src/i18n.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
let count = 0, links = 0;
const catalogs = await Promise.all(locales.slice(1).map(locale => readFile(new URL(`../src/locales/${locale}.json`, import.meta.url), 'utf8').then(JSON.parse)));
for (const catalog of catalogs) {
  assert.deepEqual(Object.keys(catalog), Object.keys(catalogs[0]), 'Catalog keys match');
  for (const [key, value] of Object.entries(catalog)) {
    assert.equal(typeof value, 'string');
    assert.ok(value.length, key);
    assert.deepEqual((value.match(/\{\w+\}/g) || []).sort(), (key.match(/\{\w+\}/g) || []).sort(), `Placeholder mismatch: ${key}`);
  }
}
assert.throws(() => translate('번역 누락 검사', 'en'), /Missing en translation/);
for (const page of pages.filter(page => localizedPageIds.includes(page.id))) for (const locale of locales) {
  const filename = path.join(root, locale, `${page.id}.html`);
  const html = await readFile(filename, 'utf8');
  assert.ok(!html.includes('${'), `${locale}/${page.id}: unresolved template interpolation`);
  assert.equal(html, localizedHtml(page, shell(page, page.render()), locale), `Stale ${locale}/${page.id}`);
  assert.ok(html.includes(`<html lang="${locale}">`));
  assert.ok(html.includes(`<link rel="canonical" href="${config.publicSiteUrl}${locale}/${page.id}.html">`));
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.equal((html.match(/aria-current="page"/g) || []).length, ['index','download','support','guide'].includes(page.id)?1:0);
  for (const alternate of locales) assert.ok(html.includes(`hreflang="${alternate}" href="${config.publicSiteUrl}${alternate}/${page.id}.html"`));
  assert.equal((html.match(/<option /g) || []).length, 7);
  assert.ok(html.includes(`value="${locale}" lang="${locale}" selected`));
  assert.ok(html.includes('id="site-messages"'));
  if (locale !== 'ko') {
    const content = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<select[\s\S]*?<\/select>/g, '').replace(/<noscript[\s\S]*?<\/noscript>/g, '').replace(/<!--site-language-links-->[\s\S]*?<!--\/site-language-links-->/g, '');
    assert.ok(!/[가-힣]/.test(content), `Korean leaked into ${locale}/${page.id}`);
    assert.ok(!html.includes('data-search='), 'FAQ search uses translated visible text');
  }
  assert.ok(!/\{(?:version|releaseDate|firstReleaseDate|email|year|trialDays|proPrice|blockLimit|mediaLimit)\}/.test(html), 'No unresolved release placeholders');
  if (release.released && ['index','download','support','installation'].includes(page.id)) for (const url of [release.storeUrl, release.proStoreUrl]) assert.ok(html.includes(`href="${url}" target="_blank" rel="noopener" data-store-link`),`${locale}/${page.id}: separate edition Store URL`);
  if(page.id==='download') for(const value of [release.proPrice,String(release.editions.trialDays),String(release.editions.blockLimit),String(release.editions.mediaLimit),'id="editions"']) assert.ok(html.includes(value), `${locale}: missing edition fact ${value}`);
  const markup = html.replace(/<script[\s\S]*?<\/script>/g, '');
  for (const [, reference] of markup.matchAll(/(?:href|src|data-lazy-video)="([^"]+)"/g)) {
    if (/^(?:https?:|mailto:|data:)/.test(reference)) continue;
    const [file, hash] = reference.split('#');
    const target = file ? path.resolve(path.dirname(filename), decodeURI(file.split('?')[0])) : filename;
    assert.ok((await stat(target)).isFile(), `${locale}/${page.id}: ${reference}`);
    if (hash) assert.ok((await readFile(target, 'utf8')).includes(`id="${hash}"`), `Missing anchor: ${reference}`);
    links++;
  }
  count++;
}
console.log(`PASS: ${count} localized pages, ${links} local links/assets, 5 complete catalogs, placeholders, SEO, static translations and legacy links.`);
