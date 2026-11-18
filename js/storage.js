

// Returns a saved value, or `fallback` if nothing is saved or the data is broken.
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    return fallback; // storage blocked or invalid JSON
  }
}

// Saves any JSON-compatible value. Returns true when saving worked.
function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Could not save to localStorage:", error);
    return false;
  }
}

function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Could not clear localStorage key:", error);
  }
}

/*
 * BookingStore – keeps the list of Booking objects and mirrors it in localStorage.
 * Provides the four CRUD operations used by the booking form and the My Trips page.
 */
class BookingStore {
  constructor(storageKey = "bookings") {
    this.storageKey = storageKey;
    this.bookings = [];
    this.load();
  }

  // Read: restores bookings; broken or unknown entries are skipped safely
  load() {
    const saved = loadFromStorage(this.storageKey, []);
    this.bookings = Array.isArray(saved)
      ? saved.filter(Booking.isValidData).map(function (data) {
          return new Booking(data);
        })
      : [];
  }

  save() {
    saveToStorage(this.storageKey, this.bookings);
  }

  get count() {
    return this.bookings.length;
  }

  getAll() {
    return this.bookings.slice();
  }

  getById(id) {
    return this.bookings.find(function (booking) {
      return booking.id === id;
    });
  }

  // Create
  add(booking) {
    this.bookings.push(booking);
    this.save();
    return booking;
  }

  // Update: returns the changed booking, or null if the id does not exist
  update(id, changes) {
    const booking = this.getById(id);
    if (!booking) {
      return null;
    }
    booking.update(changes);
    this.save();
    return booking;
  }

  // Delete: returns true if something was removed
  remove(id) {
    const before = this.bookings.length;
    this.bookings = this.bookings.filter(function (booking) {
      return booking.id !== id;
    });
    this.save();
    return this.bookings.length < before;
  }

  // Delete everything
  clear() {
    this.bookings = [];
    removeFromStorage(this.storageKey);
  }
}

// One shared store for every page
const bookingStore = new BookingStore();
