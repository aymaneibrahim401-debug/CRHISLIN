(function () {
  "use strict";

  const STORAGE_KEY = "carnet-contact-visiteurs";
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const list = document.getElementById("visitor-list");

  if (!form || !status || !list) return;

  // échappement complet (empêche toute injection HTML dans les messages affichés)
  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function lireVisiteurs() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function afficherVisiteurs() {
    const visiteurs = lireVisiteurs();
    if (visiteurs.length === 0) {
      list.innerHTML = '<p class="empty-note">Aucun message pour le moment.</p>';
      return;
    }
    const items = visiteurs
      .slice()
      .reverse()
      .map(function (v) {
        const nom = escapeHTML(v.nom || "");
        const email = escapeHTML(v.email || "");
        const msg = escapeHTML(v.message || "");
        const date = escapeHTML(v.date || "");
        return "<li><span class=\"meta\">" + nom + " · " + email + " · " + date + "</span>" + msg + "</li>";
      })
      .join("");
    list.innerHTML = "<ul>" + items + "</ul>";
  }

  form.addEventListener(
    "submit",
    function (e) {
      e.preventDefault();

      const nom = form.nom.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      if (!nom || !email || !message) return;

      const visiteurs = lireVisiteurs();
      visiteurs.push({
        nom: nom,
        email: email,
        message: message,
        date: new Date().toLocaleString("fr-FR")
      });

      // on garde un historique raisonnable (évite de saturer le stockage local)
      while (visiteurs.length > 200) visiteurs.shift();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(visiteurs));
      form.reset();
      status.classList.add("ok");
      setTimeout(function () {
        status.classList.remove("ok");
      }, 4000);
      afficherVisiteurs();
    },
    { passive: false }
  );

  afficherVisiteurs();
})();
