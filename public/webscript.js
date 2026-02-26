!function () {
  let e = document.getElementById("targ"),
    t = document.getElementById("stat"),
    r = document.getElementById("create-button"),
    l = document.getElementById("lis"),
    a = document.getElementById("lit"),
    i = document.getElementById("refr"),
    m = document.getElementById("dall"),
    y = document.getElementById("slug-mode"),
    z = document.getElementById("remember-slug-mode"),
    o = null,
    s = [],
    g = [];
  function __prefers12h() {
    let pref = true;
    try {
      const ro = new Intl.DateTimeFormat().resolvedOptions();
      if (typeof ro.hour12 === 'boolean') return ro.hour12;
      const test = new Date(Date.UTC(2020, 0, 1, 13, 0, 0));
      const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', timeZone: 'UTC' }).formatToParts(test);
      pref = parts.some(p => p.type === 'dayPeriod');
    } catch {}
    return pref;
  }
  const __df = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: __prefers12h() || true
  });
  const fmt = (ts) => __df.format(new Date(ts));
  const MODE_KEY = 'slugMode';
  const MODE_FLAG_KEY = 'rememberSlugMode';
  const VM = new Set(['letters','numbers','alphanumeric','words','icons']);
  (function initRemember() {
    try {
      const flag = localStorage.getItem(MODE_FLAG_KEY);
      if (z && flag === '1') z.checked = true;
      if (y && z && z.checked) {
        const saved = localStorage.getItem(MODE_KEY);
        if (saved && VM.has(saved)) y.value = saved;
      }
    } catch {}
  })();

  if (z) {
    z.addEventListener('change', () => {
      try {
        if (z.checked) {
          localStorage.setItem(MODE_FLAG_KEY, '1');
          if (y && VM.has(y.value)) localStorage.setItem(MODE_KEY, y.value);
        } else {
          localStorage.removeItem(MODE_FLAG_KEY);
          localStorage.removeItem(MODE_KEY);
        }
      } catch {}
    });
  }

  if (y) {
    y.addEventListener('change', () => {
      try {
        if (z && z.checked) {
          const v = y.value; if (VM.has(v)) localStorage.setItem(MODE_KEY, v);
        }
      } catch {}
    });
  }
  function d(e, t) { e.textContent = t }
  function c() {
    let e = Date.now();
    s.forEach(t => {
      let n = t.expiresAt - e;
      if (n <= 0) { t.element.textContent = "expired", t.element.classList.add("expired"); return }
      t.element.textContent = function e(t) {
        let n = Math.floor(t / 1e3), r = Math.floor(n / 3600), l = [];
        return r > 0 && l.push(r + "h"), l.push(String(Math.floor(n % 3600 / 60)).padStart(2, "0") + "m"), l.push(String(n % 60).padStart(2, "0") + "s"), l.join(" ")
      }(n), t.element.classList.remove("expired")
    })
  }
  async function p() {
    d(a, "checking..."), l.innerHTML = "", i.disabled = !0, m && (m.style.display = "none", m.disabled = !0, m.textContent = "destroy all"), o && (clearInterval(o), o = null), s = [], g = [];
    try {
      let e = await fetch("/i/mine"), t = await e.json();
      if (!e.ok) throw Error(t.error || "load failed");
      if (!t.links.length) { d(a, "none"); return }
      g = t.links.map(x => x.slug);
      d(a, ""), t.links.forEach(e => l.appendChild(function e(t) {
        let n = document.createElement("li"); n.className = "link-item";
        try { n.dataset.slug = t.slug; } catch {}
        try { n.id = 'slug-' + encodeURIComponent(t.slug); } catch {}
        let r = document.createElement("header"), l = document.createElement("div"); l.style.flex = "1";
        let a = document.createElement("strong"), i = document.createElement("a");
        i.href = t.redirectUrl, i.textContent = t.redirectUrl, i.target = "_blank", i.rel = "noopener noreferrer", a.appendChild(i);
        let o = document.createElement("small"); o.textContent = "target: " + t.target;
        let d = document.createElement("small"); d.textContent = "expires: " + fmt(t.expiresAt);
        let cr = document.createElement("small"); cr.textContent = "created: " + fmt(t.createdAt);
        let tl = document.createElement("small"); tl.textContent = "time left: ";
        let c = document.createElement("span"); c.className = "countdown"; c.textContent = "ticking...";
        tl.appendChild(c);
        s.push({ element: c, expiresAt: t.expiresAt });
        l.appendChild(a), l.appendChild(o), l.appendChild(d), l.appendChild(cr), l.appendChild(tl);
        let bw = document.createElement("div");
        bw.style.display = "flex"; bw.style.flexDirection = "column"; bw.style.gap = "8px";
        let p = document.createElement("button");
        p.type = "button"; p.textContent = "destroy"; p.style.backgroundColor = "RED";
        p.addEventListener("click", () => { if (confirm("Are you sure?")) u(t.slug, p) });
        let cp = document.createElement("button");
        cp.type = "button"; cp.textContent = "copy";
        cp.addEventListener("click", async () => {
          const url = t.redirectUrl;
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(url);
            } else {
              throw new Error('no-clipboard');
            }
            const old = cp.textContent; cp.textContent = "copied!"; setTimeout(() => cp.textContent = old, 1500);
          } catch {
            const tmp = document.createElement('input');
            tmp.value = url; document.body.appendChild(tmp); tmp.select();
            try { document.execCommand('copy'); const old = cp.textContent; cp.textContent = "copied!"; setTimeout(() => cp.textContent = old, 1500); }
            finally { document.body.removeChild(tmp); }
          }
        });
        bw.appendChild(p); bw.appendChild(cp);
        r.appendChild(l); r.appendChild(bw);
        n.appendChild(r);
        return n
      }(e))), t.links.length > 3 && m && (m.style.display = "inline-flex", m.disabled = !1), o && (clearInterval(o), o = null), s.length && (c(), o = setInterval(c, 1e3))
    } catch (n) { console.error(n), d(a, "error") } finally { i.disabled = !1 }
  }
  async function u(e, t) {
    t.disabled = !0; let n = t.textContent; t.textContent = "destroying...";
    try {
      let r = await fetch("/i/rules/" + e, { method: "DELETE" }), l = await r.json();
      if (!r.ok) throw Error(l.error || "destroy failed"); await p()
    } catch (i) { console.error(i), d(a, "error") } finally { t.disabled = !1, t.textContent = n }
  }
  e.addEventListener("submit", async l => {
    l.preventDefault(), d(t, "creating..."), r.disabled = !0;
    let a = { url: e.url.value, ttlMinutes: Number(e.ttl.value), slugMode: e.slugMode && e.slugMode.value ? e.slugMode.value : 'alphanumeric' };
    try { if (z && z.checked && VM.has(a.slugMode)) localStorage.setItem(MODE_KEY, a.slugMode); } catch {}
    try {
      let i = await fetch("/i/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) });
      let o = await i.json();
      if (!i.ok) { d(t, o.error || "create failed"); return }
      d(t, "done");
      await p();
      try {
        const el = document.getElementById('slug-' + encodeURIComponent(o.slug));
        if (el) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 700); }
      } catch {}
      const __sm=a.slugMode; const __rm = z && z.checked; e.reset(); e.ttl.value = "5"; if (e.slugMode) e.slugMode.value = __sm; if (z) z.checked = __rm;
    } catch (c) { console.error(c), d(t, "error") } finally { r.disabled = !1 }
  }), i.addEventListener("click", () => { p() }), m && m.addEventListener("click", async () => {
    if (!g.length) return;
    if (!confirm(`Destroy all ${g.length} scopes?`)) return;
    m.disabled = !0; const orig = m.textContent; m.textContent = "destroying...";
    try {
      for (const slug of g) {
        try {
          const r = await fetch("/i/rules/" + slug, { method: "DELETE" });
          await r.json();
        } catch {}
      }
      await p();
    } finally {
      m.textContent = orig; m.disabled = !1;
    }
  }), p()
}();
