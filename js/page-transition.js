// Préchargement des pages au survol / focus, pour une navigation rapide et sans à-coup
document.addEventListener("DOMContentLoaded", function () {
  const preloaded = new Set();

  function preload(url) {
    if (preloaded.has(url)) return;
    preloaded.add(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  }

  function isInternalNavigable(link) {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return null;
    if (link.target === "_blank" || link.hasAttribute("download")) return null;
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (err) {
      return null;
    }
    if (url.origin !== window.location.origin) return null;
    if (url.pathname === window.location.pathname) return null;
    return url;
  }

  document.querySelectorAll("a[href]").forEach(function (link) {
    const url = isInternalNavigable(link);
    if (!url) return;
    link.addEventListener("mouseenter", function () { preload(url.href); }, { once: true });
    link.addEventListener("touchstart", function () { preload(url.href); }, { once: true, passive: true });
    link.addEventListener("focus", function () { preload(url.href); }, { once: true });
  });
});
