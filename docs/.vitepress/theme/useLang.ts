import { ref, onMounted, onUnmounted, type Ref } from 'vue';

const STORAGE_KEY = 'mosaic-docs-lang';

type Lang = 'js' | 'python';

export function useLang(): { language: Ref<Lang>; setLanguage: (lang: Lang) => void; } {
  const language = ref<Lang>('js');

  function parseLang(search: string): Lang {
    const q = new URLSearchParams(search || '').get('lang');
    return q === 'python' ? 'python' : 'js';
  }

  function storedLang(): Lang | null {
    try {
      const v = sessionStorage.getItem(STORAGE_KEY);
      return v === 'python' ? 'python' : v === 'js' ? 'js' : null;
    } catch {
      return null;
    }
  }

  function storeLang(lang: Lang): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // storage may be unavailable (private mode, disabled cookies)
    }
  }

  function applyLangToUrl(lang: Lang): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    const next = url.pathname + url.search + url.hash;
    const cur = window.location.pathname + window.location.search + window.location.hash;
    if (next !== cur) {
      history.replaceState(history.state, '', next);
    }
  }

  function setLanguage(lang: Lang): void {
    language.value = lang;
    storeLang(lang);
    applyLangToUrl(lang);
  }

  function onPopState(): void {
    language.value = parseLang(window.location.search);
  }

  onMounted((): void => {
    const search = window.location.search;
    // An explicit ?lang= wins (e.g. shared links); otherwise use the stored preference.
    language.value = new URLSearchParams(search).has('lang')
      ? parseLang(search)
      : storedLang() ?? 'js';
    storeLang(language.value);
    applyLangToUrl(language.value);
    window.addEventListener('popstate', onPopState);
  });

  onUnmounted((): void => {
    window.removeEventListener('popstate', onPopState);
  });

  return { language, setLanguage };
}
