import DefaultTheme from 'vitepress/theme';
import Example from './Example.vue';
import Layout from "./Layout.vue";
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout: Layout,
  enhanceApp(ctx) {
    ctx.app.component('Example', Example);
  }
};
