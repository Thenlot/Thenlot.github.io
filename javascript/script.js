/* ========== Menu mobile ========== */
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');

toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
});

menu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });
});

/* ========== Section active dans le menu ========== */
const links = [...menu.querySelectorAll('a')];
// Seuls les liens internes (#section) sont suivis ; les autres pages sont ignorées
const sections = links
  .map((link) => {
    const href = link.getAttribute('href');
    return href.startsWith('#') ? document.querySelector(href) : null;
  })
  .filter(Boolean);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
      });
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);
sections.forEach((section) => observer.observe(section));

/* ========== Mode clair / sombre ========== */
const root = document.documentElement;
const themeButton = document.getElementById('theme-toggle');

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  // L'icône montre le mode vers lequel on bascule
  themeButton.textContent = theme === 'dark' ? '☀' : '☾';
  themeButton.setAttribute('aria-label', theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre');
}

applyTheme(root.getAttribute('data-theme') || 'light');

themeButton.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('theme', next); } catch (e) {}
});

/* ========== Traduction FR / EN / DE ==========
   Le site est écrit en français. Pour EN et DE, on charge le traducteur de
   Google, qui traduit tout le texte de la page (même ce que tu ajouteras plus
   tard). Le choix est mémorisé. */
const SOURCE_LANG = 'fr';
const LANGS = ['fr', 'en', 'de'];
const langButtons = document.querySelectorAll('.lang button');

function cookieLang() {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[a-z-]+\/([a-z-]+)/);
  return m ? m[1] : null;
}

function getLang() {
  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  const lang = saved || cookieLang() || SOURCE_LANG;
  return LANGS.includes(lang) ? lang : SOURCE_LANG;
}

function writeCookie(value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const base = `googtrans=${value}; expires=${expires}; path=/`;
  document.cookie = base;                                   // domaine courant
  document.cookie = `${base}; domain=${location.hostname}`; // domaine explicite
}

function setLang(lang) {
  if (lang === getLang()) return;
  try { localStorage.setItem('lang', lang); } catch (e) {}
  if (lang === SOURCE_LANG) {
    writeCookie('', -1);
  } else {
    writeCookie(`/${SOURCE_LANG}/${lang}`, 365);
  }
  location.reload();
}

langButtons.forEach((button) => {
  button.addEventListener('click', () => setLang(button.dataset.lang));
});

const currentLang = getLang();
langButtons.forEach((button) => {
  button.setAttribute('aria-pressed', button.dataset.lang === currentLang);
});

function showTranslateError() {
  if (document.getElementById('translate-error')) return;
  const note = document.createElement('p');
  note.id = 'translate-error';
  note.className = 'translate-note notranslate';
  note.setAttribute('translate', 'no');
  note.textContent =
    "La traduction n'a pas pu se charger. Désactive ton bloqueur de publicités ou de pisteurs pour ce site, puis recharge la page.";
  document.body.prepend(note);
}

// Force le traducteur à passer dans la langue choisie, quoi qu'il arrive
function applyTranslation(lang) {
  let tries = 0;
  const timer = setInterval(() => {
    const combo = document.querySelector('select.goog-te-combo');
    tries += 1;
    if (combo) {
      clearInterval(timer);
      if (combo.value !== lang) {
        combo.value = lang;
        combo.dispatchEvent(new Event('change'));
      }
    } else if (tries > 40) { // ~10 secondes
      clearInterval(timer);
      showTranslateError();
    }
  }, 250);
}

window.googleTranslateElementInit = function () {
  new google.translate.TranslateElement(
    { pageLanguage: SOURCE_LANG, includedLanguages: 'en,de', autoDisplay: false },
    'google_translate_element'
  );
  applyTranslation(currentLang);
};

// On ne charge Google que si une autre langue que le français est choisie
if (currentLang !== SOURCE_LANG) {
  writeCookie(`/${SOURCE_LANG}/${currentLang}`, 365);
  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  script.onerror = showTranslateError;
  document.body.appendChild(script);
}