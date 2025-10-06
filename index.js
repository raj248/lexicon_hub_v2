// swipe-shift.js
(() => {
  let startX = 0;
  let currentX = 0;
  let isSwiping = false;
  let activeTouchId = null;
  const MAX_SHIFT = 100; // pixels
  const body = document.body;

  // Add initial transition style
  body.style.transition = 'transform 0.3s ease-out';

  function onTouchStart(e) {
    if (e.touches.length > 1) return; // ignore multi-touch
    const touch = e.touches[0];
    startX = touch.clientX;
    activeTouchId = touch.identifier;
    isSwiping = true;
    body.classList.add('swiping');
    body.style.transition = 'none';
  }

  function onTouchMove(e) {
    if (!isSwiping) return;

    const touch = [...e.touches].find((t) => t.identifier === activeTouchId);
    if (!touch) return;

    currentX = touch.clientX;
    const diff = currentX - startX;

    // Limit horizontal shift
    const limited = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, diff));

    // Apply transform (allow vertical scroll)
    body.style.transform = `translate3d(${limited}px, 0, 0)`;
  }

  function onTouchEnd() {
    if (!isSwiping) return;
    isSwiping = false;
    body.classList.remove('swiping');
    body.style.transition = 'transform 0.3s ease-out';
    body.style.transform = 'translate3d(0, 0, 0)';
  }

  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: true });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
})();
