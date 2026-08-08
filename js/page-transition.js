// Transition en fondu entre les pages du site
document.addEventListener("DOMContentLoaded", function () {
  document.body.classList.add("page-enter");

  document.addEventListener("click", function (e) {
    const link = e.target.closest("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    if (link.target === "_blank") return;
    if (link.hasAttribute("download")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // uniquement pour les liens internes (même origine)
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch (err) {
      return;
    }
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname) return;

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
