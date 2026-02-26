!function () {
  let e = document.getElementById("targ"),
    t = document.getElementById("stat"),
    n = document.getElementById("result"),
    r = document.getElementById("create-button"),
    l = document.getElementById("lis"),
    a = document.getElementById("lit"),
    i = document.getElementById("refr"),
    o = null,
    s = [];
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
    d(a, "checking..."), l.innerHTML = "", i.disabled = !0, o && (clearInterval(o), o = null), s = [];
    try {
      let e = await fetch("/i/mine"), t = await e.json();
      if (!e.ok) throw Error(t.error || "load failed");
      if (!t.links.length) { d(a, "none"); return }
      d(a, ""), t.links.forEach(e => l.appendChild(function e(t) {
        let n = document.createElement("li"); n.className = "link-item";
        let r = document.createElement("header"), l = document.createElement("div"); l.style.flex = "1";
        let a = document.createElement("strong"), i = document.createElement("a");
        i.href = t.redirectUrl, i.textContent = t.redirectUrl, i.target = "_blank", i.rel = "noopener noreferrer", a.appendChild(i);
        let o = document.createElement("small"); o.textContent = "target: " + t.target;
        let d = document.createElement("small"); d.textContent = "expires: " + new Date(t.expiresAt).toLocaleString();
        let c = document.createElement("small"); c.className = "countdown", c.textContent = "ticking...", s.push({ element: c, expiresAt: t.expiresAt });
        l.appendChild(a), l.appendChild(o), l.appendChild(d), l.appendChild(c);
        let p = document.createElement("button");
        return p.type = "button", p.textContent = "destroy", p.style.backgroundColor = "RED", p.addEventListener("click", () => { if (confirm("Are you sure?")) u(t.slug, p) }), r.appendChild(l), r.appendChild(p), n.appendChild(r), n
      }(e))), o && (clearInterval(o), o = null), s.length && (c(), o = setInterval(c, 1e3))
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
    l.preventDefault(), d(t, "creating..."), n.textContent = "", r.disabled = !0;
    let a = { url: e.url.value, ttlMinutes: Number(e.ttl.value) };
    try {
      let i = await fetch("/i/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(a) }), o = await i.json();
      if (!i.ok) throw Error(o.error || "create failed"); d(t, "done");
      let s = new Date(o.expiresAt).toLocaleString();
      n.innerHTML = '<span>scope: <a href="' + o.redirectUrl + '">' + o.redirectUrl + "</a></span><span>expires: " + s + "</span>", await p(), e.reset(), e.ttl.value = "5"
    } catch (c) { console.error(c), d(t, "error") } finally { r.disabled = !1 }
  }), i.addEventListener("click", () => { p() }), p()
}();

