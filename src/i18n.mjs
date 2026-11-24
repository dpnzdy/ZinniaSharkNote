import { readFileSync } from 'node:fs';
import { config } from './config.mjs';
import { release } from './release.mjs';

export const locales = ['ko', 'en', 'de', 'es', 'fr', 'ja'];
export const localizedPageIds = ['index', 'download', 'support', 'guide', 'installation', 'troubleshooting', 'releases', 'development'];
export const bilingualPageIds = ['policies', 'app-privacy', 'android-app-privacy', 'eula', 'license', 'lifecycle', 'support-consent', 'privacy'];
export const pageLocales = id => bilingualPageIds.includes(id) ? ['ko', 'en'] : localizedPageIds.includes(id) ? locales : [];
const nativeNames = ['한국어', 'English', 'Deutsch', 'Español', 'Français', '日本語'];
const ogLocales = ['ko_KR', 'en_US', 'de_DE', 'es_ES', 'fr_FR', 'ja_JP'];
const catalogs = Object.fromEntries(locales.slice(1).map(locale => [locale,
  JSON.parse(readFileSync(new URL(`./locales/${locale}.json`, import.meta.url), 'utf8'))]));
const documentCatalog = JSON.parse(readFileSync(new URL('./locales/en-documents.json', import.meta.url), 'utf8'));
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const decode = text => text.replace(/&(amp|lt|gt|quot|#39);/g, (_, c) => ({amp:'&', lt:'<', gt:'>', quot:'"', '#39':"'"}[c]));

// Source phrases are checked at build time: edits cannot silently leave Korean in a translation.
// Keep release facts in config/release; catalog placeholders format them in the target language.
export function translate(source, locale) {
  if (locale === 'ko') return source;
  let key = source.replaceAll(release.proPrice, '{proPrice}')
    .replaceAll(`${release.editions.trialDays}일`, '{trialDays}일')
    .replaceAll(`${release.editions.blockLimit}개`, '{blockLimit}개')
    .replaceAll(`${release.editions.mediaLimit}개`, '{mediaLimit}개')
    .replaceAll(release.version, '{version}')
    .replaceAll(release.dateLabel || '\u0000', '{releaseDate}')
    .replaceAll(release.firstReleaseDateLabel, '{firstReleaseDate}')
    .replaceAll(config.email, '{email}')
    .replace(/© \d{4}/g, '© {year}');
  const translation = catalogs[locale]?.[key] ?? (locale === 'en' ? documentCatalog[key] : undefined);
  if (translation === undefined) {
    if (/[가-힣]/.test(source)) throw new Error(`Missing ${locale} translation: ${key}`);
    return source;
  }
  const date = value => new Intl.DateTimeFormat(locale, {dateStyle:'long', timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`));
  return translation.replaceAll('{proPrice}', release.proPrice)
    .replaceAll('{trialDays}', String(release.editions.trialDays))
    .replaceAll('{blockLimit}', String(release.editions.blockLimit))
    .replaceAll('{mediaLimit}', String(release.editions.mediaLimit))
    .replaceAll('{version}', release.version)
    .replaceAll('{releaseDate}', release.date ? date(release.date) : '')
    .replaceAll('{firstReleaseDate}', date(release.firstReleaseDate))
    .replaceAll('{email}', config.email)
    .replaceAll('{year}', String(new Date().getFullYear()));
}

export function languagePicker(pageId, locale = 'ko', nested = false) {
  const supported = pageLocales(pageId);
  const destination = supported.length ? pageId : 'index';
  const prefix = nested ? '../' : '';
  const links = supported.length === 2 ? supported : locales;
  return `<div class="language-control"><label for="site-language">${escape(translate('언어', locale))}</label><select id="site-language" aria-describedby="language-status"><option value="system">${escape(translate('시스템 설정 따르기', locale))}</option>${locales.map((code, i) => `<option value="${code}" lang="${code}"${code === locale ? ' selected' : ''}>${nativeNames[i]}</option>`).join('')}</select><span id="language-status" class="sr-only" role="status"></span><noscript><span class="language-links">${links.map(code => `<a href="${prefix}${code}/${destination}.html" lang="${code}">${nativeNames[locales.indexOf(code)]}</a>`).join('')}</span></noscript></div>`;
}

export function documentLanguages(pageId, locale='ko', nested=false) {
  if (!bilingualPageIds.includes(pageId)) return '';
  const en = locale === 'en', prefix=nested?'../':'';
  return `<!--document-languages--><aside class="container document-languages" aria-label="${en?'Document language':'문서 언어'}"><nav aria-label="${en?'Korean and English documents':'한국어·영어 문서'}">${['ko','en'].map(code=>`<a href="${prefix}${code}/${pageId}.html" lang="${code}" hreflang="${code}" data-document-language="${code}"${code===locale?' aria-current="true"':''}>${code==='ko'?'한국어':'English'}</a>`).join('')}</nav><p>${en?'This is an English reference translation of the Korean original. Translation does not change the original effective dates, scope or draft status. These documents are available in Korean and English; other site languages use English. Your site language preference is retained.':'영문은 한국어 원문의 참고 번역본입니다. 번역으로 원문의 시행일·적용 범위·초안 상태를 변경하지 않습니다. 이 문서는 한국어·영어로 제공하며, 다른 사이트 언어에서는 영어로 연결합니다. 사이트 언어 설정은 유지됩니다.'}</p></aside><!--/document-languages-->`;
}

export function languageAlternates(pageId) {
  if (!pageLocales(pageId).length || !config.publicSiteUrl) return '';
  return pageLocales(pageId).map(locale => `<link rel="alternate" hreflang="${locale}" href="${escape(new URL(`${locale}/${pageId}.html`, config.publicSiteUrl).href)}">`).join('') +
    `<link rel="alternate" hreflang="x-default" href="${escape(new URL(`${pageId}.html`, config.publicSiteUrl).href)}">`;
}

// Tokenize only our trusted generated markup. Translate text and human-facing attributes,
// never SVG paths, IDs, URLs, executable code, or user-provided markup.
const tagPattern = /<!--[\s\S]*?-->|<(?:[^<>"']|"[^"]*"|'[^']*')+>/g;
const runtimeKeys = ['메뉴 열기', '메뉴 닫기', '이메일 주소를 복사했습니다.',
  '주소를 선택했습니다. Ctrl+C 또는 길게 눌러 복사해주세요.', '{count}개의 질문을 찾았습니다.',
  '전체 {count}개의 질문입니다.', '현재 표시 언어: {language}', 'CREATIVE NOTE / 01', 'STUDY NOTE / 02',
  '생각이 머무는 순간', '한 장의 이미지에서 시작되는 나의 이야기.', '우주를 배경으로 함께 앉아 있는 두 사람',
  '“글만으로 담기 어려운 생각도, 함께.”', '오늘 배운 작은 발견', '참고 자료와 내 설명을 같은 흐름으로.',
  '테이블 위에서 문서를 함께 살펴보는 두 사람', '“보고 들은 것에, 나의 생각을 덧붙여요.”'];
function translateMarkup(html, locale) {
  let result = '', end = 0;
  const text = value => value.replace(/^(\s*)([\s\S]*?)(\s*)$/, (_, start, body, finish) => start + escape(translate(decode(body), locale)) + finish);
  for (const match of html.matchAll(tagPattern)) {
    result += text(html.slice(end, match.index));
    result += match[0].replace(/\b(alt|aria-label|placeholder|content)="([^"]*)"/g,
      (_, name, value) => `${name}="${escape(translate(decode(value), locale))}"`);
    end = match.index + match[0].length;
  }
  return result + text(html.slice(end));
}

export function localizedHtml(page, source, locale) {
  if (!pageLocales(page.id).includes(locale)) throw new Error('Unsupported localized page');
  // Inject a fresh picker after translating to preserve the native language names.
  source = source.replace(/<div class="language-control">[\s\S]*?<\/noscript><\/div>/, '');
  source = source.replace(/<!--document-languages-->[\s\S]*?<!--\/document-languages-->/, '');
  // Search visible, translated FAQ text rather than stale Korean search metadata.
  source = source.replace(/ data-search="[^"]*"/g, '');
  let html = translateMarkup(source, locale);
  html = html.replace(/href="(mailto:[^"]+)"/g, (_, encoded) => {
    const url = new URL(decode(encoded));
    const subject = url.searchParams.get('subject');
    const prefix = `[${config.name}] `;
    if (subject?.startsWith(prefix)) url.searchParams.set('subject', prefix + translate(subject.slice(prefix.length), locale));
    const body = url.searchParams.get('body');
    if (body) url.searchParams.set('body', body.split('\n').map(line => translate(line, locale)).join('\n'));
    return `href="${escape(url.href)}"`;
  });
  html = html.replace('<html lang="ko">', `<html lang="${locale}">`)
    .replace('property="og:locale" content="ko_KR"', `property="og:locale" content="${ogLocales[locales.indexOf(locale)]}"`)
    .replace(/(<link rel="canonical" href="|<meta property="og:url" content=")[^"]+"/g,
      (_, prefix) => `${prefix}${escape(new URL(`${locale}/${page.id}.html`, config.publicSiteUrl).href)}"`);
  // Resolve local links for GitHub project Pages and file previews, without a domain-root /assets assumption.
  html = html.replace(/\b(href|src|data-lazy-video)="([^"]*)"/g, (_, attr, value) => {
    if (!value || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(value)) return `${attr}="${value}"`;
    if (locales.some(code => value.startsWith(`${code}/`))) return `${attr}="../${value}"`;
    const [file] = value.split(/[?#]/);
    if (bilingualPageIds.some(id => file === `${id}.html`)) return `${attr}="../${locale==='ko'?'ko':'en'}/${value}"`;
    if (localizedPageIds.some(id => file === `${id}.html`)) return `${attr}="${value}"`;
    return `${attr}="../${value}"`;
  });
  if (locale !== 'ko' && !bilingualPageIds.includes(page.id)) {
    html = html.replace(/<a\b([^>]*href="\.\.\/(?!en\/|ko\/)[^"#?]+\.html(?:[?#][^"]*)?"[^>]*)>([\s\S]*?)<\/a>/g,
      (_, attrs, label) => `<a${attrs} hreflang="ko">${label}<span class="translation-marker"> (${escape(translate('한국어 페이지', locale))})</span></a>`);
    const notice = `<p class="container translation-notice">${escape(translate('정책·개인정보·선택 자료 안내는 한국어·영어로 제공합니다. 원본 샘플과 앱 화면은 한국어입니다.', locale))}</p>`;
    html = html.replace('<main id="main"', `${notice}<main id="main"`);
  }
  html = html.replace('<main id="main" tabindex="-1">', `<main id="main" tabindex="-1">${documentLanguages(page.id,locale,true)}`);
  html = html.replace('</nav></div></header>', `</nav>${languagePicker(page.id, locale, true)}</div></header>`);
  const messages = JSON.stringify(Object.fromEntries(runtimeKeys.map(key => [key, translate(key, locale)])))
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  html = html.replace('</head>', `<script type="application/json" id="site-messages">${messages}</script></head>`);
  return html;
}
