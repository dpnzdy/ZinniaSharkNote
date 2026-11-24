import { writeFile, stat, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { pages } from '../src/pages.mjs';
import { shell } from '../src/components.mjs';
import { config } from '../src/config.mjs';
import { pageLocales, localizedHtml } from '../src/i18n.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(config.publicSiteUrl && (!/^https:\/\/[^\s"<>]+\/$/.test(config.publicSiteUrl))) throw new Error('Use the confirmed HTTPS site base URL with a trailing slash.');
if(config.storeUrl && (!config.storeUrl.startsWith('https://') || /[\s"<>]/.test(config.storeUrl))) throw new Error('Use a valid official HTTPS Store URL.');
await Promise.all([config.sampleAdq,config.sampleHtml].map(f=>stat(path.join(root,f))));
for(const page of pages){
  const html = shell(page,page.render());
  await writeFile(path.join(root,page.id+'.html'),html,'utf8');
  console.log('Built '+page.id+'.html');
  for (const locale of pageLocales(page.id)) {
    await mkdir(path.join(root, locale), {recursive:true});
    await writeFile(path.join(root, locale, page.id+'.html'), localizedHtml(page, shell(page,page.render(locale)), locale), 'utf8');
    console.log(`Built ${locale}/${page.id}.html`);
  }
}
