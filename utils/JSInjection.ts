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
  const STYLE_ID = 'rn-injected-style';
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    (document.head || document.documentElement)?.appendChild(styleEl);
  }

  function setInjectedCSS(cssText) {
    styleEl.textContent = cssText || '';
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

  // ---- Read progress: use IntersectionObserver ----
  // we'll observe headings + paragraphs, report the first element whose top is within threshold.
  const progressSelectors = ['h1', 'h2', 'h3', 'p', 'section'];
  ensureIdsForSelectors(progressSelectors);

  const observed = Array.from(document.querySelectorAll(progressSelectors.join(',')));
  const idToIndex = {};
  observed.forEach((el, i) => {
    if (el.id) idToIndex[el.id] = i;
  });

  let lastReported = null;
  const topThreshold = 0.2; // element's top within 20% of viewport height

  function computeTopIndex() {
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    let firstInView = null;
    for (let i = 0; i < observed.length; i++) {
      const el = observed[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      // choose element whose top is nearest to top with threshold tolerance
      if (r.top >= 0 && r.top <= vh * topThreshold) {
        firstInView = el;
        break;
      }
      // fallback: if top < 0 but bottom > 0 (partially visible)
      if (r.top < 0 && r.bottom > 0) {
        firstInView = el;
        break;
      }
    }
    if (!firstInView) {
      // choose first element whose top > 0
      for (let i = 0; i < observed.length; i++) {
        const el = observed[i];
        const r = el.getBoundingClientRect();
        if (r.top >= 0) {
          firstInView = el;
          break;
        }
      }
    }
    if (firstInView) {
      const id = firstInView.id || null;
      const index = id ? idToIndex[id] : null;
      const payload = {
        type: 'progress',
        id,
        index,
        top: Math.max(0, firstInView.getBoundingClientRect().top),
      };
      if (!lastReported || lastReported.id !== payload.id) {
        post(payload);
        lastReported = payload;
      }
    }
  }

  // throttle using rAF
  let rafScheduled = false;
  function maybeReportProgress() {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(() => {
      try {
        computeTopIndex();
      } catch (e) {
        /* ignore */
      }
      rafScheduled = false;
    });
  }

  // observe scroll and resize
  window.addEventListener('scroll', maybeReportProgress, { passive: true });
  window.addEventListener('resize', maybeReportProgress);
  // initial report after DOM loaded
  document.addEventListener('DOMContentLoaded', function () {
    ensureIdsForSelectors(progressSelectors);
    maybeReportProgress();
  });

  // fallback periodic every 1000ms (in case scroll events missed)
  setInterval(maybeReportProgress, 1000);

// ---- Gesture detection (lightweight) ----
let touchStartX = 0,
    touchStartY = 0,
    touchStartTime = 0,
    isSwiping = false;

const SWIPE_MIN_DISTANCE = Math.min(window.innerWidth * 0.12, 40); // px
const SWIPE_MAX_VERTICAL_DELTA = 80; // px
const SWIPE_MAX_TIME = 600; // ms

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
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'swipe-end', direction }));
  } else {
    // swipe cancelled
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
          // force reflow if needed
          maybeReportProgress();
          break;
        case 'jumpToId':
          if (obj.id) {
            const el = document.getElementById(obj.id);
            if (el) {
              el.scrollIntoView({ behavior: obj.animated ? 'smooth' : 'auto', block: 'start' });
              // report after scroll
              setTimeout(maybeReportProgress, obj.animated ? 400 : 50);
            }
          }
          break;
        case 'getProgressNow':
          maybeReportProgress();
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
  window.addEventListener('message', handleMessageFromRN);
  // some RN wrappers also call window.postMessage directly
  const origPost = window.postMessage;
  window.postMessage = function () {
    /* noop to avoid old behaviour */
  };

  // everything ready
  post({ type: 'bridgeReady' });
})();
`;
