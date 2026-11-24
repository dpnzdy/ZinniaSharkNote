// Static language URLs are authoritative. Only legacy entry URLs select a language automatically.
(() => {
  const locales = ['ko', 'en', 'de', 'es', 'fr', 'ja'];
  const names = {ko:'한국어', en:'English', de:'Deutsch', es:'Español', fr:'Français', ja:'日本語'};
  const translatedPages = ['index', 'download', 'support', 'guide', 'installation', 'troubleshooting', 'releases', 'development'];
  const bilingualPages = ['policies', 'app-privacy', 'android-app-privacy', 'eula', 'license', 'lifecycle', 'support-consent', 'privacy'];
  const root = new URL('../', document.currentScript.src);
  const storageKey = `zinniashark-note:${root.pathname}:language`;
  const picker = document.querySelector('#site-language');
  if (!picker) return;
  const relative = location.pathname.slice(root.pathname.length);
  const explicit = locales.find(locale => relative.startsWith(`${locale}/`));
  const page = document.body.dataset.page;
  const current = document.documentElement.lang;
  const bilingual = bilingualPages.includes(page);
  const messages = JSON.parse(document.querySelector('#site-messages')?.textContent || '{}');
  const label = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), messages[key] || key);
  const read = () => { try { return localStorage.getItem(storageKey); } catch { return null; } };
  const write = value => { try { localStorage.setItem(storageKey, value); } catch { /* Private/storage-disabled mode still permits switching. */ } };
  const detect = () => {
    for (const preference of navigator.languages?.length ? navigator.languages : [navigator.language || '']) {
      const language = preference.toLowerCase().split(/[-_]/)[0];
      if (locales.includes(language)) return language;
    }
    return 'en';
  };
  const stored = read();
  const preference = stored === 'system' || locales.includes(stored) ? stored : 'system';
  const resolved = preference === 'system' ? detect() : preference;
  let followsSystem = preference === 'system' && (bilingual || resolved === current);
  const go = (locale, replace = false) => {
    const target = new URL(`${bilingual && locale !== 'ko' ? 'en' : locale}/${translatedPages.includes(page) || bilingual ? page : 'index'}.html`, root);
    target.search = location.search;
    // Translations share section IDs, including the bilingual policy documents.
    if (translatedPages.includes(page) || bilingual) target.hash = location.hash;
    if (target.href !== location.href) location[replace ? 'replace' : 'assign'](target.href);
  };
  // Keep legacy policy URLs in Korean and honor every explicit locale URL.
  if (!explicit && translatedPages.includes(page)) {
    if (stored === null) write('system');
    go(resolved, true);
    return;
  }
  picker.value = bilingual ? preference : followsSystem ? 'system' : current;
  // These are ordinary crawlable links; JS adds preference persistence and current section context.
  const updateSiteLanguageLinks = () => document.querySelectorAll('[data-site-language]').forEach(link => {
    const target = new URL(link.href); target.search = location.search; target.hash = location.hash; link.href = target.href;
  });
  updateSiteLanguageLinks();
  window.addEventListener('hashchange', updateSiteLanguageLinks);
  document.querySelectorAll('[data-site-language]').forEach(link => link.addEventListener('click', () => {
    updateSiteLanguageLinks();
    write(link.dataset.siteLanguage);
    followsSystem = false;
    picker.value = link.dataset.siteLanguage;
  }));

  const updateDocumentLinks = () => document.querySelectorAll('[data-document-language]').forEach(link => {
    const target = new URL(link.href);
    target.search = location.search;
    target.hash = location.hash;
    link.href = target.href;
  });
  updateDocumentLinks();
  document.querySelectorAll('[data-document-language]').forEach(link=>link.addEventListener('click',updateDocumentLinks));
  window.addEventListener('hashchange',updateDocumentLinks);
  // Keep navigation back to main pages in the visitor's chosen site language.
  const routeMainLinks = locale => { if (!bilingual) return; document.querySelectorAll('a[href]').forEach(link => {
    const target = new URL(link.href);
    if (target.origin !== root.origin || !target.pathname.startsWith(root.pathname)) return;
    const file = target.pathname.slice(root.pathname.length).split('/').pop();
    if (!translatedPages.some(id => file === `${id}.html`)) return;
    target.pathname = `${root.pathname}${locale}/${file}`;
    link.href = target.href;
  }); };
  routeMainLinks(resolved);
  const status = document.querySelector('#language-status');
  status.textContent = label('현재 표시 언어: {language}', {language:names[current]});
  picker.addEventListener('change', () => {
    const choice = picker.value;
    if (choice !== 'system' && !locales.includes(choice)) return;
    write(choice);
    followsSystem = choice === 'system';
    const locale = followsSystem ? detect() : choice;
    routeMainLinks(locale);
    go(locale);
  });
  window.addEventListener('languagechange', () => {
    if (followsSystem) {
      routeMainLinks(detect());
      if (translatedPages.includes(page) || (bilingual && explicit)) go(detect(), true);
    }
  });
  // Update the selector on history restoration without overriding the URL the visitor returned to.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    followsSystem = read() === 'system' && (bilingual || detect() === current);
    picker.value = bilingual ? (read() || 'system') : followsSystem ? 'system' : current;
    routeMainLinks(read() && read() !== 'system' ? read() : detect());
  });
})();
