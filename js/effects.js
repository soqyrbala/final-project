

// Shows a short feedback message in the corner (used when favorites change, form is sent...).
function showToast(message) {
  let $toast = $("#toast"); // ID selector
  if ($toast.length === 0) {
    $toast = $("<div>", { id: "toast", class: "app-toast", role: "status", "aria-live": "polite" })
      .hide()
      .appendTo("body");
  }
  $toast.stop(true, true).text(message).fadeIn(200).delay(2000).fadeOut(400);
}

$(function () {
  /* 1. Tour details: the cards are created by JS, so the click is delegated
        from the container (#destination-list / #featured-list). */
  $("#destination-list, #featured-list").on("click", ".btn-details", function () {
    const $button = $(this);
    const isOpen = $button.attr("aria-expanded") === "true";

    $button.closest(".destination-card") // traversal: up to the card
      .find(".card-details")             // traversal: down to the details block
      .slideToggle(250);

    $button.attr("aria-expanded", String(!isOpen)).text(isOpen ? "Details" : "Hide");
  });

  /* 2. FAQ accordion: only one answer is open at a time. */
  $("#faq .faq-question").on("click", function () {
    const $question = $(this);
    const isOpen = $question.attr("aria-expanded") === "true";

    // Close the question that is currently open (attribute selector)
    $(".faq-question[aria-expanded='true']").not(this)
      .attr("aria-expanded", "false")
      .next(".faq-answer")               // traversal: the answer right after the question
      .slideUp(200);

    $question.attr("aria-expanded", String(!isOpen))
      .next(".faq-answer")
      .slideToggle(200);

    $question.parent().toggleClass("faq-open", !isOpen); // traversal: the .faq-item wrapper
    $question.parent().siblings(".faq-item").removeClass("faq-open"); // traversal: other items
  });

  /* 3. Back-to-top button appears after scrolling down. */
  const $backToTop = $("<button>", {
    type: "button",
    id: "back-to-top",
    class: "btn btn-saffron",
    "aria-label": "Back to top",
    text: "\u2191"
  }).hide().appendTo("body");

  let backToTopVisible = false;
  $(window).on("scroll", function () {
    const shouldShow = $(window).scrollTop() > 300;
    if (shouldShow && !backToTopVisible) {
      $backToTop.fadeIn(200);
      backToTopVisible = true;
    } else if (!shouldShow && backToTopVisible) {
      $backToTop.fadeOut(200);
      backToTopVisible = false;
    }
  });

  $backToTop.on("click", function () {
    // Bootstrap sets scroll-behavior: smooth on <html>, which fights jQuery's own
    // animation, so it is switched off while .animate() runs and restored afterwards.
    const $root = $("html");
    $root.css("scroll-behavior", "auto");
    $("html, body").animate({ scrollTop: 0 }, 400, function () {
      $root.css("scroll-behavior", "");
    });
  });
});
