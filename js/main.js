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

// Micro-animations: navbar density on scroll, scroll-reveal, hero-stats count-up.
// Separate IIFE so the form/menu logic above stays untouched.
(function () {
  // Marks JS as running; CSS only hides [data-reveal] elements under .js,
  // so content stays fully visible if this script never runs.
  document.documentElement.classList.add('js');

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Sticky navbar: denser background once the page has scrolled ----
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    var headerTicking = false;
    var updateHeaderState = function () {
      siteHeader.classList.toggle('scrolled', window.scrollY > 10);
      headerTicking = false;
    };
    window.addEventListener('scroll', function () {
      if (!headerTicking) {
        window.requestAnimationFrame(updateHeaderState);
        headerTicking = true;
      }
    }, { passive: true });
    updateHeaderState();
  }

  // ---- Scroll reveal (sections + cards) and hero-stats count-up ----
  // A single shared IntersectionObserver drives both; each target is
  // unobserved right after it fires, and the observer disconnects once
  // nothing is left to watch.
  if ('IntersectionObserver' in window) {
    var revealEls = document.querySelectorAll(
      '.catalog-section, .about-section, .portfolio-section, .why-section, .contacts-section, .cat-card, .pf-card, .why-card'
    );
    revealEls.forEach(function (el) {
      el.setAttribute('data-reveal', '');
    });

    var stagger = function (list, stepMs) {
      list.forEach(function (el, i) {
        el.style.transitionDelay = (i * stepMs) + 'ms';
      });
    };
    stagger(document.querySelectorAll('.cat3 .cat-card'), 90);
    stagger(document.querySelectorAll('.pf .pf-card'), 70);
    stagger(document.querySelectorAll('.why2 .why-card'), 90);

    var statsEl = document.querySelector('.hero-stats');

    // Counts up by rewriting only the leading text node, so a trailing
    // element like the "+" in "340+" is never touched.
    var animateCount = function (textNode, target, duration) {
      textNode.nodeValue = '0';
      var start = null;
      var step = function (timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        textNode.nodeValue = String(Math.round(eased * target));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    };

    var animateStats = function () {
      statsEl.querySelectorAll('.stat-num').forEach(function (el) {
        var target = parseInt(el.textContent, 10);
        var textNode = el.childNodes[0];
        if (isNaN(target) || !textNode) return;
        if (prefersReducedMotion) {
          textNode.nodeValue = String(target);
        } else {
          animateCount(textNode, target, 1400);
        }
      });
    };

    var pending = revealEls.length + (statsEl ? 1 : 0);
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        if (entry.target === statsEl) {
          animateStats();
        } else {
          entry.target.classList.add('is-visible');
        }
        revealObserver.unobserve(entry.target);
        pending -= 1;
      });
      if (pending <= 0) {
        revealObserver.disconnect();
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
    if (statsEl) {
      revealObserver.observe(statsEl);
    }
  }
})();
