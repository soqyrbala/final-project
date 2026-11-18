

const MAX_MESSAGE_LENGTH = 500;
const MAX_TRAVELLERS = 8;

/* ---------- Rules ----------
 * One function per rule. Each returns an error message,
 * or an empty string "" when the value is valid.
 */
const validators = {
  name: function (value) {
    if (value.trim() === "") return "Please enter your name.";
    if (value.trim().length < 2) return "Name must be at least 2 characters.";
    if (!/^[\p{L}][\p{L}\s'-]*$/u.test(value.trim())) return "Name can contain only letters, spaces, hyphens and apostrophes.";
    return "";
  },
  email: function (value) {
    if (value.trim() === "") return "Please enter your email.";
    if (!isValidEmail(value.trim())) return "Enter a valid email, for example name@example.com.";
    return "";
  },
  phone: function (value) {
    // Optional field: only checked when something is typed
    if (value.trim() !== "" && !/^\+?[0-9\s()-]{10,15}$/.test(value.trim())) {
      return "Enter a valid phone number, e.g. +7 701 123 4567.";
    }
    return "";
  },
  tour: function (value) {
    return value === "" ? "Please choose a tour." : "";
  },
  travellers: function (value) {
    if (value === "") return "Please enter the number of travellers.";
    const count = Number(value);
    if (!Number.isInteger(count)) return "Travellers must be a whole number.";
    if (count < 1 || count > MAX_TRAVELLERS) return "We take 1 to " + MAX_TRAVELLERS + " travellers per group.";
    return "";
  },
  date: function (value) {
    if (value === "") return "Please choose a start date.";
    const parts = value.split("-");
    const chosen = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (chosen < today) return "The date cannot be in the past.";
    const month = chosen.getMonth(); // 0 = January
    if (month < 3 || month > 9) return "Trips run from April to October. Please pick a date in that period.";
    return "";
  },
  msg: function (value) {
    if (value.trim().length < 10) return "Message must be at least 10 characters.";
    if (value.length > MAX_MESSAGE_LENGTH) return "Message is too long (max " + MAX_MESSAGE_LENGTH + " characters).";
    return "";
  },
  // Dependent field: only required while its group is visible (hard tours)
  experience: function (value, field) {
    const group = field.closest("[data-dependent]");
    if (group && group.classList.contains("d-none")) return "";
    return field.checked ? "" : "Hard tours need confirmation that you can hike for 6+ hours a day.";
  },
  agree: function (value, field) {
    return field.checked ? "" : "You must agree to be contacted about your request.";
  }
};

/* ---------- Reusable functions ---------- */

// Returns true when the text looks like an email address.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function getRuleName(field) {
  return field.dataset.rule || field.id;
}

function showFieldError(field, message) {
  field.classList.add("is-invalid");
  field.setAttribute("aria-invalid", "true");
  document.getElementById(field.id + "-error").textContent = message;
}

function clearFieldError(field) {
  field.classList.remove("is-invalid");
  field.removeAttribute("aria-invalid");
  document.getElementById(field.id + "-error").textContent = "";
}

// Validates one field, updates the UI and returns true/false.
function validateField(field) {
  const message = validators[getRuleName(field)](field.value, field);
  if (message === "") {
    clearFieldError(field);
    return true;
  }
  showFieldError(field, message);
  return false;
}

// Validates a list of fields. Returns the fields that have errors.
function validateFields(fields) {
  const invalidFields = [];
  fields.forEach(function (field) {
    if (!validateField(field)) {
      invalidFields.push(field);
    }
  });
  return invalidFields;
}

// Re-checks a field while the user types, but only if it already shows an error.
function enableLiveValidation(field) {
  field.addEventListener("blur", function () {
    validateField(field);
  });
  const recheck = function () {
    if (field.classList.contains("is-invalid")) {
      validateField(field);
    }
  };
  field.addEventListener("input", recheck);
  field.addEventListener("change", recheck);
}

// Returns today's date as "YYYY-MM-DD" in the local timezone (for the min attribute of date inputs).
function getTodayString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return today.getFullYear() + "-" + month + "-" + day;
}
