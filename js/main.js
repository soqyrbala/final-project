
// Array #3: ids of favorite tours (kept in sync with localStorage)
let favorites = [];

/* ---------- Reusable helper functions ---------- */

// Returns a string like "$180".
function formatPrice(amount) {
  return "$" + amount.toLocaleString("en-US");
}

// Turns "2027-07-15" into "15 Jul 2027" (built from parts, so no timezone shift).
function formatDate(isoDate) {
  const parts = isoDate.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Returns the tour object with the given id (or undefined).
function findDestination(id) {
  return destinations.find(function (tour) {
    return tour.id === id;
  });
}

/* ---------- Favorites ---------- */

function isFavorite(id) {
  return favorites.includes(id);
}

// Adds or removes a tour from favorites and updates the whole page.
function toggleFavorite(id) {
  if (isFavorite(id)) {
    favorites = favorites.filter(function (favId) {
      return favId !== id;
    });
  } else {
    favorites.push(id);
  }
  saveToStorage("favorites", favorites);
  updateFavoriteButtons();
  updateFavoriteBadge();
  // Other scripts (e.g. the favorites panel) listen for this event
  document.dispatchEvent(new CustomEvent("favoriteschanged"));

  const tour = findDestination(id);
  showToast(isFavorite(id) ? tour.name + " added to favorites" : tour.name + " removed from favorites");
}

// Repaints every heart button so it matches the favorites array.
function updateFavoriteButtons() {
  document.querySelectorAll(".btn-fav").forEach(function (button) {
    const active = isFavorite(button.dataset.id);
    button.classList.toggle("is-favorite", active);
    button.setAttribute("aria-pressed", String(active));
    button.textContent = active ? "\u2665" : "\u2661"; // ♥ / ♡
  });
}

function updateFavoriteBadge() {
  const badge = document.getElementById("fav-count");
  if (badge) {
    badge.textContent = favorites.length;
  }
}

/* ---------- Theme switcher ---------- */

function applyTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  const button = document.getElementById("theme-toggle");
  if (button) {
    button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    button.setAttribute("aria-pressed", String(theme === "dark"));
  }
}

function initThemeToggle() {
  const button = document.getElementById("theme-toggle");
  applyTheme(loadFromStorage("theme", "light"));
  button.addEventListener("click", function () {
    const next = document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    saveToStorage("theme", next);
  });
}

/* ---------- Tour card (used on Home and Destinations) ---------- */

// Builds and returns a Bootstrap card element for one tour.
function createDestinationCard(tour) {
  const column = document.createElement("div");
  column.className = "col-12 col-md-6 col-lg-4";

  // Build the "highlights" list from the array with a loop
  let highlightItems = "";
  for (const item of tour.highlights) {
    highlightItems += "<li>" + item + "</li>";
  }

  column.innerHTML =
    '<article class="card destination-card h-100">' +
      '<div class="card-media"><img src="' + tour.image + '" class="card-img-top" alt="' + tour.name + '" loading="lazy">' +
        '<span class="difficulty-pill diff-' + tour.difficulty.toLowerCase() + '">' + tour.difficulty + "</span></div>" +
      '<div class="card-body d-flex flex-column">' +
        '<div class="d-flex justify-content-between align-items-start">' +
          '<h3 class="h5 card-title">' + tour.name + "</h3>" +
          '<button type="button" class="btn-fav" data-id="' + tour.id + '" ' +
            'aria-label="Toggle favorite: ' + tour.name + '" aria-pressed="false">\u2661</button>' +
        "</div>" +
        '<p class="small tour-meta">' + tour.category + " &middot; " + tour.region +
          " &middot; " + tour.getDurationLabel() + "</p>" +
        '<p class="card-text">' + tour.description + "</p>" +
        '<div class="card-details"><ul class="small ps-3 mb-0">' + highlightItems + "</ul></div>" +
        '<div class="mt-auto pt-3 d-flex justify-content-between align-items-center">' +
          '<span class="tour-price">' + formatPrice(tour.price) + "</span>" +
          "<div>" +
            '<button type="button" class="btn btn-sm btn-outline-secondary btn-details" aria-expanded="false">Details</button> ' +
            '<a href="contact.html?tour=' + tour.id + '" class="btn btn-sm btn-saffron">Book</a>' +
          "</div>" +
        "</div>" +
      "</div>" +
    "</article>";

  return column;
}

// One click listener for all heart buttons inside a container (event delegation).
function enableFavoriteClicks(container) {
  container.addEventListener("click", function (event) {
    const button = event.target.closest(".btn-fav");
    if (button) {
      toggleFavorite(button.dataset.id);
    }
  });
}

/* ---------- Home page: featured tours ---------- */

function renderFeaturedTours() {
  const container = document.getElementById("featured-list");
  if (!container) {
    return; // not the Home page
  }
  destinations
    .filter(function (tour) {
      return tour.featured;
    })
    .forEach(function (tour) {
      container.appendChild(createDestinationCard(tour));
    });
  enableFavoriteClicks(container);
}

/* ---------- Text size (accessibility, saved in localStorage) ---------- */

const FONT_SCALES = [0.9, 1, 1.15, 1.3];

function applyFontScale(scale) {
  document.documentElement.style.fontSize = scale * 100 + "%";
  const label = document.getElementById("font-label");
  if (label) {
    label.textContent = Math.round(scale * 100) + "%";
  }
  const index = FONT_SCALES.indexOf(scale);
  const decrease = document.getElementById("font-decrease");
  const increase = document.getElementById("font-increase");
  if (decrease && increase) {
    decrease.disabled = index <= 0;
    increase.disabled = index >= FONT_SCALES.length - 1;
  }
}

// Returns the saved scale if it is one of the allowed values, otherwise 1.
function getSavedFontScale() {
  const saved = Number(loadFromStorage("fontScale", 1));
  return FONT_SCALES.includes(saved) ? saved : 1;
}

function initFontControls() {
  if (!document.getElementById("font-increase")) {
    return;
  }
  let scale = getSavedFontScale();
  applyFontScale(scale);

  function changeScale(newScale) {
    scale = newScale;
    applyFontScale(scale);
    saveToStorage("fontScale", scale);
  }
  document.getElementById("font-decrease").addEventListener("click", function () {
    changeScale(FONT_SCALES[Math.max(0, FONT_SCALES.indexOf(scale) - 1)]);
  });
  document.getElementById("font-increase").addEventListener("click", function () {
    changeScale(FONT_SCALES[Math.min(FONT_SCALES.length - 1, FONT_SCALES.indexOf(scale) + 1)]);
  });
  document.getElementById("font-reset").addEventListener("click", function () {
    changeScale(1);
  });
}

/* ---------- Saved trips: navbar counter and Home reminder ---------- */

function updateTripBadge() {
  const badge = document.getElementById("trip-count");
  if (badge) {
    badge.textContent = bookingStore.count;
  }
}

// Home page: shows a short message when the user already has saved bookings.
function renderTripReminder() {
  const box = document.getElementById("trip-reminder");
  if (!box) {
    return;
  }
  const upcoming = bookingStore
    .getAll()
    .filter(function (booking) {
      return booking.status !== "Cancelled" && booking.getDaysUntilStart() >= 0;
    })
    .sort(function (a, b) {
      return a.getStartDate() - b.getStartDate();
    });

  if (bookingStore.count === 0) {
    box.classList.add("d-none");
    return;
  }
  const next = upcoming[0];
  box.innerHTML =
    "<span><strong>Welcome back!</strong> You have " + bookingStore.count +
    (bookingStore.count === 1 ? " saved trip" : " saved trips") +
    (next ? ". Next: " + next.tour.name + " on " + formatDate(next.startDate) + "." : ".") +
    '</span><a href="trips.html" class="btn btn-sm btn-saffron">Open my trips</a>';
  box.classList.remove("d-none");
}

/* ---------- Start-up ---------- */

document.addEventListener("DOMContentLoaded", function () {
  favorites = loadFromStorage("favorites", []);
  initThemeToggle();
  initFontControls();
  renderFeaturedTours();
  renderTripReminder();
  updateFavoriteButtons();
  updateFavoriteBadge();
  updateTripBadge();
});
