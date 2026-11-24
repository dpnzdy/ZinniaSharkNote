import { config } from './config.mjs';
import { release } from './release.mjs';
import { pageLocales } from './page-locales.mjs';

const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const pageTitle = page => page.id==='index' ? 'ZinniaShark Note — 글과 자료를 한 문서에' : `${page.title} — ZinniaShark Note`;

export function canonicalUrl(id, locale='ko', settings=config) {
  if (!pageLocales(id).includes(locale)) throw new Error(`No ${locale} page: ${id}`);
  return settings.publicSiteUrl ? new URL(`${locale}/${id}.html`,settings.publicSiteUrl).href : null;
}

export const isIndexable = page => !(page.policy && page.policyStatus!=='final');

export function verificationMeta(settings=config, environment=process.env) {
  const providers = [
    ['google','GOOGLE_SITE_VERIFICATION','google-site-verification'],
    ['bing','BING_SITE_VERIFICATION','msvalidate.01'],
    ['naver','NAVER_SITE_VERIFICATION','naver-site-verification'],
  ];
  return providers.map(([provider,variable,name])=>{
    const value = environment[variable] ?? settings.seo?.verification?.[provider] ?? '';
    if (typeof value!=='string') throw new Error(`${variable}: use the verification tag's content value only`);
    const token=value.trim();
    if (!token) return '';
    if (!/^[A-Za-z0-9_=-]+$/.test(token)) throw new Error(`${variable}: use the verification tag's content value, not a full HTML tag`);
    return `<meta name="${name}" content="${escape(token)}">`;
  }).join('');
}

export function appStructuredData(page, locale='ko', translate=value=>value) {
  if (!['index','download'].includes(page.id) || !config.publicSiteUrl || !release.released) return '';
  const url=canonicalUrl(page.id,locale), base=config.publicSiteUrl;
  const publisher={'@id':`${base}#publisher`};
  const apps=[['free',config.name,release.storeUrl,0,release.freeAnswer],['pro',`${config.name} Pro`,release.proStoreUrl,release.editions.proPriceUSD,release.priceAnswer]];
  const data={
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'Organization',...publisher,name:'ZINNIASHARK',url:canonicalUrl('index','ko')},
      {'@type':'WebPage','@id':`${url}#webpage`,url,name:translate(pageTitle(page)),description:translate(page.description),inLanguage:locale,publisher,
        about:apps.map(([edition])=>({'@id':`${base}#windows-${edition}`}))},
      ...apps.map(([edition,name,storeUrl,price,description])=>({
        '@type':'SoftwareApplication','@id':`${base}#windows-${edition}`,name,
        applicationCategory:'ProductivityApplication',operatingSystem:translate(release.systemRequirements),
        url:canonicalUrl('download',locale),downloadUrl:storeUrl,
        image:new URL('assets/app-icon.webp?v=20261108',base).href,
        description:translate(page.id==='download'?description:release.description),publisher,
        offers:{'@type':'Offer',url:storeUrl,price,priceCurrency:'USD'},
      })),
    ],
  };
  // Keep JSON valid in both static HTML and script context; never invent ratings or current version dates.
  const json=JSON.stringify(data).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  return `<script type="application/ld+json" id="app-structured-data">${json}</script>`;
}

export function sitemapXml(pages) {
  if (!config.publicSiteUrl) throw new Error('A public site URL is required to generate the sitemap');
  const entries=pages.filter(isIndexable).flatMap(page=>pageLocales(page.id).map(locale=>canonicalUrl(page.id,locale)));
  if (new Set(entries).size!==entries.length) throw new Error('Duplicate sitemap URL');
  // Omit lastmod until a trustworthy per-page modification source exists.
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(url=>`  <url><loc>${escape(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
}
