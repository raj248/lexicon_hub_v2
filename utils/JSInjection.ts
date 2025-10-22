export const injectedJS = `(function () {
  // avoid double injection
  if (window.__rn_reader_bridge_installed) return;
  window.__rn_reader_bridge_installed = true;

  // ---- Helpers ----
  function post(obj) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    } catch (e) {
      // ignore
    }
  }

  // ---- Inject a <style> element for dynamic styles ----
  
  function setInjectedCSS(cssText) {
    const STYLE_ID = 'rn-injected-style';
    let styleEl = document.getElementById(STYLE_ID);
  
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
    document.getElementsByTagName('head')[0].appendChild(meta);

    // return;
    if (!styleEl) {
      console.log("Applying Style")
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      (window.document.head || window.document.documentElement)?.appendChild(styleEl);
      styleEl.textContent = cssText || '';
      }
    else {
        console.log("Applying Style")
        styleEl.textContent = cssText || '';
      }
  }


  // ---- Listen for messages from RN to update styles / jump to id / control gestures ----
  function handleMessageFromRN(event) {
    // event.data: string
    let dataStr = null;
    if (typeof event.data === 'string') dataStr = event.data;
    else if (event.data && typeof event.data === 'object' && event.data.hasOwnProperty('data'))
      dataStr = event.data.data; // some RN wrappers
    if (!dataStr) return;
    try {
      const obj = JSON.parse(dataStr);
      if (!obj || !obj.type) return;
      switch (obj.type) {
        case 'setStyles':
          setInjectedCSS(obj.css || '');
          post({"setStyles": true});
          // force reflow if needed
          break;
        default:
          // unknown
          break;
      }
    } catch (ex) {
      // ignore parse errors
    }
  }

  // older RN WebView maps to window.document; we add multiple hooks:
  window.document.addEventListener('message', handleMessageFromRN);
  // some RN wrappers also call window.postMessage directly
  const origPost = window.postMessage;
  window.postMessage = function () {
    /* noop to avoid old behaviour */
  };

  // everything ready
  post({ type: 'bridgeReady' });
})();
`;
