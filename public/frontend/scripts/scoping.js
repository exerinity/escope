function buildShareUrls(url) {
  const safeUrl = String(url || '');
  const tweetText = 'Check out this scope';
  const blueskyText = 'Check out this scope: ' + safeUrl;
  const emailBody = 'Check out this scope:\n' + safeUrl;

  return {
    twitter: 'https://x.com/intent/post?' + new URLSearchParams({
      text: tweetText,
      url: safeUrl,
    }).toString(),
    email: 'mailto:?' + new URLSearchParams({
      subject: 'Shared scope',
      body: emailBody,
    }).toString(),
    facebook: 'https://www.facebook.com/sharer/sharer.php?' + new URLSearchParams({
      u: safeUrl,
    }).toString(),
    bluesky: 'https://bsky.app/intent/compose?' + new URLSearchParams({
      text: blueskyText,
    }).toString(),
  };
}

function openShareModal(link) {
  const urls = buildShareUrls(link.scope);
  const content = document.createElement('div');

  const text = document.createElement('h2');
  text.textContent = 'Share this scope';

  const leadingTo = document.createElement('p');
  leadingTo.style.margin = '0 0 0.75rem 0';
  leadingTo.appendChild(document.createElement('br'));
  leadingTo.appendChild(document.createTextNode('leading to '));

  const targetLink = document.createElement('a');
  targetLink.href = link.target;
  targetLink.target = '_blank';
  targetLink.rel = 'noopener noreferrer';
  try {
    targetLink.textContent = truncate(String(link.target || '').replace(/^https?:\/\//i, ''), 40);
  } catch {
    targetLink.textContent = truncate(link.target, 40);
  }
  leadingTo.appendChild(targetLink);

  const actions = document.createElement('div');
  actions.style.display = 'grid';
  actions.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
  actions.style.gap = '10px';

  const SHARE_ICONS = {
    twitter: '<svg class="icon-share icon-share-x" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M459.4 151.7c.3 4.5 .3 9.1 .3 13.6 0 138.7-105.6 298.6-298.6 298.6-59.5 0-114.7-17.2-161.1-47.1 8.4 1 16.6 1.3 25.3 1.3 49.1 0 94.2-16.6 130.3-44.8-46.1-1-84.8-31.2-98.1-72.8 6.5 1 13 1.6 19.8 1.6 9.4 0 18.8-1.3 27.6-3.6-48.1-9.7-84.1-52-84.1-103l0-1.3c14 7.8 30.2 12.7 47.4 13.3-28.3-18.8-46.8-51-46.8-87.4 0-19.5 5.2-37.4 14.3-53 51.7 63.7 129.3 105.3 216.4 109.8-1.6-7.8-2.6-15.9-2.6-24 0-57.8 46.8-104.9 104.9-104.9 30.2 0 57.5 12.7 76.7 33.1 23.7-4.5 46.5-13.3 66.6-25.3-7.8 24.4-24.4 44.8-46.1 57.8 21.1-2.3 41.6-8.1 60.4-16.2-14.3 20.8-32.2 39.3-52.6 54.3z"/></svg>',
    bluesky: '<svg class="icon-share icon-share-bluesky" viewBox="0 0 576 512" aria-hidden="true"><path fill="currentColor" d="M407.8 294.7c-3.3-.4-6.7-.8-10-1.3 3.4 .4 6.7 .9 10 1.3zM288 227.1C261.9 176.4 190.9 81.9 124.9 35.3 61.6-9.4 37.5-1.7 21.6 5.5 3.3 13.8 0 41.9 0 58.4S9.1 194 15 213.9c19.5 65.7 89.1 87.9 153.2 80.7 3.3-.5 6.6-.9 10-1.4-3.3 .5-6.6 1-10 1.4-93.9 14-177.3 48.2-67.9 169.9 120.3 124.6 164.8-26.7 187.7-103.4 22.9 76.7 49.2 222.5 185.6 103.4 102.4-103.4 28.1-156-65.8-169.9-3.3-.4-6.7-.8-10-1.3 3.4 .4 6.7 .9 10 1.3 64.1 7.1 133.6-15.1 153.2-80.7 5.9-19.9 15-138.9 15-155.5s-3.3-44.7-21.6-52.9c-15.8-7.1-40-14.9-103.2 29.8-66.1 46.6-137.1 141.1-163.2 191.8z"/></svg>',
    facebook: '<svg class="icon-share icon-share-facebook" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5l0-170.3-52.8 0 0-78.2 52.8 0 0-33.7c0-87.1 39.4-127.5 125-127.5 16.2 0 44.2 3.2 55.7 6.4l0 70.8c-6-.6-16.5-1-29.6-1-42 0-58.2 15.9-58.2 57.2l0 27.8 83.6 0-14.4 78.2-69.3 0 0 175.9C413.8 494.8 512 386.9 512 256z"/></svg>',
    email: '<svg class="icon-share icon-share-email" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M48 64c-26.5 0-48 21.5-48 48 0 15.1 7.1 29.3 19.2 38.4l208 156c17.1 12.8 40.5 12.8 57.6 0l208-156c12.1-9.1 19.2-23.3 19.2-38.4 0-26.5-21.5-48-48-48L48 64zM0 196L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-188-198.4 148.8c-34.1 25.6-81.1 25.6-115.2 0L0 196z"/></svg>',
  };

  function makeShareLink(icon, label, href) {
    const anchor = document.createElement('a');
    anchor.className = 'button';
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.innerHTML = SHARE_ICONS[icon] + label;
    return anchor;
  }

  const twitterLink = makeShareLink('twitter', 'Twitter', urls.twitter);
  const emailLink = makeShareLink('email', 'Email', urls.email);
  const facebookLink = makeShareLink('facebook', 'Facebook', urls.facebook);
  const blueskyLink = makeShareLink('bluesky', 'Bluesky', urls.bluesky);

  const mobileShare = document.createElement('button');
  mobileShare.type = 'button';
  mobileShare.textContent = 'Trigger device share dialogue...';
  mobileShare.addEventListener('click', async () => {
    const url = String(link.scope || '');
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Shared scope',
          text: 'Check out this scope',
          url,
        });
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error('no-clipboard');
      }

      const orig = mobileShare.textContent;
      mobileShare.disabled = 1;
      mobileShare.textContent = 'Unsupported, copied link instead';
    } catch { }
  });

  content.appendChild(text);
  content.appendChild(leadingTo);
  content.appendChild(actions);
  actions.appendChild(twitterLink);
  actions.appendChild(emailLink);
  actions.appendChild(facebookLink);
  actions.appendChild(blueskyLink);
  content.appendChild(document.createElement('br'));
  content.appendChild(mobileShare);

  msg(content);
}

function tick() {
  const now = Date.now();
  timers.forEach((t) => {
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
  showSpinner(listTitle, 'Retrieving data...');
  list.innerHTML = '';
  refreshBtn.disabled = true;

  if (destroyAll) {
    destroyAll.style.display = 'none';
    destroyAll.disabled = true;
    destroyAll.textContent = 'destroy all';
  }

  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
  timers = [];
  slugs = [];

  try {
    const res = await fetch('/back/mine');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'load failed');

    if (!data.links.length) {
      setText(listTitle, 'None!');
      return;
    }

    slugs = data.links.map((l) => l.slug);
    setText(listTitle, '');
    data.links.forEach((l) => list.appendChild(buildItem(l)));

    if (data.links.length > 3 && destroyAll) {
      destroyAll.style.display = 'inline-flex';
      destroyAll.disabled = false;
    }

    if (timers.length) {
      tick();
      ticker = setInterval(tick, 1000);
    }
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
    const content = document.createElement('div');

    const text = document.createElement('p');
    text.textContent = 'Are you sure you want to delete this scope?';
    text.style.margin = '0';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'center';
    actions.style.gap = '12px';
    actions.style.marginTop = '1rem';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'cancel';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.textContent = 'delete';
    confirmBtn.style.backgroundColor = 'RED';

    content.appendChild(text);
    content.appendChild(actions);
    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);

    const overlay = msg(content);

    cancelBtn.addEventListener('click', () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    });

    confirmBtn.addEventListener('click', () => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      deleteLink(link.slug, destroyBtn);
    });
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

  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.textContent = 'share';
  shareBtn.addEventListener('click', () => {
    openShareModal(link);
  });

  btnCol.appendChild(destroyBtn);
  btnCol.appendChild(copyBtn);
  btnCol.appendChild(shareBtn);
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

    if (!res.ok) {
      setText(status, data.error || 'create failed');
      return;
    }

    setText(status, 'done');
    await loadLinks();

    try {
      const el = document.getElementById('slug-' + encodeURIComponent(data.slug));
      if (el) {
        el.classList.add('flash');
        setTimeout(() => { el.classList.remove('flash'); }, 700);
      }
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
        }),
      );
      await loadLinks();
    } finally {
      destroyAll.innerHTML = prev;
      destroyAll.disabled = false;
    }
  });
}

loadLinks();
