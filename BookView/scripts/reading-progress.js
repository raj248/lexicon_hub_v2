export const ReadingProgressContent = `(() => {
  /**
   * Reading Progress Reporter + Jump-to-Progress
   * Reports reading percentage and allows loading document at a specific scroll progress
   */

  const PROGRESS_INTERVAL = 500; // ms between progress updates
  let lastReportedProgress = -1;
  let progressTimer = null;

  // Calculate reading progress (0-100)
  function getReadingProgress() {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    return Math.min(Math.max(progress, 0), 100);
  }

  // Set document scroll to given progress (0-100) immediately
  function goToProgress(progress) {
    const clamped = Math.min(Math.max(progress, 0), 100);
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrollPos = (clamped / 100) * scrollHeight;
    window.scrollTo(0, scrollPos); // instantly jump
    lastReportedProgress = clamped;
  }

  // Report progress to React Native or console
  function reportProgress(progress) {
    const rounded = Math.round(progress);
    if (rounded === lastReportedProgress) return; // skip duplicates
    lastReportedProgress = rounded;

    const payload = JSON.stringify({
      type: "progress",
      progress: rounded,
      timestamp: Date.now(),
    });

    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(payload);
    } else {
      console.log("📖 Progress:", rounded + "%");
    }
  }

  // Listen for scroll events — throttled by interval
  function startTracking() {
    if (progressTimer) clearInterval(progressTimer);
    progressTimer = setInterval(() => {
      const progress = getReadingProgress();
      reportProgress(progress);
    }, PROGRESS_INTERVAL);
  }

  function stopTracking() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  // Expose API
  window.ReadingProgress = {
    start: startTracking,
    stop: stopTracking,
    get: getReadingProgress,
    goTo: goToProgress, // new function
  };

  // Auto-start tracking when DOM is ready
  document.addEventListener("DOMContentLoaded", startTracking);
})();
`;
