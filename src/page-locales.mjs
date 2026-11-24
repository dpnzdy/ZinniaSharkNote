// Shared by HTML generation and SEO so unavailable translations cannot enter the sitemap.
export const locales = ['ko', 'en', 'de', 'es', 'fr', 'ja'];
export const localizedPageIds = ['index', 'download', 'support', 'guide', 'installation', 'troubleshooting', 'releases', 'development'];
export const bilingualPageIds = ['policies', 'app-privacy', 'android-app-privacy', 'eula', 'license', 'lifecycle', 'support-consent', 'privacy'];
export const pageLocales = id => bilingualPageIds.includes(id) ? ['ko', 'en'] : localizedPageIds.includes(id) ? locales : [];
