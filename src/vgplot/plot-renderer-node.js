import { plotRenderer } from './PlotRenderer';
import { JSDOM } from 'jsdom';

export function plotRenderer(plot) {
  const root = withJsdom(() => plotRenderer(plot));
  root.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/svg");
  root.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
  reindexStyle(root);
  reindexMarker(root);
  reindexClip(root);
  return root;
}

export function withJsdom(run) {
  const jsdom = new JSDOM("");
  global.window = jsdom.window;
  global.document = jsdom.window.document;
  global.navigator = jsdom.window.navigator;
  global.Event = jsdom.window.Event;
  global.Node = jsdom.window.Node;
  global.NodeList = jsdom.window.NodeList;
  global.HTMLCollection = jsdom.window.HTMLCollection;
  try {
    return run();
  } finally {
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.Event;
    delete global.Node;
    delete global.NodeList;
    delete global.HTMLCollection;
  }
}

function reindexStyle(root) {
  let index = 0;
  for (const style of root.querySelectorAll("style")) {
    const name = `plot${index++ ? `-${index}` : ""}`;
    const parent = style.parentNode;
    const uid = parent.getAttribute("class");
    for (const child of [parent, ...parent.querySelectorAll("[class]")]) {
      child.setAttribute("class", child.getAttribute("class").replace(new RegExp(`\\b${uid}\\b`, "g"), name));
    }
    style.textContent = style.textContent.replace(new RegExp(`[.]${uid}`, "g"), `.${name}`);
  }
}

function reindexMarker(root) {
  let index = 0;
  const map = new Map();
  for (const node of root.querySelectorAll("[id^=plot-marker-]")) {
    let id = node.getAttribute("id");
    if (map.has(id)) id = map.get(id);
    else map.set(id, (id = `plot-marker-${++index}`));
    node.setAttribute("id", id);
  }
  for (const key of ["marker-start", "marker-mid", "marker-end"]) {
    for (const node of root.querySelectorAll(`[${key}]`)) {
      let id = node.getAttribute(key).slice(5, -1);
      if (map.has(id)) node.setAttribute(key, `url(#${map.get(id)})`);
    }
  }
}

function reindexClip(root) {
  let index = 0;
  const map = new Map();
  for (const node of root.querySelectorAll("[id^=plot-clip-]")) {
    let id = node.getAttribute("id");
    if (map.has(id)) id = map.get(id);
    else map.set(id, (id = `plot-clip-${++index}`));
    node.setAttribute("id", id);
  }
  for (const key of ["clip-path"]) {
    for (const node of root.querySelectorAll(`[${key}]`)) {
      let id = node.getAttribute(key).slice(5, -1);
      if (map.has(id)) node.setAttribute(key, `url(#${map.get(id)})`);
    }
  }
}
