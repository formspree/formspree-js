import { initForm } from './form';
import type { FormConfig } from './types';

/**
 * Command dispatcher for the `window.formspree(...)` global API.
 *
 * Routes calls like `formspree('initForm', config)` to {@link initForm}.
 * The first argument selects the command; the second provides its options.
 *
 * @example
 * ```js
 * formspree('initForm', { formElement: '#contact-form', formId: 'xyzabc123' });
 * ```
 *
 * @param command - The command name. Currently only `"initForm"` is supported.
 * @param config - The configuration object for the command.
 */
export const run = (command: unknown, config: unknown): void => {
  if (typeof command !== 'string') {
    console.warn('[formspree] First argument must be a command string.');
    return;
  }

  if (command !== 'initForm') {
    console.warn(
      `[formspree] Unknown command: "${command}". Expected "initForm".`
    );
    return;
  }

  if (!config || typeof config !== 'object') {
    console.warn('[formspree] A config object is required.');
    return;
  }

  const { formElement, formId } = config as Record<string, unknown>;

  if (!formElement) {
    console.warn('[formspree] "formElement" is required in config.');
    return;
  }

  if (!formId) {
    console.warn('[formspree] "formId" is required in config.');
    return;
  }

  initForm(config as FormConfig);
};
