

class WeatherService {
  static API_URL = "https://api.open-meteo.com/v1/forecast";

  constructor(tours, options = {}) {
    this.tours = tours;
    this.cacheKey = options.cacheKey || "weatherCache";
    this.cacheMinutes = options.cacheMinutes || 30;
    this.timeoutMs = options.timeoutMs || 8000;
  }

  // Builds the request address; all locations go into ONE request (comma separated).
  buildUrl() {
    const params = new URLSearchParams({
      latitude: this.tours.map((tour) => tour.lat).join(","),
      longitude: this.tours.map((tour) => tour.lon).join(","),
      current: "temperature_2m,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      forecast_days: "5",
      timezone: "auto"
    });
    return WeatherService.API_URL + "?" + params.toString();
  }

  // Turns a WMO weather code into a label, an icon and a colour group.
  static describeCode(code) {
    if (code === 0) return { label: "Clear sky", icon: "\u2600\uFE0F", group: "clear" };
    if (code === 1) return { label: "Mostly clear", icon: "\uD83C\uDF24\uFE0F", group: "clear" };
    if (code === 2) return { label: "Partly cloudy", icon: "\u26C5", group: "cloud" };
    if (code === 3) return { label: "Overcast", icon: "\u2601\uFE0F", group: "cloud" };
    if (code === 45 || code === 48) return { label: "Fog", icon: "\uD83C\uDF2B\uFE0F", group: "fog" };
    if (code >= 51 && code <= 57) return { label: "Drizzle", icon: "\uD83C\uDF26\uFE0F", group: "rain" };
    if (code >= 61 && code <= 67) return { label: "Rain", icon: "\uD83C\uDF27\uFE0F", group: "rain" };
    if (code >= 71 && code <= 77) return { label: "Snow", icon: "\u2744\uFE0F", group: "snow" };
    if (code >= 80 && code <= 82) return { label: "Rain showers", icon: "\uD83C\uDF26\uFE0F", group: "rain" };
    if (code === 85 || code === 86) return { label: "Snow showers", icon: "\uD83C\uDF28\uFE0F", group: "snow" };
    if (code >= 95) return { label: "Thunderstorm", icon: "\u26C8\uFE0F", group: "storm" };
    return { label: "Unknown", icon: "\uD83C\uDF21\uFE0F", group: "cloud" };
  }

  /*
   * Converts the JSON answer to a clean list:
   * [{ tourId, temperature, code, wind, days: [{ date, code, max, min }] }]
   * Locations with missing or broken data are skipped.
   */
  parseResponse(json) {
    const entries = Array.isArray(json) ? json : [json]; // 1 location = object, many = array
    const items = [];

    entries.forEach((entry, index) => {
      const tour = this.tours[index];
      if (!tour || !entry || !entry.current || !entry.daily || !Array.isArray(entry.daily.time)) {
        return;
      }
      if (!Number.isFinite(entry.current.temperature_2m)) {
        return;
      }
      const days = entry.daily.time.map(function (date, i) {
        return {
          date: date,
          code: entry.daily.weather_code[i],
          max: entry.daily.temperature_2m_max[i],
          min: entry.daily.temperature_2m_min[i]
        };
      });
      items.push({
        tourId: tour.id,
        temperature: entry.current.temperature_2m,
        code: entry.current.weather_code,
        wind: entry.current.wind_speed_10m,
        days: days
      });
    });
    return items;
  }

  // Returns { savedAt, items } from localStorage, or null if missing / invalid.
  readCache() {
    const cache = loadFromStorage(this.cacheKey, null);
    if (cache && typeof cache.savedAt === "number" && Array.isArray(cache.items) && cache.items.length > 0) {
      return cache;
    }
    return null;
  }

  writeCache(items) {
    saveToStorage(this.cacheKey, { savedAt: Date.now(), items: items });
  }

  clearCache() {
    removeFromStorage(this.cacheKey);
  }

  /*
   * Gets the weather. Returns { items, updatedAt, source, stale }.
   *  - fresh cache (< 30 min) is used instead of calling the API again
   *  - if the network fails but an old cache exists, the old data is shown (stale: true)
   *  - if there is nothing to show, the error is thrown to the caller
   */
  async fetchForecasts(force = false) {
    const cache = this.readCache();
    if (!force && cache && Date.now() - cache.savedAt < this.cacheMinutes * 60000) {
      return { items: cache.items, updatedAt: cache.savedAt, source: "cache", stale: false };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.buildUrl(), { signal: controller.signal });
      if (!response.ok) {
        throw new Error("The weather service answered with an error (HTTP " + response.status + ").");
      }
      const json = await response.json();
      const items = this.parseResponse(json);
      if (items.length > 0) {
        this.writeCache(items);
      }
      return { items: items, updatedAt: Date.now(), source: "network", stale: false };
    } catch (error) {
      if (cache) {
        return { items: cache.items, updatedAt: cache.savedAt, source: "cache", stale: true };
      }
      if (error.name === "AbortError") {
        throw new Error("The request took too long. Please try again.");
      }
      if (error instanceof TypeError) {
        throw new Error("Network problem. Check your internet connection.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

/* ---------- Interface ---------- */

const weatherService = new WeatherService(destinations);
const weatherEls = {
  section: document.getElementById("weather"),
  loading: document.getElementById("weather-loading"),
  grid: document.getElementById("weather-grid"),
  empty: document.getElementById("weather-empty"),
  error: document.getElementById("weather-error"),
  errorText: document.getElementById("weather-error-text"),
  status: document.getElementById("weather-status"),
  refresh: document.getElementById("weather-refresh")
};

// Shows exactly one of the four states: "loading", "success", "empty" or "error".
function setWeatherState(state) {
  weatherEls.loading.classList.toggle("d-none", state !== "loading");
  weatherEls.grid.classList.toggle("d-none", state !== "success");
  weatherEls.empty.classList.toggle("d-none", state !== "empty");
  weatherEls.error.classList.toggle("d-none", state !== "error");
  weatherEls.section.setAttribute("aria-busy", String(state === "loading"));
  weatherEls.refresh.disabled = state === "loading";
}

// Loading state: grey placeholder cards
function renderWeatherSkeletons(count) {
  weatherEls.loading.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const column = document.createElement("div");
    column.className = "col-12 col-md-6 col-lg-4";
    column.innerHTML = '<div class="weather-card weather-skeleton" aria-hidden="true"></div>';
    weatherEls.loading.appendChild(column);
  }
}

// "Thu" for "2027-07-15"
function getShortWeekday(isoDate) {
  const parts = isoDate.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

// Returns "18" (rounded) or "-" when the API sent no number.
function formatDegrees(value) {
  return Number.isFinite(value) ? String(Math.round(value)) : "-";
}

// Builds one weather card element from one parsed item.
function createWeatherCard(item) {
  const tour = findDestination(item.tourId);
  const now = WeatherService.describeCode(item.code);

  let forecastHtml = "";
  for (const day of item.days) {
    const info = WeatherService.describeCode(day.code);
    forecastHtml +=
      '<li><span class="fc-day">' + getShortWeekday(day.date) + "</span>" +
      '<span class="fc-icon" title="' + info.label + '" aria-hidden="true">' + info.icon + "</span>" +
      '<span class="fc-range">' + formatDegrees(day.max) + "&deg;<small>/" + formatDegrees(day.min) + "&deg;</small></span>" +
      '<span class="visually-hidden">' + info.label + "</span></li>";
  }

  const column = document.createElement("div");
  column.className = "col-12 col-md-6 col-lg-4";
  column.innerHTML =
    '<article class="weather-card wx-' + now.group + '">' +
      '<header class="d-flex justify-content-between align-items-start">' +
        '<div><h3 class="h6 mb-0">' + tour.name + '</h3><small class="weather-region">' + tour.region + "</small></div>" +
        '<span class="weather-icon" role="img" aria-label="' + now.label + '">' + now.icon + "</span>" +
      "</header>" +
      '<p class="weather-temp">' + formatDegrees(item.temperature) + '<span>&deg;C</span></p>' +
      '<p class="weather-desc">' + now.label + " &middot; wind " + formatDegrees(item.wind) + " km/h</p>" +
      '<ul class="forecast-strip" aria-label="5-day forecast">' + forecastHtml + "</ul>" +
      '<a href="contact.html?tour=' + tour.id + '" class="weather-link">Plan a trip here &rarr;</a>' +
    "</article>";
  return column;
}

function renderWeatherCards(items) {
  weatherEls.grid.innerHTML = "";
  items.forEach(function (item) {
    weatherEls.grid.appendChild(createWeatherCard(item));
  });
}

function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// Loads the weather and shows the right state. `force` skips the cache.
async function loadWeather(force = false) {
  setWeatherState("loading");
  weatherEls.status.textContent = "Loading live weather...";
  try {
    const result = await weatherService.fetchForecasts(force);
    if (result.items.length === 0) {
      setWeatherState("empty"); // the API answered, but there is nothing to show
      weatherEls.status.textContent = "Source: Open-Meteo";
      return;
    }
    renderWeatherCards(result.items);
    setWeatherState("success");
    weatherEls.status.textContent = result.stale
      ? "Offline: showing saved data from " + formatClock(result.updatedAt) + ". Source: Open-Meteo"
      : "Updated at " + formatClock(result.updatedAt) + ". Source: Open-Meteo";
  } catch (error) {
    weatherEls.errorText.textContent = error.message;
    setWeatherState("error");
    weatherEls.status.textContent = "Source: Open-Meteo";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  renderWeatherSkeletons(destinations.length);
  weatherEls.refresh.addEventListener("click", function () {
    loadWeather(true);
  });
  document.getElementById("weather-retry").addEventListener("click", function () {
    loadWeather(true);
  });
  loadWeather();
});
