import { initForm } from './form';
import type { FormConfig } from './types';

/**
 * Command dispatcher for the `window.formspree(...)` global API.
 *
 * Routes calls like `formspree('form', 'init', config)` to {@link initForm}.
 * Also supports a shorthand where a CSS selector (starting with `#` or `.`)
 * is used as the second argument: `formspree('form', '#my-form', { formId: 'abc' })`.
 *
 * @param args - The arguments passed to `window.formspree(...)`.
 */
export const run = (...args: unknown[]): void => {
  const resource = args[0];
  const action = args[1];
  const configArg = args[2];

  if (resource !== 'form') {
    console.warn(
      `[formspree] Unknown resource: "${String(resource)}". Expected "form".`
    );
    return;
  }

  if (typeof action !== 'string') {
    console.warn(
      '[formspree] Second argument must be a string (action or CSS selector).'
    );
    return;
  }

  // Shorthand: formspree('form', '#selector', { formId: 'abc' })
  if (action.startsWith('#') || action.startsWith('.')) {
    if (!configArg || typeof configArg !== 'object') {
      console.warn(
        '[formspree] Config object is required as the third argument.'
      );
      return;
    }
    const config = { ...(configArg as FormConfig), formElement: action };
    initForm(config);
    return;
  }

  if (action === 'init') {
    if (!configArg || typeof configArg !== 'object') {
      console.warn(
        '[formspree] Config object is required as the third argument.'
      );
      return;
    }
    initForm(configArg as FormConfig);
    return;
  }

  console.warn(
    `[formspree] Unknown action: "${action}". Expected "init" or a CSS selector.`
  );
};
