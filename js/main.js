(function () {
  // Mobile hamburger menu
  var burgerBtn = document.getElementById('burgerBtn');
  var mobileMenu = document.getElementById('mobileMenu');

  if (burgerBtn && mobileMenu) {
    var desktopQuery = window.matchMedia('(min-width: 900px)');

    var openMenu = function () {
      mobileMenu.hidden = false;
      burgerBtn.textContent = '✕';
      burgerBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    };

    var closeMenu = function (returnFocus) {
      if (mobileMenu.hidden) return;
      mobileMenu.hidden = true;
      burgerBtn.textContent = '☰';
      burgerBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      if (returnFocus) {
        burgerBtn.focus();
      }
    };

    var toggleMenu = function () {
      if (mobileMenu.hidden) {
        openMenu();
      } else {
        closeMenu(false);
      }
    };

    burgerBtn.addEventListener('click', toggleMenu);

    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu(false);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.hidden) {
        closeMenu(true);
      }
    });

    desktopQuery.addEventListener('change', function (e) {
      if (e.matches && !mobileMenu.hidden) {
        closeMenu(false);
      }
    });
  }

  // Contact form
  var contactForm = document.getElementById('contactForm');
  var formSuccess = document.getElementById('formSuccess');
  var resetFormBtn = document.getElementById('resetForm');

  if (contactForm && formSuccess && resetFormBtn) {
    // Disable native validation UI only once JS is confirmed running,
    // so the required attribute still guards submission if the script fails to load.
    contactForm.noValidate = true;

    var requiredFields = [
      { input: document.getElementById('fName'), errorEl: document.getElementById('fName-error'), message: 'Пожалуйста, укажите имя.' },
      { input: document.getElementById('fContact'), errorEl: document.getElementById('fContact-error'), message: 'Пожалуйста, укажите телефон.' },
    ].filter(function (field) {
      return field.input && field.errorEl;
    });

    var setFieldError = function (field) {
      field.input.setAttribute('aria-invalid', 'true');
      field.errorEl.textContent = field.message;
    };

    var clearFieldError = function (field) {
      field.input.removeAttribute('aria-invalid');
      field.errorEl.textContent = '';
    };

    requiredFields.forEach(function (field) {
      field.input.addEventListener('input', function () {
        if (field.input.value.trim() !== '') {
          clearFieldError(field);
        }
      });
    });

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      requiredFields.forEach(function (field) {
        if (field.input.value.trim() === '') {
          setFieldError(field);
          firstInvalid = firstInvalid || field.input;
        } else {
          clearFieldError(field);
        }
      });

      if (firstInvalid) {
        formSuccess.hidden = true;
        firstInvalid.focus();
        return;
      }

      var payload = {
        name: contactForm.name.value,
        contact: contactForm.contact.value,
        type: contactForm.type.value,
        msg: contactForm.msg.value,
      };

      // TODO: replace with a real submission endpoint once the backend exists,
      // e.g. POST payload to /api/contact and handle the response/error state.
      console.log('Contact form filled (demo mode, nothing sent yet):', payload);

      formSuccess.hidden = false;
    });

    resetFormBtn.addEventListener('click', function () {
      contactForm.reset();
      requiredFields.forEach(clearFieldError);
      formSuccess.hidden = true;
      if (requiredFields[0]) {
        requiredFields[0].input.focus();
      }
    });
  }
})();
