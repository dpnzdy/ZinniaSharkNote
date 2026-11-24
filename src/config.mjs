// Store URL, release version and prices must come from the confirmed public listing.
export const config = {
  name: 'ZinniaShark Note',
  previousName: 'Adequora Writer',
  renameStatus: 'published',
  firstReleaseDate: '2026-11-03',
  email: 'dpnzdy@zinniashark.com',
  releaseStatus: 'released',
  plannedVersion: '1.0',
  storeUrl: 'https://apps.microsoft.com/detail/9NKD9SB9HXMM',
  // Current Windows offers confirmed by the owner on 2026-11-24.
  // The version/date below describe the separately verified historical release record.
  windowsEditions: {
    proStoreUrl: 'https://apps.microsoft.com/detail/9PFRH9QLST85',
    trialDays: 30,
    proPriceUSD: 15.99,
    blockLimit: 500,
    mediaLimit: 15,
  },
  releaseVersion: '1.0.2.0',
  releaseDate: '2026-11-06',
  publicSiteUrl: 'https://dpnzdy.github.io/ZinniaSharkNote/',
  seo: {
    // Paste only the real tag's content value; blank values emit no verification tag.
    // Build-time GOOGLE_SITE_VERIFICATION / BING_SITE_VERIFICATION / NAVER_SITE_VERIFICATION override these.
    verification: { google: '', bing: '', naver: '' },
  },
  policies: {
    'app-privacy': { status: 'final', version: '1.0', effectiveDate: '2026-11-01', file: 'APP-PRIVACY-1.0.md' },
    'android-app-privacy': { status: 'final', version: '1.1', effectiveDate: '2026-11-13', file: 'APP-PRIVACY-ANDROID-1.0.md' },
    eula: { status: 'draft', version: '0.1', file: 'EULA.md' },
    license: { status: 'draft', version: '0.2', file: 'DISTRIBUTION-AND-LICENSE-POLICY.md' },
    lifecycle: { status: 'draft', version: '0.1', file: 'SUPPORT-LIFECYCLE-AND-UPDATES.md' },
  },
  sampleAdq: 'docs/04_Adequora_Writer_글과_자료를_한_문서에.adq',
  sampleHtml: 'docs/04_Adequora_Writer_글과_자료를_한_문서에.html',
};
