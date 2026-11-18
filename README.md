# Steppe & Peaks – Final Project

**Topic:** travel agency website about Kazakhstan. This is the final stage of the midterm and endterm projects:
all earlier pages and features still work, and the site is now a client-side web application.

- **Live site:**https://github.com/soqyrbala/final-project 
- **Repository:** https://soqyrbala.github.io/final-project/

## Group members

| Name | Contribution |
|------|--------------|
| _Saginbek Mansur_ | _e.g. API integration (weather), classes, booking wizard, validation, draft saving, My Trips (CRUD, chart, pagination), accessibility_ |
## Final-stage features

**Mandatory**

1. **API integration** – live weather and a 5-day forecast for every tour (Open-Meteo). Loading, success, empty-data and error states, a *Refresh* / *Try again* button, a request timeout and an offline fallback.
2. **Object-oriented JavaScript** – classes `Tour`, `Booking`, `BookingStore` and `WeatherService`; many objects are created from them and they run the real features of the site.
3. **localStorage** – saved bookings, an autosaved booking draft, the weather cache, favorites, theme and text size. Everything is stored as JSON, restored on the next visit, and can be edited or cleared. Missing or broken stored values are ignored safely.

**Additional (chosen from the list)**

4. **Complete CRUD** – the new *My Trips* page: create (booking form or demo data), read (table), update (edit window with validation), delete (confirm window, "Delete all").
5. **Search / filter / sort / pagination** on real data – search, status filter, 5 sort options and pagination (5 trips per page) on *My Trips*.
6. **Dashboard** – statistics cards (active trips, travellers, total spend, next trip) and a "spend by tour" bar chart built from the saved bookings.
7. **Advanced form** – the booking form is a 3-step wizard with a progress bar, **dependent fields** (extras and a required "experience" checkbox appear depending on the chosen tour), **calculated values** (group discount + extras, live price and summary) and custom validation per step.
8. **Accessibility** – text-size control (90–130 %, saved), "Skip to main content" link, `aria-live` messages, `aria-current` / `aria-pressed` / `aria-expanded` states, keyboard-friendly modals and lightbox, `prefers-reduced-motion` support (together with the dark theme from the endterm).
9. **Advanced modal windows** – Bootstrap edit and confirmation windows.

**Everything from the earlier stages still works:** five original pages, Bootstrap layout, dark theme, search/filter/sort/favorites on Destinations, gallery with lightbox, FAQ accordion, jQuery effects, back-to-top button, custom form validation.

## API information

| | |
|---|---|
| **Service** | Open-Meteo Forecast API – https://open-meteo.com |
| **Endpoint** | `GET https://api.open-meteo.com/v1/forecast` |
| **Key needed?** | No. Free, public, supports browser requests (CORS), so no secret is stored in the code. |
| **Request** | One request for all tours: comma-separated `latitude` / `longitude` (from each `Tour`), `current=temperature_2m,weather_code,wind_speed_10m`, `daily=weather_code,temperature_2m_max,temperature_2m_min`, `forecast_days=5`, `timezone=auto` |
| **Used in** | `js/weather.js` (class `WeatherService`), Destinations page, section *Live weather at our destinations* |
| **Cache** | The answer is kept in localStorage for 30 minutes. If the network fails, the last saved data is shown with an "Offline" note. |

States: **loading** (grey animated cards), **success** (weather cards), **empty data** (message), **error** (message + *Try again*).

## How to run and test

No installation or build step is needed. Open `index.html` in a browser (Bootstrap and jQuery load from CDN, so an internet connection is required). For best results use a local server, e.g. `python -m http.server` and open `http://localhost:8000`.

1. **Weather (API)** – open *Destinations* and scroll to *Live weather*: skeleton cards appear first, then six cards. Press *Refresh* to call the API again. Turn off the internet and press *Refresh*: the saved data stays with an "Offline" note. (With no saved data you will see the error message and *Try again*.)
2. **Booking wizard** – open *Contact* (or press *Book* on any tour).
   - Press *Next* on an empty step: each field shows its own message.
   - Choose *Altai Mountains*: a required "experience" checkbox and two extras appear (hard tour). Choose *Charyn Canyon*: they change or disappear.
   - Choose 4 travellers: a 10 % group discount is applied to the live price.
   - Fill step 1 and 2, then reload the page: your **draft is restored** (press *Clear draft* to remove it).
   - Finish step 3: a success message with a reference code (e.g. `SP-AB12CD`) appears.
3. **My Trips (CRUD, dashboard)** – open *My Trips*. Press *Load demo data* (or use your own booking). Check the cards and the chart, then try search, status filter, sorting and pagination (add more than five trips). Use *Edit* (try 9 travellers to see validation), *Delete* (confirm window) and *Delete all*. Reload: the data is still there.
4. **Home** – with saved trips, a "Welcome back" banner shows the next trip.
5. **Accessibility** – the *Aa* menu changes the text size (kept after reload); press `Tab` on any page to see the *Skip to main content* link; *Dark mode* works on all pages.
6. **Earlier features** – see the endterm checklist: filters, favorites, gallery lightbox (`←` `→` `Esc`), FAQ, back-to-top, validation messages.

To see what is stored: `F12` → *Application* → *Local Storage* (keys: `bookings`, `bookingDraft`, `weatherCache`, `favorites`, `theme`, `fontScale`).

## Where each requirement is in the code

| Requirement | Location |
|-------------|----------|
| Class with constructor, properties, methods | `js/models.js` – `Tour` (`getPriceBreakdown`, `calculateTotal`, `matches`…), `Booking` (`getTotal`, `update`, `toJSON`…) |
| More classes | `js/storage.js` – `BookingStore` (`add`, `update`, `remove`, `clear`, `load`); `js/weather.js` – `WeatherService` (`buildUrl`, `fetchForecasts`, `parseResponse`) |
| Many objects from a class | 6 `Tour` objects in `js/data.js`; a `Booking` is created for every saved trip |
| `fetch` + `async/await` + states | `WeatherService.fetchForecasts`, `loadWeather` in `js/weather.js` |
| JSON handling | `JSON.parse` / `JSON.stringify` in `js/storage.js`; `response.json()` and `parseResponse` in `js/weather.js` |
| localStorage (save, restore, update, clear) | `js/storage.js`, draft in `js/contact.js`, cache in `js/weather.js`, preferences in `js/main.js` |
| Safe handling of invalid stored values | `loadFromStorage`, `Booking.isValidData`, `restoreDraft`, `readCache` |
| CRUD | `js/trips.js` (+ `bookingStore`) |
| Chart / statistics | `calculateStats`, `groupSpendByTour`, `renderChart` in `js/trips.js` |
| Multi-step / dependent fields | `js/contact.js` – `showStep`, `updateDependentFields`, `renderSummary` |
| Shared validation rules | `js/validation.js` |
| jQuery (kept and extended) | `js/effects.js`, plus `fadeIn` for wizard steps and `fadeOut` for deleted rows |

## Project structure

```
index.html  about.html  destinations.html  gallery.html  contact.html  trips.html
css/style.css
js/theme-init.js    applies saved theme and text size before the page is painted
js/models.js        classes Tour and Booking
js/data.js          raw tour data -> Tour objects, gallery data
js/storage.js       localStorage helpers + class BookingStore
js/main.js          shared code: favorites, theme, text size, cards, trip counter
js/validation.js    custom validation rules (Contact, My Trips)
js/weather.js       API: class WeatherService + weather interface (Destinations)
js/destinations.js  Destinations page: search, filters, sorting, favorites
js/gallery.js       Gallery page
js/contact.js       Contact page: booking wizard, draft, saving
js/trips.js         My Trips page: CRUD, dashboard, pagination
js/effects.js       jQuery features
images/
```

Libraries: Bootstrap 5.3.3 and jQuery 3.7.1 (CDN).

## Notes

- There is no server: bookings exist only in the browser of the person who made them, and nothing is sent anywhere.
- Weather data comes live from Open-Meteo; temperatures are in °C, wind in km/h.
- `images/tien-shan-web.jpg` is a 1600 px copy of the 17 MB original, used so pages load quickly.
- The prices, extras and the three tours added in the endterm are example data and can be changed in `js/data.js`.
