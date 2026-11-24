// Localized strings are embedded at build time; all page content is already static HTML.
const siteMessages = JSON.parse(document.querySelector('#site-messages')?.textContent || '{}');
const siteLocale = document.documentElement.lang || 'ko';
const siteRoot = new URL('../', document.currentScript.src);
const ui = (key, values = {}) => Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, value), siteMessages[key] || key);
// Optional materials: collect two explicit choices locally, then let the visitor compose mail.
const consentSection = document.querySelector('[data-support-consent]');
if (consentSection) {
  const platform = document.querySelector('#consent-platform');
  const policyLink = document.querySelector('[data-consent-policy]');
  const policyDate = document.querySelector('[data-consent-policy-date]');
  const policies = JSON.parse(consentSection.dataset.policies);
  const messages = JSON.parse(consentSection.dataset.messages);
  const text = (key, values={}) => Object.entries(values).reduce((result,[name,value])=>result.replaceAll(`{${name}}`,value),messages[key]);
  if (new URLSearchParams(location.search).get('platform') === 'android') platform.value = 'android';
  const purpose = document.querySelector('#consent-purpose');
  const caseInput = document.querySelector('#consent-case');
  const collect = document.querySelector('#consent-collect');
  const overseas = document.querySelector('#consent-overseas');
  const compose = document.querySelector('[data-consent-mail]');
  const status = document.querySelector('[data-consent-status]');
  function updateConsent(reset = false) {
    const policy = policies[platform.value];
    policyLink.href = policy.href;
    policyLink.textContent = text('policy',{platform:policy.name});
    policyDate.textContent = text('policyDate',{date:new Intl.DateTimeFormat(siteLocale,{dateStyle:'long',timeZone:'UTC'}).format(new Date(`${policy.date}T00:00:00Z`)),version:policy.version});
    const diagnostic = purpose.value === 'diagnostic';
    if (reset) { collect.checked = false; overseas.checked = false; }
    document.querySelector('[data-diagnostic-fields]').hidden = !diagnostic;
    document.querySelector('[data-consent-collection]').textContent = text(purpose.value);
    const validCase = !diagnostic || /^ADQ-[0-9]{8}-[A-Z0-9]{4,12}$/.test(caseInput.value.trim());
    const ready = collect.checked && overseas.checked && validCase;
    compose.hidden = !ready;
    compose.removeAttribute('href');
    status.textContent = text(ready ? 'ready' : 'pending');
    if (!ready) return;
    const topic = text(diagnostic ? 'diagnosticTopic' : 'feedbackTopic',{case:caseInput.value.trim()});
    const consentDate = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const body = [
      text('typeLine',{type:text(diagnostic?'diagnosticName':'feedbackName')}),
      diagnostic ? text('caseLine',{case:caseInput.value.trim()}) : '',
      text('platformLine',{platform:policy.name}),
      text('policyLine',{platform:policy.name,version:policy.version,date:policy.date}),
      text('urlLine',{url:new URL(policy.href,location.href).href}),
      text('languageLine'),
      text('dateLine',{date:consentDate}),
      text(purpose.value),
      text('collection'), text('overseas'),
      text(diagnostic?'diagnosticBody':'feedbackBody'),
      '',
    ].filter(Boolean).join('\n');
    compose.href = `mailto:${consentSection.dataset.email}?subject=${encodeURIComponent('[ZinniaShark Note] '+topic)}&body=${encodeURIComponent(body)}`;
  }
  document.querySelector('#site-language')?.addEventListener('change',()=>updateConsent(true));
  document.querySelectorAll('[data-document-language]').forEach(link=>link.addEventListener('click',()=>updateConsent(true)));
  purpose.addEventListener('change', () => updateConsent(true));
  platform.addEventListener('change', () => {
    const currentURL = new URL(location.href);
    currentURL.searchParams.set('platform', platform.value);
    history.replaceState(null, '', currentURL);
    document.querySelectorAll('[data-document-language]').forEach(link => {
      const target = new URL(link.href); target.search = currentURL.search; link.href = target.href;
    });
    updateConsent(true);
  });
  [collect, overseas, caseInput].forEach(control => control.addEventListener('input', () => updateConsent()));
  window.addEventListener('pageshow', () => updateConsent(true));
  window.addEventListener('languagechange', () => updateConsent(true));
  updateConsent(true);
}
// Progressive enhancement. Navigation, document links, FAQs and media also work without JS.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu(returnFocus = false) {
  if (!menuButton || !navigation) return;
  navigation.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', ui('메뉴 열기'));
  if (returnFocus) menuButton.focus();
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', ui(open ? '메뉴 닫기' : '메뉴 열기'));
});
navigation?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
document.addEventListener('click', e => {
  if (!e.target.closest('.site-header')) closeMenu();
});
matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

function initTabs(selector, activate) {
  const buttons = [...document.querySelectorAll(selector)];
  if (!buttons.length) return;
  function select(button, focus = false) {
    for (const tab of buttons) {
      const current = tab === button;
      tab.setAttribute('aria-selected', String(current));
      tab.tabIndex = current ? 0 : -1;
    }
    activate(button);
    if (focus) button.focus();
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (e.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = buttons.length - 1;
      if (next !== undefined) { e.preventDefault(); select(buttons[next], true); }
    });
  });
}
const demos = {
  creative: { kicker: 'CREATIVE NOTE / 01', title: '생각이 머무는 순간', subtitle: '한 장의 이미지에서 시작되는 나의 이야기.', image: 'assets/sample-space.webp', alt: '우주를 배경으로 함께 앉아 있는 두 사람', quote: '“글만으로 담기 어려운 생각도, 함께.”' },
  study: { kicker: 'STUDY NOTE / 02', title: '오늘 배운 작은 발견', subtitle: '참고 자료와 내 설명을 같은 흐름으로.', image: 'assets/sample-study.webp', alt: '테이블 위에서 문서를 함께 살펴보는 두 사람', quote: '“보고 들은 것에, 나의 생각을 덧붙여요.”' },
};
initTabs('[data-demo]', button => {
  const demo = demos[button.dataset.demo];
  if (!demo) return;
  for (const key of ['kicker','title','subtitle','quote']) document.querySelector(`[data-demo-${key}]`).textContent = ui(demo[key]);
  const image = document.querySelector('[data-demo-image]');
  image.src = new URL(demo.image, siteRoot).href; image.alt = ui(demo.alt);
  document.querySelector('#document-demo').setAttribute('aria-labelledby', button.id);
});
initTabs('[data-media-tab]', button => {
  const selected = button.dataset.mediaTab;
  document.querySelectorAll('.media-panel').forEach(panel => {
    const active = panel.id === 'panel-' + selected;
    panel.hidden = !active;
    if (!active) panel.querySelectorAll('audio, video').forEach(media => media.pause());
  });
  if (selected === 'video') {
    const video = document.querySelector('[data-lazy-video]');
    if (video && !video.getAttribute('src')) { video.src = video.dataset.lazyVideo; video.load(); }
  }
});

const search = document.querySelector('#faq-search');
const questions = [...document.querySelectorAll('.faq-item')];
function searchFaq() {
  const terms = search.value.trim().toLocaleLowerCase(siteLocale).split(/\s+/).filter(Boolean);
  let visible = 0;
  questions.forEach(question => {
    const content = (question.dataset.search || question.textContent).toLocaleLowerCase(siteLocale);
    const matches = terms.every(term => content.includes(term));
    question.hidden = !matches;
    if (matches) visible++;
  });
  document.querySelector('.faq-empty').hidden = visible !== 0;
  document.querySelector('.faq-search-status').textContent = terms.length ? ui('{count}개의 질문을 찾았습니다.', {count:visible}) : ui('전체 {count}개의 질문입니다.', {count:questions.length});
}
search?.addEventListener('input', searchFaq);
document.querySelector('[data-clear-search]')?.addEventListener('click', () => {
  search.value = ''; searchFaq(); search.focus();
});
let toastTimer;
function toast(message) {
  const node = document.querySelector('.toast');
  if (!node) return;
  clearTimeout(toastTimer); node.hidden = false; node.textContent = message;
  toastTimer = setTimeout(() => { node.hidden = true; }, 4500);
}
document.querySelector('[data-copy-email]')?.addEventListener('click', async e => {
  const email = e.currentTarget.dataset.copyEmail;
  try {
    await Promise.race([
      navigator.clipboard.writeText(email),
      new Promise((_, reject) => setTimeout(() => reject(new Error('clipboard-timeout')), 1800)),
    ]);
    toast(ui('이메일 주소를 복사했습니다.'));
  } catch {
    const text = document.querySelector('.contact-email');
    const range = document.createRange(); range.selectNodeContents(text);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    toast(ui('주소를 선택했습니다. Ctrl+C 또는 길게 눌러 복사해주세요.'));
  }
});

const guideLinks = [...document.querySelectorAll('.guide-sidebar nav a')];
if (guideLinks.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const entry = entries.filter(e => e.isIntersecting).sort((a,b) => a.boundingClientRect.top-b.boundingClientRect.top)[0];
    if (!entry) return;
    guideLinks.forEach(link => {
      const active = link.hash === '#' + entry.target.id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-110px 0px -45% 0px', threshold: 0 });
  document.querySelectorAll('.guide-section').forEach(section => observer.observe(section));
}
