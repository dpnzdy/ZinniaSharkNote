// Static language URLs are authoritative. Only legacy entry URLs select a language automatically.
(() => {
  const locales = ['ko', 'en', 'de', 'es', 'fr', 'ja'];
  const names = {ko:'한국어', en:'English', de:'Deutsch', es:'Español', fr:'Français', ja:'日本語'};
  const translatedPages = ['index', 'download', 'support', 'guide', 'installation', 'troubleshooting'];
  const root = new URL('../', document.currentScript.src);
  const storageKey = `zinniashark-note:${root.pathname}:language`;
  const picker = document.querySelector('#site-language');
  if (!picker) return;
  const relative = location.pathname.slice(root.pathname.length);
  const explicit = locales.find(locale => relative.startsWith(`${locale}/`));
  const page = document.body.dataset.page;
  const current = document.documentElement.lang;
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
  let followsSystem = preference === 'system' && resolved === current;
  const go = (locale, replace = false) => {
    const target = new URL(`${locale}/${translatedPages.includes(page) ? page : 'index'}.html`, root);
    target.search = location.search;
    // All translated pages share IDs; unrelated Korean pages have no matching anchors.
    if (translatedPages.includes(page)) target.hash = location.hash;
    if (target.href !== location.href) location[replace ? 'replace' : 'assign'](target.href);
  };
  // Do not redirect untranslated policy/news URLs or explicit locale URLs, even with a saved preference.
  if (!explicit && translatedPages.includes(page)) {
    if (stored === null) write('system');
    go(resolved, true);
    return;
  }
  picker.value = followsSystem ? 'system' : current;
  const status = document.querySelector('#language-status');
  status.textContent = label('현재 표시 언어: {language}', {language:names[current]});
  picker.addEventListener('change', () => {
    const choice = picker.value;
    if (choice !== 'system' && !locales.includes(choice)) return;
    write(choice);
    followsSystem = choice === 'system';
    go(followsSystem ? detect() : choice);
  });
  window.addEventListener('languagechange', () => {
    if (followsSystem && translatedPages.includes(page)) go(detect(), true);
  });
  // Update the selector on history restoration without overriding the URL the visitor returned to.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    followsSystem = read() === 'system' && detect() === current;
    picker.value = followsSystem ? 'system' : current;
  });
})();
