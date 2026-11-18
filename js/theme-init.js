
(function () {
  try {
    var theme = JSON.parse(localStorage.getItem("theme"));
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-bs-theme", theme);
    }
    var scale = Number(JSON.parse(localStorage.getItem("fontScale")));
    if ([0.9, 1, 1.15, 1.3].indexOf(scale) !== -1) {
      document.documentElement.style.fontSize = scale * 100 + "%";
    }
  } catch (error) {
    // storage unavailable or broken value – keep the defaults
  }
})();
