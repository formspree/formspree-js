/**
 * Calls the callback when the DOM is ready.
 * If the document is already loaded, defers the callback via setTimeout
 * to ensure consistent async behavior.
 *
 * @param callback - Function to invoke when the DOM is interactive.
 */
export const onReady = (callback: () => void): void => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback, { once: true });
  } else {
    setTimeout(callback, 0);
  }
};
