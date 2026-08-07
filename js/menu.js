// Gestion optimisée du menu hamburger
(function() {
  'use strict';

  const toggle = document.querySelector(".menu-toggle");
  const tabs = document.querySelector("nav.tabs");
  const header = document.querySelector(".site-header");

  if (!toggle || !tabs || !header) return;

  // Éviter les re-layouts inutiles
  let isOpen = false;

  // Ouvre/ferme le menu
  function toggleMenu() {
    isOpen = !isOpen;
    header.classList.toggle("menu-open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  // Ferme le menu
  function closeMenu() {
    if (isOpen) {
      isOpen = false;
      header.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  // Écouteur pour le bouton
  toggle.addEventListener("click", toggleMenu, { passive: true });

  // Fermer le menu au clic sur un lien
  tabs.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu, { passive: true });
  });

  // Fermer le menu avec Escape
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
      closeMenu();
    }
  }, { passive: true });

  // Fermer le menu si on clique en dehors
  document.addEventListener("click", function(event) {
    if (isOpen && !header.contains(event.target)) {
      closeMenu();
    }
  }, { passive: true });

})();
