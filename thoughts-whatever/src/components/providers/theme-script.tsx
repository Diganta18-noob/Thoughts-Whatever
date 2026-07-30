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

const script = `
(function () {
  try {
    var root = document.documentElement;
    var theme = localStorage.getItem('${THEME_KEY}');
    if (theme !== 'cream' && theme !== 'sepia' && theme !== 'night') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'cream';
    }
    root.dataset.theme = theme;

    var locale = localStorage.getItem('${LOCALE_KEY}');
    if (locale !== 'en' && locale !== 'bn') locale = 'en';
    root.lang = locale;

    var raw = localStorage.getItem('${READING_KEY}');
    if (raw) {
      var r = JSON.parse(raw);
      if (r.size) root.style.setProperty('--reading-size', r.size + 'px');
      if (r.leading) root.style.setProperty('--reading-leading', String(r.leading));
      if (r.family === 'sans') {
        root.style.setProperty('--reading-family', 'var(--font-bengali-sans), sans-serif');
      }
    }
  } catch (e) {
    /* A reader with storage disabled gets the cream default. Not worth failing over. */
  }
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
