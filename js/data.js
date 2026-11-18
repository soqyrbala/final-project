
const tourData = [
  {
    id: "charyn-canyon",
    name: "Charyn Canyon",
    category: "Canyon",
    region: "Almaty Region",
    difficulty: "Easy",
    days: 2,
    price: 180,
    featured: true,
    image: "images/charyn-canyon.jpg",
    description: "Walk the Valley of Castles at golden hour.",
    highlights: ["Valley of Castles trail", "Picnic by the Charyn river", "Sunset viewpoint"],
    lat: 43.35,
    lon: 79.08,
    extras: [
      { id: "picnic", label: "Picnic lunch", price: 12, perPerson: true },
      { id: "photo-guide", label: "Photo guide", price: 40, perPerson: false }
    ]
  },
  {
    id: "kolsai-lakes",
    name: "Kolsai Lakes",
    category: "Lakes",
    region: "Almaty Region",
    difficulty: "Moderate",
    days: 3,
    price: 260,
    featured: true,
    image: "images/kolsai-lakes.jpg",
    description: "Three alpine lakes surrounded by spruce forest.",
    highlights: ["Hike to the second lake", "Homestay in Saty village", "Horse ride option"],
    lat: 42.99,
    lon: 78.32,
    extras: [
      { id: "horse-ride", label: "Horse ride", price: 30, perPerson: true },
      { id: "homestay-upgrade", label: "Homestay upgrade", price: 45, perPerson: false }
    ]
  },
  {
    id: "altai-mountains",
    name: "Altai Mountains",
    category: "Mountains",
    region: "East Kazakhstan",
    difficulty: "Hard",
    days: 6,
    price: 640,
    featured: true,
    image: "images/altai.jpg",
    description: "Glaciers, rivers and wild valleys on a 6-day route.",
    highlights: ["Belukha viewpoint", "Camping under the stars", "Local mountain guide"],
    lat: 49.17,
    lon: 85.60,
    extras: [
      { id: "camping-gear", label: "Camping gear rental", price: 60, perPerson: true },
      { id: "porter", label: "Porter service", price: 90, perPerson: false }
    ]
  },
  {
    id: "lake-kaindy",
    name: "Lake Kaindy",
    category: "Lakes",
    region: "Almaty Region",
    difficulty: "Moderate",
    days: 2,
    price: 210,
    featured: false,
    image: "images/kaindy.webp",
    description: "The sunken spruce forest in a turquoise lake.",
    highlights: ["Sunken forest photo stop", "Off-road drive", "Lakeside lunch"],
    lat: 42.99,
    lon: 78.47,
    extras: [
      { id: "kayak", label: "Kayak rental", price: 25, perPerson: true },
      { id: "offroad-upgrade", label: "Off-road upgrade", price: 35, perPerson: false }
    ]
  },
  {
    id: "tien-shan-trek",
    name: "Tien Shan Trek",
    category: "Mountains",
    region: "Almaty Region",
    difficulty: "Hard",
    days: 4,
    price: 420,
    featured: false,
    image: "images/tien-shan-web.jpg",
    description: "A 4-day trek across high passes and meadows.",
    highlights: ["High mountain passes", "Tent camp", "Gear checklist included"],
    lat: 43.05,
    lon: 76.99,
    extras: [
      { id: "poles", label: "Trekking poles", price: 10, perPerson: true },
      { id: "beacon", label: "Satellite beacon rental", price: 50, perPerson: false }
    ]
  },
  {
    id: "steppe-stargazing",
    name: "Steppe Sunset & Stargazing",
    category: "Steppe",
    region: "Central Kazakhstan",
    difficulty: "Easy",
    days: 1,
    price: 95,
    featured: false,
    image: "images/steppe-sunset.jpg",
    description: "An evening in the open steppe, then a clear night sky.",
    highlights: ["Sunset picnic", "Telescope session", "Transfer from Astana"],
    lat: 50.60,
    lon: 70.00,
    extras: [
      { id: "telescope", label: "Telescope session", price: 15, perPerson: true },
      { id: "dinner", label: "Dinner under the stars", price: 20, perPerson: true }
    ]
  }
];

// Array #1: Tour objects created from the raw data above (used on Home, Destinations, Contact, My Trips)
const destinations = tourData.map(function (data) {
  return new Tour(data);
});

// Array #2: gallery photos (used on the Gallery page)
const galleryItems = [
  { src: "images/kaindy.webp", alt: "Lake Kaindy", caption: "Lake Kaindy", category: "Lakes", wide: true },
  { src: "images/steppe-sunset.jpg", alt: "Steppe sunset", caption: "Steppe sunset", category: "Steppe", wide: false },
  { src: "images/tien-shan-web.jpg", alt: "Tien Shan mountains", caption: "Tien Shan", category: "Mountains", wide: false },
  { src: "images/altai.jpg", alt: "Altai mountains", caption: "Altai", category: "Mountains", wide: false },
  { src: "images/charyn-canyon.jpg", alt: "Charyn Canyon", caption: "Charyn Canyon", category: "Canyon", wide: true },
  { src: "images/night-sky.jpg", alt: "Night sky over the mountains", caption: "Night sky", category: "Steppe", wide: false }
];
