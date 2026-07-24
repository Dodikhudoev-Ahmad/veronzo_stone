// Backend API base URL (Railway production domain).
var API_BASE_URL = 'https://veronzostone-production.up.railway.app/api';
var CONTACT_API_URL = API_BASE_URL + '/contact';
var PUBLIC_API_BASE_URL = API_BASE_URL + '/public';

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
  var formError = document.getElementById('formError');
  var formErrorMessage = document.getElementById('formErrorMessage');
  var resetFormBtn = document.getElementById('resetForm');
  var submitBtn = contactForm && contactForm.querySelector('.btn-submit');

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
        if (formError) formError.hidden = true;
        firstInvalid.focus();
        return;
      }

      var payload = {
        name: contactForm.name.value,
        contact: contactForm.contact.value,
        email: contactForm.email.value,
        type: contactForm.type.value,
        message: contactForm.msg.value,
      };

      formSuccess.hidden = true;
      if (formError) formError.hidden = true;
      if (submitBtn) submitBtn.disabled = true;

      fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Request failed with status ' + response.status);
          }
          formSuccess.hidden = false;
          contactForm.reset();
        })
        .catch(function (err) {
          console.error('Contact form submission failed:', err);
          if (formErrorMessage) {
            formErrorMessage.textContent = 'Проверьте подключение к интернету и попробуйте ещё раз, либо свяжитесь с нами напрямую по телефону или в мессенджере.';
          }
          if (formError) formError.hidden = false;
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });

    resetFormBtn.addEventListener('click', function () {
      contactForm.reset();
      requiredFields.forEach(clearFieldError);
      formSuccess.hidden = true;
      if (formError) formError.hidden = true;
      if (requiredFields[0]) {
        requiredFields[0].input.focus();
      }
    });
  }
})();

// Live content: fetch the public read-only API (/api/public/*) and
// progressively enhance the static HTML already in the markup. The static
// content IS the loading/error/empty state — if a request fails or comes
// back empty, the section simply keeps what's already authored in
// index.html, so the page never shows a blank section or a visible error
// banner (which would itself be a design change). Every request is fired
// once, in parallel, on page load; nothing is polled or re-fetched.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (ch) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
  });
}

function setText(selector, value) {
  if (!value) return;
  var el = document.querySelector(selector);
  if (el) el.textContent = value;
}

// A slow/unresponsive endpoint (no response at all) would otherwise leave
// this pending indefinitely. Each attempt is bounded to 3s; with one retry
// the worst case for a single endpoint is 6s, comfortably under 8s even
// though all 8 endpoints are requested in parallel. Scroll-reveal no longer
// waits on any of this (see setupMicroAnimations/observeRevealElements
// below) — this timeout only bounds how long the live-content overlay can
// take before falling back to the static copy already in the markup.
var FETCH_TIMEOUT_MS = 3000;

function fetchJsonWithRetry(url, retriesLeft) {
  if (retriesLeft === undefined) retriesLeft = 1;
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Request failed with status ' + response.status + ' for ' + url);
      }
      return response.json();
    })
    .catch(function (err) {
      if (retriesLeft > 0) {
        return fetchJsonWithRetry(url, retriesLeft - 1);
      }
      // Logged once, only after the retry is exhausted — an expected,
      // handled degraded condition, not an unexpected application error.
      var reason = err && err.name === 'AbortError' ? 'timed out after ' + FETCH_TIMEOUT_MS + 'ms' : (err && err.message) || String(err);
      console.warn('Live content unavailable, keeping static fallback:', url, '-', reason);
      return null;
    })
    .finally(function () {
      clearTimeout(timer);
    });
}

function applyHeroStats(stats) {
  if (!stats || !stats.length) return;
  var statEls = document.querySelectorAll('.hero-stats .stat');
  stats.forEach(function (stat, i) {
    var el = statEls[i];
    if (!el) return;
    var numEl = el.querySelector('.stat-num');
    var labelEl = el.querySelector('.stat-label');
    if (numEl) {
      var accentEl = numEl.querySelector('.accent');
      if (numEl.firstChild) {
        numEl.firstChild.nodeValue = String(stat.value);
      } else {
        numEl.textContent = String(stat.value);
      }
      if (accentEl) {
        accentEl.textContent = stat.suffix || '';
      } else if (stat.suffix) {
        var span = document.createElement('span');
        span.className = 'accent';
        span.textContent = stat.suffix;
        numEl.appendChild(span);
      }
    }
    if (labelEl && stat.label) labelEl.textContent = stat.label;
  });
}

function applyCatalog(categories, products) {
  if (!categories || !categories.length || !products) return;
  var container = document.querySelector('.cat3');
  if (!container) return;

  var productByCategory = {};
  products.forEach(function (p) {
    if (!(p.categoryId in productByCategory)) productByCategory[p.categoryId] = p;
  });

  var cardsHtml = categories.map(function (category, index) {
    var product = productByCategory[category.id];
    if (!product) return '';
    var indexLabel = String(index + 1).padStart(2, '0');
    var imageBase = product.imageUrl || '';
    return (
      '<article class="cat-card">' +
        '<picture>' +
          (imageBase ? '<source srcset="' + escapeHtml(imageBase + '.avif') + '" type="image/avif">' : '') +
          '<img src="' + (imageBase ? escapeHtml(imageBase + '.webp') : '') + '" alt="' + escapeHtml(category.name) + '" width="900" height="1200" loading="lazy" decoding="async">' +
        '</picture>' +
        '<div class="cat-card-scrim"></div>' +
        '<div class="cat-card-index">' + indexLabel + '</div>' +
        '<div class="cat-card-body">' +
          '<h3>' + escapeHtml(category.name) + '</h3>' +
          '<p>' + escapeHtml(product.description || '') + '</p>' +
          (product.badgeText ? '<span class="cat-card-more">' + escapeHtml(product.badgeText) + '</span>' : '') +
        '</div>' +
      '</article>'
    );
  }).join('');

  if (!cardsHtml) return;
  container.innerHTML = cardsHtml;
  // The old .cat-card nodes (and their data-reveal-observed marker) were
  // just discarded with the innerHTML replacement; register the new ones
  // with the already-running observer instead of creating a new one.
  observeRevealElements(container);
}

function applyPortfolio(items) {
  if (!items || !items.length) return;
  var container = document.querySelector('.pf');
  if (!container) return;

  var cardsHtml = items.map(function (item) {
    var isLarge = !!item.isFeatured;
    var imageBase = item.imageUrl || '';
    var nameClass = isLarge ? 'pf-name' : 'pf-name pf-name-sm';
    var bodyClass = isLarge ? 'pf-body' : 'pf-body pf-body-sm';
    var metaClass = isLarge ? 'pf-meta' : 'pf-meta pf-meta-sm';
    return (
      '<article class="pf-card' + (isLarge ? ' pf-card-lg' : '') + '">' +
        '<picture>' +
          (imageBase ? '<source srcset="' + escapeHtml(imageBase + '.avif') + '" type="image/avif">' : '') +
          '<img src="' + (imageBase ? escapeHtml(imageBase + '.webp') : '') + '" alt="' + escapeHtml(item.title) + '" width="' + (isLarge ? '1200' : '800') + '" height="' + (isLarge ? '799' : '600') + '" loading="lazy" decoding="async">' +
        '</picture>' +
        '<div class="pf-scrim"></div>' +
        (isLarge && item.categoryTag ? '<div class="pf-tag">' + escapeHtml(item.categoryTag) + '</div>' : '') +
        '<div class="' + bodyClass + '">' +
          '<div class="' + nameClass + '">' + escapeHtml(item.title) + '</div>' +
          (item.meta ? '<div class="' + metaClass + '">' + escapeHtml(item.meta) + '</div>' : '') +
        '</div>' +
      '</article>'
    );
  }).join('');

  container.innerHTML = cardsHtml;
  // Same reasoning as applyCatalog(): register the freshly-created .pf-card
  // nodes with the existing observer instead of creating a second one.
  observeRevealElements(container);
}

function applySiteContent(entries) {
  if (!entries || !entries.length) return;
  var map = {};
  entries.forEach(function (e) { map[e.key] = e.value; });

  setText('.eyebrow span:last-child', map['hero.eyebrow']);
  setText('.hero-copy h1', map['hero.title']);
  setText('.hero-copy .lede', map['hero.lede']);
  setText('.hero-image-tag', map['hero.imageTag']);
  setText('#catalog .section-head-note', map['catalog.sectionNote']);
  setText('#about h2', map['about.heading']);
  var aboutParas = document.querySelectorAll('.about > div:nth-child(2) > p');
  if (aboutParas[0] && map['about.paragraph1']) aboutParas[0].textContent = map['about.paragraph1'];
  if (aboutParas[1] && map['about.paragraph2']) aboutParas[1].textContent = map['about.paragraph2'];
  setText('#why h2', map['why.heading']);
  setText('.contacts-info h2', map['contacts.heading']);
  setText('.contacts-info > p', map['contacts.paragraph']);
  setText('.footer-tagline', map['footer.tagline']);
}

function applyContactInfo(entries) {
  if (!entries || !entries.length) return;
  var rows = document.querySelectorAll('.contacts-details > div');
  entries.forEach(function (entry, i) {
    var row = rows[i];
    if (!row) return;
    var labelEl = row.querySelector('.contacts-details-label');
    var valueEl = row.querySelector('.contacts-details-value');
    if (labelEl && entry.label) labelEl.textContent = entry.label;
    if (valueEl && entry.value) valueEl.textContent = entry.value;
  });
}

function applySocialLinks(entries) {
  if (!entries || !entries.length) return;
  entries.forEach(function (entry) {
    var el = document.querySelector('.contact-social[data-platform="' + entry.platform + '"]');
    if (el && entry.url) el.setAttribute('href', entry.url);
  });
}

function applySeo(seo) {
  if (!seo) return;
  if (seo.title) {
    document.title = seo.title;
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', seo.title);
  }
  if (seo.description) {
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', seo.description);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', seo.description);
  }
  if (seo.ogImageUrl) {
    var absoluteUrl = /^https?:\/\//.test(seo.ogImageUrl)
      ? seo.ogImageUrl
      : (location.origin + '/' + seo.ogImageUrl.replace(/^\//, ''));
    var ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', absoluteUrl);
  }
}

function loadSiteData() {
  return Promise.all([
    fetchJsonWithRetry(PUBLIC_API_BASE_URL + '/hero-stats'),
    fetchJsonWithRetry(PUBLIC_API_BASE_URL + '/categories'),
    fetchJsonWithRetry(PUBLIC_API_BASE_URL + '/products'),
    fetchJsonWithRetry(PUBLIC_API_BASE_URL + '/portfolio-items'),
    fetchJsonWithRetry(PUBLIC_API_BASE_URL + '/site-content'),
    fetchJsonWithRetry(PUBLIC_API_BASE_URL + '/contact-info'),
    fetchJsonWithRetry(PUBLIC_API_BASE_URL + '/social-links'),
    fetchJsonWithRetry(PUBLIC_API_BASE_URL + '/seo-meta/home')
  ]).then(function (results) {
    applyHeroStats(results[0]);
    applyCatalog(results[1], results[2]);
    applyPortfolio(results[3]);
    applySiteContent(results[4]);
    applyContactInfo(results[5]);
    applySocialLinks(results[6]);
    applySeo(results[7]);
  });
}

// Micro-animations: navbar density on scroll, scroll-reveal, hero-stats count-up.
//
// setupMicroAnimations() must NOT wait on loadSiteData() — the reveal
// observer has to be watching the static fallback content the instant the
// DOM is ready, regardless of whether/when the API responds. Two
// responsibilities are split out on purpose:
//   - setupMicroAnimations(): creates the IntersectionObserver and the
//     scroll listener exactly once, then does an initial scan of the DOM.
//   - observeRevealElements(root): finds elements matching REVEAL_SELECTOR
//     under `root` that aren't registered yet, marks them, and hands them
//     to the (already-existing) observer. Safe to call again later — e.g.
//     right after applyCatalog()/applyPortfolio() replace .cat-card/.pf-card
//     nodes with fresh ones from the API — without touching elements that
//     are already being watched or have already revealed.
var microAnimationsInitialized = false;
var revealObserver = null;
var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var REVEAL_SELECTOR = '.catalog-section, .about-section, .portfolio-section, .why-section, .contacts-section, .cat-card, .pf-card, .why-card';

// Staggers only elements that don't already carry a transition-delay, so
// cards revealed earlier keep their original delay and it's never
// recomputed/duplicated on a later, partial re-scan.
function applyRevealStagger(root) {
  var scope = root || document;
  var stagger = function (list, stepMs) {
    list.forEach(function (el, i) {
      if (el.style.transitionDelay) return;
      el.style.transitionDelay = (i * stepMs) + 'ms';
    });
  };
  stagger(scope.querySelectorAll('.cat3 .cat-card'), 90);
  stagger(scope.querySelectorAll('.pf .pf-card'), 70);
  stagger(scope.querySelectorAll('.why2 .why-card'), 90);
}

function observeRevealElements(root) {
  if (!revealObserver) return;
  var scope = root || document;
  var candidates = scope.querySelectorAll(REVEAL_SELECTOR);
  candidates.forEach(function (el) {
    if (el.hasAttribute('data-reveal-observed')) return;
    el.setAttribute('data-reveal-observed', 'true');
    if (!el.hasAttribute('data-reveal')) {
      el.setAttribute('data-reveal', '');
    }
    revealObserver.observe(el);
  });
  applyRevealStagger(scope);
}

function setupMicroAnimations() {
  if (microAnimationsInitialized) return;
  microAnimationsInitialized = true;

  // Marks JS as running; CSS only hides [data-reveal] elements under .js,
  // so content stays fully visible if this script never runs.
  document.documentElement.classList.add('js');

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

  if (!('IntersectionObserver' in window)) return;

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

  // Created exactly once (guarded by microAnimationsInitialized above).
  // Not disconnected once "empty" — observeRevealElements() may still feed
  // it newly-created cards after an API response arrives later.
  revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      if (entry.target === statsEl) {
        animateStats();
      } else {
        entry.target.classList.add('is-visible');
      }
      // Unobserved right after it fires — already-revealed elements are
      // never re-animated by a later observeRevealElements() rescan, since
      // that rescan also skips anything already marked data-reveal-observed.
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  observeRevealElements(document);
  if (statsEl) {
    revealObserver.observe(statsEl);
  }
}

// Animations must be live immediately, independent of the API. loadSiteData()
// runs in parallel and, once it settles (success or failure), only needs to
// register whatever new elements it introduced — the catalog/portfolio cards
// already do this themselves right after they rebuild their container (see
// applyCatalog/applyPortfolio above); this final call is a cheap no-op safety
// net for anything else, since observeRevealElements() skips everything
// already registered.
setupMicroAnimations();

loadSiteData()
  .catch(function (err) {
    console.error('loadSiteData failed unexpectedly, keeping static fallback:', err);
  })
  .finally(function () {
    observeRevealElements(document);
  });
