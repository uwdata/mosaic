import DefaultTheme from 'vitepress/theme';
import Example from './Example.vue';
import Layout from "./Layout.vue";
import './custom.css';

const LANG_PARAM = 'lang';

function applyLangFromURL() {
  const lang = new URLSearchParams(window.location.search).get(LANG_PARAM);
  if (!lang) return;
  requestAnimationFrame(() => {
    document.querySelectorAll('.vp-code-group .tabs label').forEach(label => {
      if (label.textContent.trim() === lang) label.click();
    });
  });
}

export default {
  extends: DefaultTheme,
  Layout: Layout,
  enhanceApp(ctx) {
    ctx.app.component('Example', Example);

    if (typeof window === 'undefined') return;

    applyLangFromURL();
    window.addEventListener('vitepress:contentUpdated', applyLangFromURL);

    document.addEventListener('click', (e) => {
      const label = e.target.closest('.vp-code-group .tabs label');
      if (!label) return;
      const url = new URL(window.location.href);
      const lang = label.textContent.trim();
      if (lang === 'JavaScript') {
        url.searchParams.delete(LANG_PARAM);
      } else {
        url.searchParams.set(LANG_PARAM, lang);
      }
      history.replaceState(null, '', url.toString());
    }, true);
  }
};
