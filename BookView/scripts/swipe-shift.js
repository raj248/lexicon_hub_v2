export const SwipeShiftContent = `(() => {

  function post(data) {
    const payload = JSON.stringify(data);
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(payload);
    } else {
      console.log("📩 Intercept:", payload);
    }
  }

  const maxShift = window.innerWidth * 0.4; // max horizontal shift
  const threshold = 10; // distance before confirming gesture
  const swipeTrigger = maxShift * 0.9; // trigger event threshold

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let isDragging = false;
  let triggered = false;
  let lockDirection = null; // 'horizontal' | 'vertical' | null
  let touchStartTime = 0;

  const body = document.body;

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    isDragging = true;
    triggered = false;
    lockDirection = null;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    currentX = 0;
    currentY = 0;
    touchStartTime = Date.now();
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Decide gesture direction after small movement
    if (!lockDirection && Math.hypot(deltaX, deltaY) > threshold) {
      lockDirection =
        Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
    }

    currentX = deltaX;
    currentY = deltaY;

    // Only handle horizontal gestures
    if (lockDirection === "horizontal") {
      e.preventDefault(); // block scroll/selection only for horizontal
      const shiftX = Math.max(Math.min(deltaX, maxShift), -maxShift);
      body.style.transform = "translateX(" + shiftX + "px)";
      body.style.transition = "none";
    }
    // if vertical or selection, do nothing → allows text selection
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    isDragging = false;

    const duration = Date.now() - touchStartTime;
    const absShiftX = Math.abs(currentX);
    const absShiftY = Math.abs(currentY);

    // Tap detection
    if (absShiftX < 20 && absShiftY < 20 && duration < 600) {
      console.log("👆 Tap detected!");
      post({ type: "tap" });
    }

    // Swipe threshold detection
    if (
      lockDirection === "horizontal" &&
      absShiftX > swipeTrigger &&
      !triggered
    ) {
      triggered = true;
      const direction = currentX > 0 ? "right" : "left";
      console.log("Swipe ", direction, " detected!");
      post({ type: "swipe", direction });
    }

    // Smooth reset
    body.style.transition = "transform 0.35s ease";
    body.style.transform = "translateX(0)";
  };

  // Attach listeners
  document.addEventListener("touchstart", handleTouchStart, { passive: true });
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);
})();
`;
