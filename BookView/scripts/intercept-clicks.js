export const InterceptContent = `(() => {
  /**
   * Intercept image and link clicks in EPUB HTML
   * Works with React Native WebView or logs to console
   */

  function post(data) {
    const payload = JSON.stringify(data);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(payload);
    } else {
      console.log("📩 Intercept:", payload);
    }
  }

  // ---- Image click delegation ----
  document.addEventListener(
    "click",
    function (ev) {
      const el = ev.target;
      if (!el || el.tagName?.toLowerCase() !== "img") return;

      const rect = el.getBoundingClientRect();
      post({
        type: "imageClick",
        src: el.getAttribute("src"),
        id: el.id || null,
        width: rect.width,
        height: rect.height,
        clientX: ev.clientX,
        clientY: ev.clientY,
      });

      ev.preventDefault(); // prevent default behavior like drag
    },
    true // capture phase to intercept before default
  );

  // ---- Link click delegation ----
  document.addEventListener(
    "click",
    function (ev) {
      const target = ev.target.closest("a");
      if (!target || !target.href) return;

      ev.preventDefault(); // stop default navigation
      post({
        type: "linkClick",
        href: target.href,
        text: target.innerText.trim() || null,
        id: target.id || null,
      });
    },
    true // capture phase
  );
})();
`;
