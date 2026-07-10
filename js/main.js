(function () {
  // Mobile hamburger menu
  var burgerBtn = document.getElementById('burgerBtn');
  var mobileMenu = document.getElementById('mobileMenu');

  function closeMenu() {
    mobileMenu.hidden = true;
    burgerBtn.textContent = '☰';
    burgerBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu() {
    var isOpen = !mobileMenu.hidden;
    if (isOpen) {
      closeMenu();
    } else {
      mobileMenu.hidden = false;
      burgerBtn.textContent = '✕';
      burgerBtn.setAttribute('aria-expanded', 'true');
    }
  }

  burgerBtn.addEventListener('click', toggleMenu);
  mobileMenu.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Contact form
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');
  var resetFormBtn = document.getElementById('resetForm');

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var payload = {
      name: contactForm.name.value,
      contact: contactForm.contact.value,
      type: contactForm.type.value,
      msg: contactForm.msg.value,
    };

    // TODO: replace with a real submission endpoint once the backend exists,
    // e.g. POST payload to /api/contact and handle the response/error state.
    console.log('Contact form submitted (no backend wired up yet):', payload);

    contactForm.hidden = true;
    formSuccess.hidden = false;
  });

  resetFormBtn.addEventListener('click', function () {
    contactForm.reset();
    formSuccess.hidden = true;
    contactForm.hidden = false;
  });
})();
