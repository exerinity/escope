function buildShareUrls(url) {
  const safeUrl = String(url || '');
  const tweetText = 'Check out this scope';
  const blueskyText = 'Check out this scope: ' + safeUrl;
  const emailBody = 'Check out this scope:\n' + safeUrl;

  return {
    twitter: 'https://twitter.com/intent/tweet?' + new URLSearchParams({
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
  text.style.margin = '0 0 0.75rem 0';

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

  const scopeLink = document.createElement('a');
  scopeLink.href = link.scope;
  scopeLink.target = '_blank';
  scopeLink.rel = 'noopener noreferrer';
  scopeLink.textContent = truncate(String(link.scope || '').replace(/^https?:\/\//i, ''), 40);
  scopeLink.style.display = 'inline-block';
  scopeLink.style.marginBottom = '1rem';

  const actions = document.createElement('div');
  actions.style.display = 'grid';
  actions.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
  actions.style.gap = '10px';

  function makeShareLink(label, href) {
    const anchor = document.createElement('a');
    anchor.className = 'button';
    anchor.href = href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = label;
    return anchor;
  }

  const twitterLink = makeShareLink('Tweet', urls.twitter);
  const emailLink = makeShareLink('Email', urls.email);
  const facebookLink = makeShareLink('Post to Facebook', urls.facebook);
  const blueskyLink = makeShareLink('Post on Bluesky', urls.bluesky);

  const mobileShare = document.createElement('button');
  mobileShare.type = 'button';
  mobileShare.textContent = 'Trigger device share dialogue';
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
      mobileShare.textContent = 'Unsupported, copied link instead';
      setTimeout(() => { mobileShare.textContent = orig; }, 1500);
    } catch { }
  });

  content.appendChild(text);
  content.appendChild(leadingTo);
  content.appendChild(scopeLink);
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
      setText(listTitle, null);
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
