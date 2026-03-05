const form = document.getElementById("targ");
const status = document.getElementById("stat");
const createBtn = document.getElementById("create-button");
const list = document.getElementById("lis");
const listTitle = document.getElementById("lit");
const refreshBtn = document.getElementById("refr");
const destroyAll = document.getElementById("dall");
const slugMode = document.getElementById("slug-mode");
const rememberSlug = document.getElementById("remember-slug-mode");
const welcome = document.getElementById("welcome");

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
    result = parts.some(p => p.type === 'dayPeriod');
  } catch { }
  return result;
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric', month: 'short', day: 'numeric',
  hour: 'numeric', minute: '2-digit', hour12: prefers12h()
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

function tick() {
  const now = Date.now();
  timers.forEach(t => {
    const remaining = t.expiresAt - now;
    if (remaining <= 0) {
      t.element.textContent = 'expired';
      t.element.classList.add('expired');
    } else {
      t.element.textContent = formatRemaining(remaining);
      t.element.classList.remove('expired');
    }
  });
}

async function loadLinks() {
  showSpinner(listTitle, 'Refreshing scopes...');
  list.innerHTML = '';
  refreshBtn.disabled = true;

  if (destroyAll) {
    destroyAll.style.display = 'none';
    destroyAll.disabled = true;
    destroyAll.textContent = 'destroy all';
  }

  if (ticker) { clearInterval(ticker); ticker = null; }
  timers = [];
  slugs = [];

  try {
    const res = await fetch('/back/mine');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'load failed');

    if (!data.links.length) { setText(listTitle, null); return; }

    slugs = data.links.map(l => l.slug);
    setText(listTitle, '');
    data.links.forEach(l => list.appendChild(buildItem(l)));

    if (data.links.length > 3 && destroyAll) {
      destroyAll.style.display = 'inline-flex';
      destroyAll.disabled = false;
    }

    if (timers.length) { tick(); ticker = setInterval(tick, 1000); }
  } catch (err) {
    console.error(err);
    setText(listTitle, 'error');
  } finally {
    refreshBtn.disabled = false;
  }
}

async function deleteLink(slug, btn) {
  btn.disabled = true;
  const prev = btn.innerHTML;
  showSpinner(btn, 'Destroying scope...');
  try {
    const res = await fetch('/back/scope/' + slug, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'destroy failed');
    await loadLinks();
  } catch (err) {
    console.error(err);
    setText(listTitle, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = prev;
  }
}

function buildItem(link) {
  const item = document.createElement('li');
  item.className = 'link-item';
  try { item.dataset.slug = link.slug; } catch { }
  try { item.id = 'slug-' + encodeURIComponent(link.slug); } catch { }

  const header = document.createElement('header');
  const infoCol = document.createElement('div');
  infoCol.style.flex = '1';

  const heading = document.createElement('strong');
  const anchor = document.createElement('a');
  anchor.href = link.scope;
  anchor.title = link.scope;
  try {
    anchor.textContent = truncate(String(link.scope || '').replace(/^https?:\/\//i, ''));
  } catch {
    anchor.textContent = truncate(link.scope);
  }
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  heading.appendChild(anchor);

  const targetLabel = document.createElement('small');
  targetLabel.title = link.target;
  try {
    targetLabel.textContent = 'target: ' + truncate(String(link.target || '').replace(/^https?:\/\//i, ''));
  } catch {
    targetLabel.textContent = 'target: ' + truncate(link.target);
  }

  const expiresLabel = document.createElement('small');
  expiresLabel.textContent = 'expires: ' + formatDate(link.finish);

  const createdLabel = document.createElement('small');
  createdLabel.textContent = 'created: ' + formatDate(link.made);

  const timeLeftLabel = document.createElement('small');
  timeLeftLabel.textContent = 'time left: ';
  const countdown = document.createElement('span');
  countdown.className = 'countdown';
  countdown.textContent = 'ticking...';
  timeLeftLabel.appendChild(countdown);
  timers.push({ element: countdown, expiresAt: link.finish });

  infoCol.appendChild(heading);
  infoCol.appendChild(targetLabel);
  infoCol.appendChild(expiresLabel);
  infoCol.appendChild(createdLabel);
  infoCol.appendChild(timeLeftLabel);

  const btnCol = document.createElement('div');
  btnCol.style.display = 'flex';
  btnCol.style.flexDirection = 'column';
  btnCol.style.gap = '8px';

  const destroyBtn = document.createElement('button');
  destroyBtn.type = 'button';
  destroyBtn.textContent = 'destroy';
  destroyBtn.style.backgroundColor = 'RED';
  destroyBtn.addEventListener('click', () => {
    if (confirm('Are you sure?')) deleteLink(link.slug, destroyBtn);
  });

  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.textContent = 'copy';
  copyBtn.addEventListener('click', async () => {
    const url = link.scope;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error('no-clipboard');
      }
      const orig = copyBtn.textContent;
      copyBtn.textContent = 'copied!';
      setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    } catch {
      const tmp = document.createElement('input');
      tmp.value = url;
      document.body.appendChild(tmp);
      tmp.select();
      try {
        document.execCommand('copy');
        const orig = copyBtn.textContent;
        copyBtn.textContent = 'copied!';
        setTimeout(() => { copyBtn.textContent = orig; }, 1500);
      } finally {
        document.body.removeChild(tmp);
      }
    }
  });

  btnCol.appendChild(destroyBtn);
  btnCol.appendChild(copyBtn);
  header.appendChild(infoCol);
  header.appendChild(btnCol);
  item.appendChild(header);
  return item;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showSpinner(status, 'Creating scope...');
  createBtn.disabled = true;

  const payload = {
    url: form.url.value,
    ttlMinutes: Number(form.ttl.value),
    slugMode: (form.slugMode && form.slugMode.value) ? form.slugMode.value : 'alphanumeric',
  };

  try {
    if (rememberSlug && rememberSlug.checked && VALID_MODES.has(payload.slugMode)) {
      localStorage.setItem(MODE_KEY, payload.slugMode);
    }
  } catch { }

  try {
    const res = await fetch('/back/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) { setText(status, data.error || 'create failed'); return; }

    setText(status, 'done');
    await loadLinks();

    try {
      const el = document.getElementById('slug-' + encodeURIComponent(data.slug));
      if (el) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 700); }
    } catch { }

    const savedMode = payload.slugMode;
    const wasRemember = rememberSlug && rememberSlug.checked;
    form.reset();
    form.ttl.value = '5';
    if (form.slugMode) form.slugMode.value = savedMode;
    if (rememberSlug) rememberSlug.checked = wasRemember;
  } catch (err) {
    console.error(err);
    setText(status, 'error');
  } finally {
    createBtn.disabled = false;
  }
});

refreshBtn.addEventListener('click', () => { loadLinks(); });

if (destroyAll) {
  destroyAll.addEventListener('click', async () => {
    if (!slugs.length) return;
    if (!confirm(`Destroy all ${slugs.length} scopes?`)) return;

    destroyAll.disabled = true;
    const prev = destroyAll.innerHTML;
    showSpinner(destroyAll, 'Destroying scopes...');

    try {
      await Promise.all(
        slugs.map(async (slug) => {
          try {
            const res = await fetch('/back/scope/' + slug, { method: 'DELETE' });
            await res.json();
          } catch { }
        })
      );
      await loadLinks();
    } finally {
      destroyAll.innerHTML = prev;
      destroyAll.disabled = false;
    }
  });
}

loadLinks();
