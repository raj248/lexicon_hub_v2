export const AnnotationContent = `(() => {
  /**
   * Annotation Module
   * Allows selecting text, underlining it, and saving annotations persistently
   */

  const STORAGE_KEY = "webAnnotations";
  const ANNOTATION_CLASS = "text-annotation"; // CSS class for underlined text
  const ANNOTATION_COLOR = "blue"; // Default underline color

  // Helper: wrap selected range in a span with annotation
  function annotateSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // no text selected

    // Create span wrapper
    const span = document.createElement("span");
    span.className = ANNOTATION_CLASS;
    span.style.textDecoration = "underline " + ANNOTATION_COLOR;
    range.surroundContents(span);

    // Save annotation
    saveAnnotations();
    selection.removeAllRanges();
  }

  // Save all annotations as HTML in localStorage
  function saveAnnotations() {
    const html = document.body.innerHTML;
    localStorage.setItem(STORAGE_KEY, html);
  }

  // Restore annotations from localStorage
  function restoreAnnotations() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      document.body.innerHTML = saved;
    }
  }

  // Optional: clear all annotations
  function clearAnnotations() {
    localStorage.removeItem(STORAGE_KEY);
    const elements = document.querySelectorAll("." + ANNOTATION_CLASS);
    elements.forEach((el) => {
      el.style.textDecoration = "";
      el.classList.remove(ANNOTATION_CLASS);
    });
  }

  // Expose API
  window.Annotations = {
    annotate: annotateSelection,
    save: saveAnnotations,
    restore: restoreAnnotations,
    clear: clearAnnotations,
  };

  // Restore annotations automatically on page load
  document.addEventListener("DOMContentLoaded", restoreAnnotations);

  // Add a listener for selecting text and pressing a key (optional)
  document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    if (!selection.isCollapsed) {
      // For now, automatically annotate on text selection
      // Comment this if you want to trigger annotation via a button instead
      annotateSelection();
    }
  });
})();
`;
