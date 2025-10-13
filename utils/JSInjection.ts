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

    return;
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

  // ---- Utility to ensure elements have IDs ----
  function ensureIdsForSelectors(selectors = ['h1', 'h2', 'h3', 'p', 'section', 'div']) {
    let counter = 0;
    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.id) {
          el.id = 'rn-node-' + counter++;
        }
      });
    });
  }

  // ---- Image click delegation ----
  document.addEventListener(
    'click',
    function (ev) {
      let el = ev.target;
      if (!el) return;
      if (el.tagName && el.tagName.toLowerCase() === 'img') {
        const rect = el.getBoundingClientRect();
        post({
          type: 'imageClick',
          src: el.getAttribute('src'),
          id: el.id || null,
          width: rect.width,
          height: rect.height,
          clientX: ev.clientX,
          clientY: ev.clientY,
        });
        ev.preventDefault();
      }
    },
    true
  );


  const progressSelectors = ['h1', 'h2', 'h3', 'p', 'section'];

// --- INITIALIZATION ---
ensureIdsForSelectors(progressSelectors);



// ---- Gesture detection (lightweight) ----
let touchStartX = 0,
    touchStartY = 0,
    touchStartTime = 0,
    isSwiping = false;

const SWIPE_MIN_DISTANCE = Math.min(window.innerWidth * 0.12, 100); // px
const SWIPE_MAX_VERTICAL_DELTA = 80; // px
const SWIPE_MAX_TIME = 600; //

function postSwipeProgress(dx) {
  // dx: positive = right, negative = left
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: 'swipe-progress', deltaX: dx })
  );
}

function onTouchStart(e) {
  const t = e.touches && e.touches[0];
  if (!t) return;

  touchStartX = t.clientX;
  touchStartY = t.clientY;
  touchStartTime = Date.now();
  isSwiping = true;
}

function onTouchMove(e) {
  if (!isSwiping) return;

  const t = e.touches && e.touches[0];
  if (!t) return;

  const dx = t.clientX - touchStartX;
  const dy = Math.abs(t.clientY - touchStartY);

  // Only track horizontal swipe
  if (dy < SWIPE_MAX_VERTICAL_DELTA) {
    postSwipeProgress(dx);
    e.preventDefault && e.preventDefault(); // prevent browser scroll
  }
}

function onTouchEnd(e) {
  if (!isSwiping) return;
  isSwiping = false;

  const t = (e.changedTouches && e.changedTouches[0]) || null;
  if (!t) return;

  const dx = t.clientX - touchStartX;
  const dy = Math.abs(t.clientY - touchStartY);
  const dt = Date.now() - touchStartTime;

  if (dt <= SWIPE_MAX_TIME && dy < SWIPE_MAX_VERTICAL_DELTA && Math.abs(dx) >= SWIPE_MIN_DISTANCE) {
    const direction = dx < 0 ? 'left' : 'right';
    console.log("Swipe Detected", direction)
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'swipe-end', direction }));
  } else if (dt <= (SWIPE_MAX_TIME - 400) && dy < SWIPE_MAX_VERTICAL_DELTA && Math.abs(dx) < SWIPE_MIN_DISTANCE){
    console.log("Tap Detected")
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'tap' }));
  } else {
    // swipe cancelled
    console.log("Swipe Cancelled")
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'swipe-cancel' }));
  }
}

// Attach listeners
document.addEventListener('touchstart', onTouchStart, { passive: true });
// document.addEventListener('touchmove', onTouchMove, { passive: false });
document.addEventListener('touchend', onTouchEnd, { passive: false });


  // ---- Link click delegation ----  
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a'); // works even if child of <a>
    if (target && target.href) {
      e.preventDefault(); // stop default navigation
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'link-click', href: target.href })
      );
    }
  }, true); // use capture to catch before default

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
