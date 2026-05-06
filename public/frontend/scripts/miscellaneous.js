const form = document.getElementById('targ');
const status = document.getElementById('stat');
const createBtn = document.getElementById('create-button');
const list = document.getElementById('lis');
const listTitle = document.getElementById('lit');
const refreshBtn = document.getElementById('refr');
const destroyAll = document.getElementById('dall');
const slugMode = document.getElementById('slug-mode');
const rememberSlug = document.getElementById('remember-slug-mode');
const welcome = document.getElementById('welcome');

let ticker = null;
let timers = [];
let slugs = [];

(() => {
  try {
    const KEY = 'welcome';
    const seen = localStorage.getItem(KEY);
    if (seen === null) {
      localStorage.setItem(KEY, '1');
    } else if (welcome) {
      welcome.textContent = 'Welcome back to';
    }
  } catch { }
})();

const MODE_KEY = 'slugMode';
const REMEMBER_KEY = 'rememberSlugMode';
const VALID_MODES = new Set(['letters', 'numbers', 'alphanumeric', 'words', 'icons']);

function prefers12h() {
  let result = true;
  try {
    const opts = new Intl.DateTimeFormat().resolvedOptions();
    if (typeof opts.hour12 === 'boolean') return opts.hour12;
    const date = new Date(Date.UTC(2020, 0, 1, 13, 0, 0));
    const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', timeZone: 'UTC' }).formatToParts(date);
    result = parts.some((p) => p.type === 'dayPeriod');
  } catch { }
  return result;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: prefers12h(),
});

const formatDate = (ts) => dateFormat.format(new Date(ts));

(function initSavedMode() {
  try {
    const flag = localStorage.getItem(REMEMBER_KEY);
    if (rememberSlug && flag === '1') rememberSlug.checked = true;
    if (slugMode && rememberSlug && rememberSlug.checked) {
      const saved = localStorage.getItem(MODE_KEY);
      if (saved && VALID_MODES.has(saved)) slugMode.value = saved;
    }
  } catch { }
})();

if (rememberSlug) {
  rememberSlug.addEventListener('change', () => {
    try {
      if (rememberSlug.checked) {
        localStorage.setItem(REMEMBER_KEY, '1');
        if (slugMode && VALID_MODES.has(slugMode.value)) localStorage.setItem(MODE_KEY, slugMode.value);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(MODE_KEY);
      }
    } catch { }
  });
}

if (slugMode) {
  slugMode.addEventListener('change', () => {
    try {
      if (rememberSlug && rememberSlug.checked) {
        const v = slugMode.value;
        if (VALID_MODES.has(v)) localStorage.setItem(MODE_KEY, v);
      }
    } catch { }
  });
}

function setText(el, text) {
  el.textContent = text;
}

function truncate(url, max = 25) {
  try {
    if (!url || typeof url !== 'string') return '';
    return url.length > max ? url.slice(0, max) + '...' : url;
  } catch {
    return String(url);
  }
}

function showSpinner(el, message = 'Loading...') {
  el.innerHTML = '<span class="spinner" aria-label="loading" role="status"></span> ' + message;
}

function formatRemaining(ms) {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts = [];
  if (hours > 0) parts.push(hours + 'h');
  parts.push(String(minutes).padStart(2, '0') + 'm');
  parts.push(String(seconds).padStart(2, '0') + 's');
  return parts.join(' ');
}