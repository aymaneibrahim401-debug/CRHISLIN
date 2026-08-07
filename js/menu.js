// Ouvre / ferme le menu hamburger sur mobile
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".menu-toggle");
  const tabs = document.querySelector("nav.tabs");
  const header = document.querySelector(".site-header");

  if (!toggle || !tabs) return;

  toggle.addEventListener("click", function () {
    const isOpen = header.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // referme le menu si on clique sur un lien (utile en navigation mobile)
  tabs.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      header.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
});
