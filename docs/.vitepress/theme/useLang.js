import { ref, onMounted, onUnmounted } from 'vue';

const STORAGE_KEY = 'mosaic-docs-lang';

export function useLang() {
  const language = ref('js');

  function parseLang(search) {
    const q = new URLSearchParams(search || '').get('lang');
    return q === 'python' ? 'python' : 'js';
  }

  function storedLang() {
    try {
      const v = sessionStorage.getItem(STORAGE_KEY);
      return v === 'python' ? 'python' : v === 'js' ? 'js' : null;
    } catch {
      return null;
    }
  }

  function storeLang(lang) {
    try {
      sessionStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage may be unavailable (private mode, disabled cookies)
    }
  }

  function applyLangToUrl(lang) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    const next = url.pathname + url.search + url.hash;
    const cur = window.location.pathname + window.location.search + window.location.hash;
    if (next !== cur) {
      history.replaceState(history.state, '', next);
    }
  }

  function setLanguage(lang) {
    language.value = lang;
    storeLang(lang);
    applyLangToUrl(lang);
  }

  function onPopState() {
    language.value = parseLang(window.location.search);
  }

  onMounted(() => {
    const search = window.location.search;
    // An explicit ?lang= wins (e.g. shared links); otherwise use the stored preference.
    language.value = new URLSearchParams(search).has('lang')
      ? parseLang(search)
      : storedLang() ?? 'js';
    storeLang(language.value);
    applyLangToUrl(language.value);
    window.addEventListener('popstate', onPopState);
  });

  onUnmounted(() => {
    window.removeEventListener('popstate', onPopState);
  });

  return { language, setLanguage };
}
