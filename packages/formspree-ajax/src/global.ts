import { run } from './run';
import { onReady } from './ready';

/**
 * Extended window interface for the formspree global stub.
 */
interface FormspreeStub {
  (...args: unknown[]): void;
  /** Queue of arguments collected by the inline stub before the library loaded. */
  q?: unknown[][];
}

declare global {
  interface Window {
    formspree: FormspreeStub;
  }
}

// Capture any queued calls from the inline stub
const queue: unknown[][] = (window.formspree && window.formspree.q) || [];

// Replace the stub with the real dispatcher
window.formspree = (...args: unknown[]) => {
  run(args[0], args[1]);
};

// Flush queued calls once the DOM is ready
onReady(() => {
  for (const args of queue) {
    run(args[0], args[1]);
  }
});
