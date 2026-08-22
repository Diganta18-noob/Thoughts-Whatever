/**
 * Applies the reader's saved theme and typography before first paint.
 *
 * This runs as a blocking inline script in <head>. That is normally a thing
 * to avoid, but the alternative here is worse: a reader who chose night mode
 * gets a full-screen flash of cream paper on every navigation. The script is
 * a few hundred bytes and touches nothing but <html>.
 */

export const THEME_KEY = "tw:theme";
export const READING_KEY = "tw:reading";

/**
 * The interface language. Unprefixed, unlike the two above, because the spec
 * names this key literally — it is part of the contract, not our convention.
 * Only the chrome follows it. The writing stays Bengali either way.
 */
export const LOCALE_KEY = "thoughts-whatever-locale";

export const THEME_COOKIE = "tw_theme";
export const LOCALE_COOKIE = "tw_lang";

const script = `
(function () {
  try {
    var root = document.documentElement;

    // 1. Read theme from cookie first (matches SSR), fallback to localStorage or OS preference
    var tc = document.cookie.match(/(?:^|; )tw_theme=([^;]+)/);
    var theme = tc ? decodeURIComponent(tc[1]) : (localStorage.getItem('${THEME_KEY}') || '');
    if (theme !== 'cream' && theme !== 'sepia' && theme !== 'night') {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'cream';
    }
    root.setAttribute('data-theme', theme);

    // Sync cookie if missing or different so subsequent SSR passes match perfectly
    if (!tc || decodeURIComponent(tc[1]) !== theme) {
      document.cookie = 'tw_theme=' + encodeURIComponent(theme) + '; path=/; max-age=31536000; SameSite=Lax';
    }

    // 2. Read locale from cookie first (matches SSR), fallback to localStorage
    var lc = document.cookie.match(/(?:^|; )tw_lang=([^;]+)/);
    var locale = lc ? decodeURIComponent(lc[1]) : (localStorage.getItem('${LOCALE_KEY}') || 'en');
    if (locale !== 'en' && locale !== 'bn') locale = 'en';
    root.lang = locale;

    if (!lc || decodeURIComponent(lc[1]) !== locale) {
      document.cookie = 'tw_lang=' + encodeURIComponent(locale) + '; path=/; max-age=31536000; SameSite=Lax';
    }

    // 3. Reader typography overrides
    var raw = localStorage.getItem('${READING_KEY}');
    if (raw) {
      var r = JSON.parse(raw);
      if (r.size) root.style.setProperty('--reading-size', r.size + 'px');
      if (r.leading) root.style.setProperty('--reading-leading', String(r.leading));
    }
  } catch (e) {
    /* A reader with storage disabled gets the cream default. Not worth failing over. */
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
