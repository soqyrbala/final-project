

const PAGE_SIZE = 5;

// Everything the user chose in the toolbar
const tripState = { query: "", status: "all", sort: "date-asc", page: 1 };

const tripEls = {
  body: document.getElementById("trips-body"),
  tableWrap: document.getElementById("trips-table-wrap"),
  empty: document.getElementById("trips-empty"),
  noMatch: document.getElementById("trips-nomatch"),
  toolbar: document.getElementById("trips-toolbar"),
  count: document.getElementById("trips-count"),
  pagination: document.getElementById("trips-pagination"),
  search: document.getElementById("trips-search"),
  statusFilter: document.getElementById("trips-status"),
  sort: document.getElementById("trips-sort"),
  chart: document.getElementById("spend-chart")
};

let editingId = null;     // id of the booking in the edit window
let pendingAction = null; // function that runs when the user confirms a deletion
let editModal = null;
let confirmModal = null;

/* ---------- Data functions (no DOM) ---------- */

// Returns a NEW sorted array of bookings.
function sortBookings(bookings, sortBy) {
  const sorted = bookings.slice();
  if (sortBy === "date-asc") {
    sorted.sort(function (a, b) { return a.getStartDate() - b.getStartDate(); });
  } else if (sortBy === "date-desc") {
    sorted.sort(function (a, b) { return b.getStartDate() - a.getStartDate(); });
  } else if (sortBy === "total-desc") {
    sorted.sort(function (a, b) { return b.getTotal() - a.getTotal(); });
  } else if (sortBy === "total-asc") {
    sorted.sort(function (a, b) { return a.getTotal() - b.getTotal(); });
  } else if (sortBy === "newest") {
    sorted.sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  }
  return sorted;
}

// Returns the bookings that match the search text and the status filter, sorted.
function getVisibleBookings() {
  const query = tripState.query.trim().toLowerCase();
  const matching = bookingStore.getAll().filter(function (booking) {
    const text = (booking.id + " " + booking.tour.name + " " + booking.name + " " + booking.email).toLowerCase();
    return text.includes(query) && (tripState.status === "all" || booking.status === tripState.status);
  });
  return sortBookings(matching, tripState.sort);
}

// Returns the numbers for the statistics cards. Cancelled trips do not count.
function calculateStats(bookings) {
  const active = bookings.filter(function (booking) {
    return booking.status !== "Cancelled";
  });
  const upcoming = active
    .filter(function (booking) { return booking.getDaysUntilStart() >= 0; })
    .sort(function (a, b) { return a.getStartDate() - b.getStartDate(); });

  return {
    trips: active.length,
    travellers: active.reduce(function (sum, booking) { return sum + booking.travellers; }, 0),
    spend: active.reduce(function (sum, booking) { return sum + booking.getTotal(); }, 0),
    next: upcoming.length > 0 ? upcoming[0] : null
  };
}

// Returns [{ name, spend, trips }] sorted from the biggest spend. Cancelled trips are ignored.
function groupSpendByTour(bookings) {
  const groups = {};
  for (const booking of bookings) {
    if (booking.status === "Cancelled") {
      continue;
    }
    const key = booking.tour.id;
    if (!groups[key]) {
      groups[key] = { name: booking.tour.name, spend: 0, trips: 0 };
    }
    groups[key].spend += booking.getTotal();
    groups[key].trips += 1;
  }
  return Object.values(groups).sort(function (a, b) { return b.spend - a.spend; });
}

/* ---------- Rendering ---------- */

function renderStats(bookings) {
  const stats = calculateStats(bookings);
  document.getElementById("stat-trips").textContent = stats.trips;
  document.getElementById("stat-travellers").textContent = stats.travellers;
  document.getElementById("stat-spend").textContent = formatPrice(stats.spend);

  const nextValue = document.getElementById("stat-next");
  const nextNote = document.getElementById("stat-next-note");
  if (stats.next) {
    const days = stats.next.getDaysUntilStart();
    nextValue.textContent = stats.next.tour.name;
    nextNote.textContent = formatDate(stats.next.startDate) + (days === 0 ? " (today)" : " (in " + days + (days === 1 ? " day)" : " days)"));
  } else {
    nextValue.textContent = "-";
    nextNote.textContent = "No upcoming trips";
  }
}

// Bar chart built from plain elements: the bar width is the share of the biggest spend.
function renderChart(bookings) {
  const groups = groupSpendByTour(bookings);
  tripEls.chart.innerHTML = "";

  if (groups.length === 0) {
    tripEls.chart.innerHTML = '<p class="chart-empty mb-0">No data yet. Save a booking to see your spending by tour.</p>';
    return;
  }
  const maxSpend = groups[0].spend;
  groups.forEach(function (group) {
    const row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML =
      '<span class="chart-label"></span>' +
      '<div class="chart-track"><div class="chart-bar" style="width: 0"></div></div>' +
      '<span class="chart-value">' + formatPrice(group.spend) + "</span>";
    row.querySelector(".chart-label").textContent = group.name + " (" + group.trips + ")";
    tripEls.chart.appendChild(row);

    const bar = row.querySelector(".chart-bar");
    // set the width one frame later so the CSS transition animates the bar
    requestAnimationFrame(function () {
      bar.style.width = Math.max(4, (group.spend / maxSpend) * 100) + "%";
    });
  });
}

function createCell(text, className) {
  const cell = document.createElement("td");
  cell.textContent = text;
  if (className) {
    cell.className = className;
  }
  return cell;
}

function createTripRow(booking) {
  const row = document.createElement("tr");
  row.dataset.id = booking.id;

  const tourCell = document.createElement("td");
  tourCell.innerHTML = '<span class="trip-tour"></span><small class="trip-person d-block"></small>';
  tourCell.querySelector(".trip-tour").textContent = booking.tour.name;
  tourCell.querySelector(".trip-person").textContent = booking.name;

  const statusCell = document.createElement("td");
  statusCell.innerHTML = '<span class="status-badge status-' + booking.status.toLowerCase() + '">' + booking.status + "</span>";

  const actionsCell = document.createElement("td");
  actionsCell.className = "text-end text-nowrap";
  actionsCell.innerHTML =
    '<button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit" data-id="' + booking.id + '" aria-label="Edit ' + booking.id + '">Edit</button> ' +
    '<button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="' + booking.id + '" aria-label="Delete ' + booking.id + '">Delete</button>';

  const refCell = createCell(booking.id, "trip-ref");
  row.append(refCell, tourCell, createCell(formatDate(booking.startDate)), createCell(String(booking.travellers)),
    createCell(formatPrice(booking.getTotal()), "fw-bold"), statusCell, actionsCell);
  return row;
}

function renderPagination(totalItems) {
  const pages = Math.ceil(totalItems / PAGE_SIZE);
  tripEls.pagination.innerHTML = "";
  if (pages <= 1) {
    return;
  }
  const addButton = function (label, page, disabled, active, ariaLabel) {
    const item = document.createElement("li");
    item.className = "page-item" + (disabled ? " disabled" : "") + (active ? " active" : "");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-link";
    button.innerHTML = label;
    button.dataset.page = page;
    button.disabled = disabled;
    if (ariaLabel) button.setAttribute("aria-label", ariaLabel);
    if (active) button.setAttribute("aria-current", "page");
    item.appendChild(button);
    tripEls.pagination.appendChild(item);
  };
  addButton("&laquo;", tripState.page - 1, tripState.page === 1, false, "Previous page");
  for (let page = 1; page <= pages; page++) {
    addButton(String(page), page, false, page === tripState.page, "Page " + page);
  }
  addButton("&raquo;", tripState.page + 1, tripState.page === pages, false, "Next page");
}

// Draws the whole page from the current data and toolbar state.
function renderTrips() {
  const all = bookingStore.getAll();
  const hasTrips = all.length > 0;

  renderStats(all);
  renderChart(all);
  updateTripBadge();

  tripEls.empty.classList.toggle("d-none", hasTrips);
  tripEls.toolbar.classList.toggle("d-none", !hasTrips);
  document.getElementById("clear-all").classList.toggle("d-none", !hasTrips);

  const visible = getVisibleBookings();
  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  tripState.page = Math.min(tripState.page, pages); // stay inside the last page after deleting

  const pageItems = visible.slice((tripState.page - 1) * PAGE_SIZE, tripState.page * PAGE_SIZE);
  tripEls.body.innerHTML = "";
  pageItems.forEach(function (booking) {
    tripEls.body.appendChild(createTripRow(booking));
  });

  tripEls.tableWrap.classList.toggle("d-none", visible.length === 0);
  tripEls.noMatch.classList.toggle("d-none", !hasTrips || visible.length > 0);
  tripEls.count.textContent = hasTrips ? "Showing " + visible.length + " of " + all.length + " trips" : "";
  renderPagination(visible.length);
}

/* ---------- Create (demo data) ---------- */

// Adds three example bookings with future dates, handy for trying the page out.
function addDemoBookings() {
  const addDays = function (days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  };
  const samples = [
    { tourId: "charyn-canyon", travellers: 2, days: 20, status: "Confirmed", extras: ["picnic"] },
    { tourId: "kolsai-lakes", travellers: 4, days: 45, status: "Pending", extras: ["horse-ride"] },
    { tourId: "altai-mountains", travellers: 3, days: 80, status: "Pending", extras: [] }
  ];
  samples.forEach(function (sample) {
    bookingStore.add(new Booking({
      id: Booking.generateId(),
      tourId: sample.tourId,
      name: "Demo Traveller",
      email: "demo@example.com",
      travellers: sample.travellers,
      startDate: addDays(sample.days),
      extras: sample.extras,
      message: "Demo booking created from the My Trips page.",
      status: sample.status
    }));
  });
  showToast("3 demo trips added");
  renderTrips();
}

/* ---------- Update (edit window) ---------- */

function getEditFields() {
  return Array.from(document.querySelectorAll("#edit-form [data-validate]"));
}

function openEditModal(id) {
  const booking = bookingStore.getById(id);
  if (!booking) {
    return;
  }
  editingId = id;
  document.getElementById("edit-title").textContent = "Edit " + booking.id + " - " + booking.tour.name;
  document.getElementById("edit-travellers").value = booking.travellers;
  document.getElementById("edit-date").value = booking.startDate;
  document.getElementById("edit-status").value = booking.status;
  document.getElementById("edit-msg").value = booking.message;
  getEditFields().forEach(clearFieldError);
  editModal.show();
}

function saveEdit() {
  const booking = bookingStore.getById(editingId);
  if (!booking) {
    return;
  }
  // An unchanged date is not checked again, so old trips can still change status
  const dateField = document.getElementById("edit-date");
  const fieldsToCheck = getEditFields().filter(function (field) {
    return !(field === dateField && field.value === booking.startDate);
  });
  const invalidFields = validateFields(fieldsToCheck);
  if (invalidFields.length > 0) {
    invalidFields[0].focus();
    return;
  }
  bookingStore.update(editingId, {
    travellers: document.getElementById("edit-travellers").value,
    startDate: dateField.value,
    status: document.getElementById("edit-status").value,
    message: document.getElementById("edit-msg").value.trim()
  });
  editModal.hide();
  renderTrips();
  showToast("Booking " + editingId + " updated");
}

/* ---------- Delete (confirm window) ---------- */

function openConfirm(message, action) {
  document.getElementById("confirm-text").textContent = message;
  pendingAction = action;
  confirmModal.show();
}

function deleteBooking(id) {
  const booking = bookingStore.getById(id);
  if (!booking) {
    return;
  }
  openConfirm("Delete booking " + booking.id + " (" + booking.tour.name + ")? This cannot be undone.", function () {
    // jQuery effect: the row fades out before it is removed
    $('#trips-body tr[data-id="' + id + '"]').fadeOut(250, function () {
      bookingStore.remove(id);
      renderTrips();
      showToast("Booking " + id + " deleted");
    });
  });
}

/* ---------- Start-up ---------- */

document.addEventListener("DOMContentLoaded", function () {
  editModal = new bootstrap.Modal(document.getElementById("edit-modal"));
  confirmModal = new bootstrap.Modal(document.getElementById("confirm-modal"));

  getEditFields().forEach(enableLiveValidation);
  document.getElementById("edit-date").min = getTodayString();

  // input / change: toolbar controls (every change goes back to page 1)
  tripEls.search.addEventListener("input", function () {
    tripState.query = tripEls.search.value;
    tripState.page = 1;
    renderTrips();
  });
  tripEls.statusFilter.addEventListener("change", function () {
    tripState.status = tripEls.statusFilter.value;
    tripState.page = 1;
    renderTrips();
  });
  tripEls.sort.addEventListener("change", function () {
    tripState.sort = tripEls.sort.value;
    tripState.page = 1;
    renderTrips();
  });

  // click: Edit / Delete buttons inside the table (event delegation)
  tripEls.body.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }
    if (button.dataset.action === "edit") {
      openEditModal(button.dataset.id);
    } else if (button.dataset.action === "delete") {
      deleteBooking(button.dataset.id);
    }
  });

  // click: pagination buttons
  tripEls.pagination.addEventListener("click", function (event) {
    const button = event.target.closest("[data-page]");
    if (button && !button.disabled) {
      tripState.page = Number(button.dataset.page);
      renderTrips();
    }
  });

  document.getElementById("edit-form").addEventListener("submit", function (event) {
    event.preventDefault();
    saveEdit();
  });
  document.getElementById("edit-save").addEventListener("click", saveEdit);

  document.getElementById("confirm-ok").addEventListener("click", function () {
    confirmModal.hide();
    if (pendingAction) {
      pendingAction();
      pendingAction = null;
    }
  });
  document.getElementById("clear-all").addEventListener("click", function () {
    openConfirm("Delete all " + bookingStore.count + " saved trips? This cannot be undone.", function () {
      bookingStore.clear();
      renderTrips();
      showToast("All trips deleted");
    });
  });
  document.getElementById("add-demo").addEventListener("click", addDemoBookings);

  renderTrips();
});
