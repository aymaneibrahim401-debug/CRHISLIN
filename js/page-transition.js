// Transition en fondu entre les pages du site
document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("page-enter");

  // --- préchargement des pages au survol / focus (navigation quasi instantanée) ---
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

  // --- transition en fondu au clic ---
  document.addEventListener("click", function (e) {
    const link = e.target.closest("a");
    if (!link) return;

    const url = isInternalNavigable(link);
    if (!url) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    document.body.classList.add("page-leave");
    document.body.classList.remove("page-enter");

    setTimeout(function () {
      window.location.href = url.href;
    }, 180);
  });
});

// gère le cas où l'utilisateur revient en arrière (bouton précédent)
window.addEventListener("pageshow", function (event) {
  document.body.classList.remove("page-leave");
  document.body.classList.add("page-enter");
});
