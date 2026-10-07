// Metrics renders its outbound links after fetching data and opening dialogs.
import { localizeStoreUrl } from './store-links.mjs?v=20261007';

const selector = 'a[href^="https://apps.apple.com/"],a[href^="https://itunes.apple.com/"],a[href^="https://play.google.com/store/"]';
function localize(root) {
  const links = root.matches?.(selector) ? [root] : [];
  links.push(...root.querySelectorAll(selector));
  for (const link of links) {
    const href = localizeStoreUrl(link.href, document.documentElement.lang);
    if (link.href !== href) link.href = href;
  }
}
localize(document);
new MutationObserver(records => {
  for (const record of records) {
    if (record.type === 'attributes') {
      localize(record.attributeName === 'lang' ? document : record.target);
    } else {
      for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) localize(node);
      }
    }
  }
}).observe(document.documentElement, {
  childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'lang'],
});
