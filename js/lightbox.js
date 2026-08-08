// Lightbox plein écran pour la galerie "Mes favoris"
document.addEventListener("DOMContentLoaded", function () {
  const cards = Array.from(document.querySelectorAll(".photo-card img"));
  if (cards.length === 0) return;

  // construit la liste des images en pleine résolution (data-full si présent, sinon src)
  const items = cards.map(function (img) {
    return {
      full: img.getAttribute("data-full") || img.src,
      alt: img.getAttribute("alt") || ""
    };
  });

  let currentIndex = 0;

  // --- construction du lightbox (une seule fois) ---
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML =
    '<button class="lightbox-close" aria-label="Fermer">&times;</button>' +
    '<button class="lightbox-prev" aria-label="Image précédente">&#8249;</button>' +
    '<img src="" alt="">' +
    '<button class="lightbox-next" aria-label="Image suivante">&#8250;</button>' +
    '<div class="lightbox-caption"></div>';
  document.body.appendChild(lightbox);

  const imgEl = lightbox.querySelector("img");
  const captionEl = lightbox.querySelector(".lightbox-caption");
  const closeBtn = lightbox.querySelector(".lightbox-close");
  const prevBtn = lightbox.querySelector(".lightbox-prev");
  const nextBtn = lightbox.querySelector(".lightbox-next");

  function show(index) {
    currentIndex = (index + items.length) % items.length;
    const item = items[currentIndex];
    imgEl.src = item.full;
    imgEl.alt = item.alt;
    captionEl.textContent = item.alt + " — " + (currentIndex + 1) + " / " + items.length;
  }

  function open(index) {
    show(index);
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    imgEl.src = "";
  }

  cards.forEach(function (img, index) {
    img.addEventListener("click", function () {
      open(index);
    });
  });

  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", function () { show(currentIndex - 1); });
  nextBtn.addEventListener("click", function () { show(currentIndex + 1); });

  // clique en dehors de l'image -> ferme
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) close();
  });

  // navigation clavier
  document.addEventListener("keydown", function (e) {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(currentIndex - 1);
    if (e.key === "ArrowRight") show(currentIndex + 1);
  });
});
