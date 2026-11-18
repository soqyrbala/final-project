

class Tour {
  // Group discount rules are shared by all tours, so they are static
  static GROUP_DISCOUNT_FROM = 4;
  static GROUP_DISCOUNT_RATE = 0.1;

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.category = data.category;
    this.region = data.region;
    this.difficulty = data.difficulty;
    this.days = data.days;
    this.price = data.price;
    this.featured = data.featured;
    this.image = data.image;
    this.description = data.description;
    this.highlights = data.highlights;
    this.lat = data.lat;
    this.lon = data.lon;
    this.extras = data.extras || [];
  }

  // "1 day" / "3 days"
  getDurationLabel() {
    return this.days + (this.days === 1 ? " day" : " days");
  }

  // 0.1 for groups of 4+ travellers, otherwise 0
  getDiscountRate(travellers) {
    return travellers >= Tour.GROUP_DISCOUNT_FROM ? Tour.GROUP_DISCOUNT_RATE : 0;
  }

  // Returns the extra option with this id (or undefined)
  getExtra(extraId) {
    return this.extras.find(function (extra) {
      return extra.id === extraId;
    });
  }

  /*
   * Returns the full price breakdown for a group:
   * { base, discount, extrasTotal, total }
   * Extras can be "per person" or a flat price for the whole group.
   */
  getPriceBreakdown(travellers, extraIds = []) {
    const base = this.price * travellers;
    const discount = Math.round(base * this.getDiscountRate(travellers));

    let extrasTotal = 0;
    for (const extraId of extraIds) {
      const extra = this.getExtra(extraId);
      if (extra) {
        extrasTotal += extra.perPerson ? extra.price * travellers : extra.price;
      }
    }
    return { base: base, discount: discount, extrasTotal: extrasTotal, total: base - discount + extrasTotal };
  }

  // Shortcut that returns only the final price
  calculateTotal(travellers, extraIds = []) {
    return this.getPriceBreakdown(travellers, extraIds).total;
  }

  // True when the tour fits the search text, type, difficulty and max price
  matches(filters) {
    const query = filters.query.trim().toLowerCase();
    const text = (this.name + " " + this.region + " " + this.description).toLowerCase();
    return (
      text.includes(query) &&
      (filters.category === "all" || this.category === filters.category) &&
      (filters.difficulty === "all" || this.difficulty === filters.difficulty) &&
      this.price <= filters.maxPrice
    );
  }
}

class Booking {
  static STATUSES = ["Pending", "Confirmed", "Cancelled"];

  constructor(data) {
    this.id = data.id;
    this.tourId = data.tourId;
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone || "";
    this.travellers = Number(data.travellers);
    this.startDate = data.startDate; // "YYYY-MM-DD"
    this.extras = Array.isArray(data.extras) ? data.extras : [];
    this.message = data.message || "";
    this.status = Booking.STATUSES.includes(data.status) ? data.status : "Pending";
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  // Creates a short reference code like "SP-K3F9A2"
  static generateId() {
    const random = Math.random().toString(36).slice(2, 5);
    const time = Date.now().toString(36).slice(-3);
    return "SP-" + (time + random).toUpperCase();
  }

  // Checks data read from localStorage before it becomes a Booking
  static isValidData(data) {
    return (
      data !== null &&
      typeof data === "object" &&
      typeof data.id === "string" &&
      typeof data.name === "string" &&
      typeof data.email === "string" &&
      typeof data.startDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(data.startDate) &&
      Number.isInteger(Number(data.travellers)) &&
      Number(data.travellers) >= 1 &&
      destinations.some(function (tour) {
        return tour.id === data.tourId;
      })
    );
  }

  // The Tour object this booking belongs to
  get tour() {
    return destinations.find((tour) => tour.id === this.tourId);
  }

  getTotal() {
    return this.tour.calculateTotal(this.travellers, this.extras);
  }

  // The start date as a local Date object (avoids timezone shifts of "YYYY-MM-DD")
  getStartDate() {
    const parts = this.startDate.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  // Whole days from today until the trip starts (negative = in the past)
  getDaysUntilStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((this.getStartDate() - today) / 86400000);
  }

  // Changes only the fields that are allowed to be edited
  update(changes) {
    if (changes.travellers !== undefined) this.travellers = Number(changes.travellers);
    if (changes.startDate !== undefined) this.startDate = changes.startDate;
    if (changes.message !== undefined) this.message = changes.message;
    if (changes.status !== undefined && Booking.STATUSES.includes(changes.status)) {
      this.status = changes.status;
    }
  }

  // Plain object for JSON.stringify (called automatically)
  toJSON() {
    return {
      id: this.id,
      tourId: this.tourId,
      name: this.name,
      email: this.email,
      phone: this.phone,
      travellers: this.travellers,
      startDate: this.startDate,
      extras: this.extras,
      message: this.message,
      status: this.status,
      createdAt: this.createdAt
    };
  }
}
