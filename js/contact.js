const bookingForm = document.getElementById("contact-form");
const successBox = document.getElementById("form-success");
const draftNotice = document.getElementById("draft-notice");
const estimateBox = document.getElementById("price-estimate");
const TOTAL_STEPS = 3;
const DRAFT_KEY = "bookingDraft";

let currentStep = 1;

/* ---------- Helpers ---------- */

// Returns the form fields (inputs with data-validate) that belong to a step.
function getStepFields(step) {
  const panel = bookingForm.querySelector('.wizard-step[data-step="' + step + '"]');
  return Array.from(panel.querySelectorAll("[data-validate]"));
}

// Returns the Tour object chosen in the select (or undefined).
function getSelectedTour() {
  return findDestination(document.getElementById("tour").value);
}

// Returns the ids of the ticked extras.
function getSelectedExtras() {
  return Array.from(document.querySelectorAll(".extra-check:checked")).map(function (box) {
    return box.value;
  });
}

function getTravellers() {
  return Number(document.getElementById("travellers").value);
}

/* ---------- Building the form from data ---------- */

// Fills the <select> from the destinations array.
function fillTourSelect() {
  const select = document.getElementById("tour");
  for (const tour of destinations) {
    const option = document.createElement("option");
    option.value = tour.id;
    option.textContent = tour.name + " - " + tour.getDurationLabel() + ", " + formatPrice(tour.price);
    select.appendChild(option);
  }
}

function updateDependentFields() {
  const tour = getSelectedTour();
  const extrasGroup = document.getElementById("extras-group");
  const extrasList = document.getElementById("extras-list");
  const experienceGroup = document.getElementById("experience-group");

  extrasList.innerHTML = ""; 
  if (!tour) {
    extrasGroup.classList.add("d-none");
    experienceGroup.classList.add("d-none");
    return;
  }

  tour.extras.forEach(function (extra) {
    const wrapper = document.createElement("div");
    wrapper.className = "form-check";
    const suffix = extra.perPerson ? " per person" : " per group";
    wrapper.innerHTML =
      '<input type="checkbox" class="form-check-input extra-check" id="extra-' + extra.id + '" value="' + extra.id + '">' +
      '<label class="form-check-label" for="extra-' + extra.id + '">' + extra.label +
      ' <span class="extra-price">+' + formatPrice(extra.price) + suffix + "</span></label>";
    extrasList.appendChild(wrapper);
  });
  extrasGroup.classList.toggle("d-none", tour.extras.length === 0);

  const isHard = tour.difficulty === "Hard";
  experienceGroup.classList.toggle("d-none", !isHard);
  if (!isHard) {
    document.getElementById("experience").checked = false;
    clearFieldError(document.getElementById("experience"));
  }
}


function updatePriceEstimate() {
  const tour = getSelectedTour();
  const travellers = getTravellers();
  if (!tour || !Number.isInteger(travellers) || travellers < 1 || travellers > MAX_TRAVELLERS) {
    estimateBox.textContent = "Choose a tour and number of travellers to see the estimated price.";
    return;
  }
  const price = tour.getPriceBreakdown(travellers, getSelectedExtras());
  let text = "Estimated price: " + formatPrice(price.total) + " for " + travellers +
    (travellers === 1 ? " traveller" : " travellers");
  if (price.discount > 0) {
    text += " (10% group discount: -" + formatPrice(price.discount) + ")";
  }
  if (price.extrasTotal > 0) {
    text += " incl. extras " + formatPrice(price.extrasTotal);
  }
  estimateBox.textContent = text;
}

function updateMessageCounter() {
  const length = document.getElementById("msg").value.length;
  const counter = document.getElementById("msg-count");
  counter.textContent = length + " / " + MAX_MESSAGE_LENGTH;
  counter.classList.toggle("text-danger", length > MAX_MESSAGE_LENGTH);
}

function renderSummary() {
  const tour = getSelectedTour();
  const summary = document.getElementById("booking-summary");
  if (!tour) {
    summary.innerHTML = "";
    return;
  }
  const travellers = getTravellers();
  const extraIds = getSelectedExtras();
  const price = tour.getPriceBreakdown(travellers, extraIds);
  const extraNames = extraIds.map(function (id) {
    return tour.getExtra(id).label;
  });

  const rows = [
    ["Tour", tour.name + " (" + tour.getDurationLabel() + ")"],
    ["Start date", formatDate(document.getElementById("date").value)],
    ["Travellers", String(travellers)],
    ["Extras", extraNames.length > 0 ? extraNames.join(", ") : "None"],
    ["Contact", document.getElementById("name").value.trim() + ", " + document.getElementById("email").value.trim()],
    ["Total", formatPrice(price.total)]
  ];
  summary.innerHTML = "";
  rows.forEach(function (row) {
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = row[0]; // textContent keeps user text safe
    detail.textContent = row[1];
    summary.appendChild(term);
    summary.appendChild(detail);
  });
}


function showStep(step) {
  currentStep = step;
  bookingForm.querySelectorAll(".wizard-step").forEach(function (panel) {
    panel.classList.toggle("d-none", Number(panel.dataset.step) !== step);
  });
  $(bookingForm).find('.wizard-step[data-step="' + step + '"]').hide().fadeIn(200);

  document.querySelectorAll("#stepper li").forEach(function (item) {
    const number = Number(item.dataset.step);
    item.classList.toggle("is-active", number === step);
    item.classList.toggle("is-done", number < step);
    if (number === step) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  document.getElementById("btn-back").classList.toggle("invisible", step === 1);
  document.getElementById("btn-next").classList.toggle("d-none", step === TOTAL_STEPS);
  document.getElementById("btn-submit").classList.toggle("d-none", step !== TOTAL_STEPS);
  if (step === TOTAL_STEPS) {
    renderSummary();
  }
}

function validateStep(step) {
  const invalidFields = validateFields(getStepFields(step));
  if (invalidFields.length > 0) {
    invalidFields[0].focus();
    return false;
  }
  return true;
}

function goNext() {
  if (validateStep(currentStep)) {
    showStep(currentStep + 1);
    saveDraft();
  }
}

function goBack() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
    saveDraft();
  }
}


function saveDraft() {
  saveToStorage(DRAFT_KEY, {
    tour: document.getElementById("tour").value,
    travellers: document.getElementById("travellers").value,
    date: document.getElementById("date").value,
    extras: getSelectedExtras(),
    experience: document.getElementById("experience").checked,
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    msg: document.getElementById("msg").value,
    step: currentStep
  });
}

function restoreDraft() {
  const draft = loadFromStorage(DRAFT_KEY, null);
  // Invalid or missing data is ignored, never trusted
  if (draft === null || typeof draft !== "object" || !findDestination(draft.tour)) {
    return false;
  }
  const text = function (value) {
    return typeof value === "string" ? value : "";
  };

  document.getElementById("tour").value = draft.tour;
  updateDependentFields();
  document.getElementById("travellers").value = text(draft.travellers) || "2";
  document.getElementById("date").value = text(draft.date);
  document.getElementById("name").value = text(draft.name);
  document.getElementById("email").value = text(draft.email);
  document.getElementById("phone").value = text(draft.phone);
  document.getElementById("msg").value = text(draft.msg);
  document.getElementById("experience").checked = draft.experience === true;
  if (Array.isArray(draft.extras)) {
    draft.extras.forEach(function (extraId) {
      const box = document.getElementById("extra-" + extraId);
      if (box) {
        box.checked = true;
      }
    });
  }
  const step = Number(draft.step);
  currentStep = step >= 1 && step <= TOTAL_STEPS ? step : 1;
  return true;
}

function clearDraft() {
  removeFromStorage(DRAFT_KEY);
  draftNotice.classList.add("d-none");
}

function resetBookingForm() {
  bookingForm.reset();
  bookingForm.querySelectorAll(".is-invalid").forEach(clearFieldError);
  updateDependentFields();
  updatePriceEstimate();
  updateMessageCounter();
  showStep(1);
}

function createBookingFromForm() {
  return new Booking({
    id: Booking.generateId(),
    tourId: document.getElementById("tour").value,
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    travellers: getTravellers(),
    startDate: document.getElementById("date").value,
    extras: getSelectedExtras(),
    message: document.getElementById("msg").value.trim(),
    status: "Pending"
  });
}

function showSuccess(booking) {
  successBox.innerHTML = "";
  const title = document.createElement("strong");
  title.textContent = "Thank you, " + booking.name + "! ";
  const text = document.createTextNode(
    "Your request " + booking.id + " for " + booking.tour.name + " (" + booking.travellers +
    (booking.travellers === 1 ? " traveller" : " travellers") + ", starting " + formatDate(booking.startDate) +
    ", total " + formatPrice(booking.getTotal()) + ") has been saved. We will reply to " + booking.email +
    " within 24 hours. "
  );
  const link = document.createElement("a");
  link.href = "trips.html";
  link.textContent = "View it in My Trips";
  successBox.append(title, text, link);
  successBox.classList.remove("d-none");
  successBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  showToast("Booking " + booking.id + " saved");
}


document.addEventListener("DOMContentLoaded", function () {
  fillTourSelect();
  document.getElementById("date").min = getTodayString();

  const restored = restoreDraft();
  const requestedTour = new URLSearchParams(window.location.search).get("tour");
  if (requestedTour && findDestination(requestedTour)) {
    document.getElementById("tour").value = requestedTour;
    updateDependentFields();
  }
  draftNotice.classList.toggle("d-none", !restored);
  updatePriceEstimate();
  updateMessageCounter();
  showStep(restored ? currentStep : 1);

  // Live validation on every checked field (blur / input / change)
  bookingForm.querySelectorAll("[data-validate]").forEach(enableLiveValidation);

  // change: the tour decides which extras and checkboxes exist
  document.getElementById("tour").addEventListener("change", function () {
    updateDependentFields();
    updatePriceEstimate();
  });
  document.getElementById("travellers").addEventListener("input", updatePriceEstimate);
  document.getElementById("extras-list").addEventListener("change", updatePriceEstimate);
  document.getElementById("msg").addEventListener("input", updateMessageCounter);

  // Autosave the draft on every change (event delegation on the form)
  bookingForm.addEventListener("input", saveDraft);
  bookingForm.addEventListener("change", saveDraft);

  document.getElementById("btn-next").addEventListener("click", goNext);
  document.getElementById("btn-back").addEventListener("click", goBack);
  document.getElementById("clear-draft").addEventListener("click", function () {
    clearDraft();
    resetBookingForm();
  });

  // submit: Enter in a field = "Next" on steps 1-2, real submit on step 3
  bookingForm.addEventListener("submit", function (event) {
    event.preventDefault();
    successBox.classList.add("d-none");

    if (currentStep < TOTAL_STEPS) {
      goNext();
      return;
    }
    // Final check of all steps; jump back to the first step that has a problem
    for (let step = 1; step <= TOTAL_STEPS; step++) {
      const invalidFields = validateFields(getStepFields(step));
      if (invalidFields.length > 0) {
        if (step !== currentStep) {
          showStep(step); // show the panel first, otherwise it cannot take focus
        }
        invalidFields[0].focus();
        return;
      }
    }

    const booking = createBookingFromForm();
    bookingStore.add(booking);
    updateTripBadge();
    clearDraft();
    resetBookingForm();
    showSuccess(booking);
  });
});
