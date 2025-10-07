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
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      (window.document.head || window.document.documentElement)?.appendChild(styleEl);
      styleEl.textContent = cssText || '';
      }
    else {
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


  // --- CONFIG ---
const progressSelectors = ['h1', 'h2', 'h3', 'p', 'section'];
const topThreshold = 0.2; // top 20% of viewport counts as topmost element


// --- INITIALIZATION ---
ensureIdsForSelectors(progressSelectors);

const observed = Array.from(document.querySelectorAll(progressSelectors.join(',')));
const idToIndex = {};
observed.forEach((el, i) => { if (el.id) idToIndex[el.id] = i; });

let lastReported = null;
let rafScheduled = false;

// --- TOPMOST ELEMENT DETECTION ---
function computeTopIndex() {
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  let firstInView = null;

  for (let i = 0; i < observed.length; i++) {
    const el = observed[i];
    if (!el) continue;
    const r = el.getBoundingClientRect();

    if (r.top >= 0 && r.top <= vh * topThreshold) {
      firstInView = el;
      break;
    }
    if (r.top < 0 && r.bottom > 0) {
      firstInView = el;
      break;
    }
  }

  if (!firstInView) {
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
    const id = firstInView.id;
    const index = idToIndex[id];
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

// Throttle via rAF
function maybeReportProgress() {
  if (rafScheduled) return;
  rafScheduled = true;
  requestAnimationFrame(() => {
    try { computeTopIndex(); } catch (e) { /* ignore */ }
    rafScheduled = false;
  });
}

// --- INTERSECTION OBSERVER ---
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    const id = entry.target.id;
    if (entry.isIntersecting) {
      post({ type: 'enter', id });
      console.log("Element ", id, " entered viewport");
    } else {
      post({ type: 'exit', id });
      console.log("Element", id ,"exited viewport");
    }
  });
}, {
  threshold: [0, 1.0]
});

// Attach observer
observed.forEach(el => observer.observe(el));

// --- EVENTS ---
window.addEventListener('scroll', maybeReportProgress, { passive: true });
window.addEventListener('resize', maybeReportProgress);
document.addEventListener('DOMContentLoaded', () => {
  ensureIdsForSelectors(progressSelectors);
  maybeReportProgress();
});

// --- PERIODIC FALLBACK ---
setInterval(maybeReportProgress, 1000);


// ---- Gesture detection (lightweight) ----
let touchStartX = 0,
    touchStartY = 0,
    touchStartTime = 0,
    isSwiping = false;

const SWIPE_MIN_DISTANCE = Math.min(window.innerWidth * 0.12, 100); // px
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
          post({"setStyles": true});
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
