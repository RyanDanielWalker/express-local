import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><div id="root"></div>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, Node: dom.window.Node, MutationObserver: dom.window.MutationObserver, FormData: dom.window.FormData, Event: dom.window.Event });
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
export let fails = 0;
export const ok = (c: unknown, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
// Exits so a probe that leaves React work running (like an uncached promise) still ends.
export const done = () => { console.log('fails', fails); setTimeout(() => process.exit(0), 50); };
