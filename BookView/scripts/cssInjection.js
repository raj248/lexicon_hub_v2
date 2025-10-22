export const CssInjectionContent = `
(() => {
  // Avoid double injection
  if (window.__rn_reader_bridge_installed) return;
  window.__rn_reader_bridge_installed = true;

  // ---- Helpers ----
  function post(obj) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    } catch (e) {
      console.log('⚠️ WebView postMessage failed', e);
    }
  }

  // ---- Inject a <style> element for dynamic styles ----
  function setInjectedCSS(cssText) {
    const STYLE_ID = 'rn-injected-style';
    let styleEl = document.getElementById(STYLE_ID);

    // Ensure viewport meta exists for mobile layout
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'
      );
      document.head.appendChild(meta);
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = cssText || '';
    console.log('✅ Style applied');
  }

  // ---- Handle messages from RN ----
  function handleMessageFromRN(event) {
    let dataStr = null;
    if (typeof event.data === 'string') dataStr = event.data;
    else if (event.data && typeof event.data === 'object' && 'data' in event.data)
      dataStr = event.data.data;

    if (!dataStr) return;

    try {
      const obj = JSON.parse(dataStr);
      if (!obj?.type) return;

      switch (obj.type) {
        case 'setStyles':
          setInjectedCSS(obj.css || '');
          post({ type: 'setStylesAck' });
          break;
        default:
          break;
      }
    } catch (err) {
      console.log('⚠️ Failed to parse RN message', err);
    }
  }

  // Listen to RN WebView messages
  document.addEventListener('message', handleMessageFromRN);
  // Some RN wrappers also call window.postMessage directly
  const origPost = window.postMessage;
  window.postMessage = function () {
    /* noop */
    console.log("No-Op triggered")
  };

  // Bridge is ready
  post({ type: 'bridgeReady' });
})();
`;
