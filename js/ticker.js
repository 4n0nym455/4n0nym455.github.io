(() => {
  document.documentElement.classList.add("soc-ticker-on");
  document.body.classList.add("soc-ticker-on");
  const el = document.querySelector(".soc-news-ticker");
  if (!el) return;
  const feedUrl = el.dataset.feedUrl;
  const pathPrefix = el.dataset.pathPrefix || "";
  if (!feedUrl) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = el.querySelector(".soc-news-ticker__track");
  if (!track) return;

  const isEnglish = (text) => {
    if (text.length < 15) return false;
    const latin = text.replace(/[a-zA-Z0-9\s.,!?;:'"()\-&$#@/\d%+=\[\]{}|]/g, "");
    const nonLatinRatio = latin.length / text.length;
    return nonLatinRatio < 0.3;
  };

  const render = (items) => {
    items = items.filter((it) => it.title && isEnglish(it.title));
    if (!items.length) {
      track.textContent =
        "Ticker: no headlines yet — run: python3 scripts/fetch-ticker-feeds.py then restart hugo server.";
      return;
    }
    track.textContent = "";
    const frag = document.createDocumentFragment();
    const appendItems = (list) => {
      for (const it of list) {
        const span = document.createElement("span");
        span.className = "soc-news-ticker__item" + (it._cve ? " soc-news-ticker__item--cve" : "");
        if (it.date) {
          const dateSpan = document.createElement("span");
          dateSpan.className = "soc-news-ticker__date";
          dateSpan.textContent = "[" + it.date + "]";
          span.appendChild(dateSpan);
          span.appendChild(document.createTextNode(" "));
        }
        const a = document.createElement("a");
        a.href = it.link || "#";
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        a.textContent = it.title || "(untitled)";
        span.appendChild(a);
        frag.appendChild(span);
      }
    };
    appendItems(items);
    appendItems(items);
    track.appendChild(frag);
    if (reduced) track.style.animation = "none";
  };

  const url =
    feedUrl.startsWith("http") || feedUrl.startsWith("//")
      ? feedUrl
      : new URL(feedUrl, window.location.origin).href;

  fetch(url, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data) => {
      const path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
      const segments = path.split("/").filter(Boolean);
      const prefix = (pathPrefix || "").replace(/^\/+|\/+$/g, "");
      let sec = segments[0] || "";
      if (prefix && segments[0] === prefix) sec = segments[1] || "";
      let key = "default";
      if (sec === "writeups") key = "writeups";
      else if (sec === "network-labs") key = "network-labs";
      else if (sec === "community") key = "community";
      let bucket = data[key] || [];
      if (!bucket.length && key !== "default") bucket = data.default || [];
      const cve = data.cve || [];
      const merged = [...bucket];
      for (let i = 0; i < cve.length; i++) {
        const pos = Math.min(3 + i * 4, merged.length);
        cve[i]._cve = true;
        merged.splice(pos, 0, cve[i]);
      }
      render(merged);
    })
    .catch((err) => {
      console.warn("[soc-ticker] fetch failed:", err);
      render([]);
    });
})();

(() => {
  const ticker = document.querySelector('.soc-news-ticker');
  if (!ticker) return;

  function randomShimmer() {
    var x = (Math.random() * 500 - 100) + '%';
    ticker.style.setProperty('--ticker-shimmer-x', x);
  }

  randomShimmer();
  function schedule() {
    setTimeout(function() {
      randomShimmer();
      schedule();
    }, 2600 + Math.random() * 5200);
  }
  schedule();
})();
