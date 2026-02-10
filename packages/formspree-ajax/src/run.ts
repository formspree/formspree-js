import { initForm } from './form';
import type { FormConfig } from './types';

/**
 * Entry point for the `window.formspree(...)` global API.
 *
 * Accepts a config object with required `formElement` and `formId`,
 * then delegates to {@link initForm}.
 *
 * @example
 * ```js
 * formspree({ formElement: '#contact-form', formId: 'xyzabc123' });
 * ```
 *
 * @param config - The configuration object passed to `window.formspree(...)`.
 */
export const run = (config: unknown): void => {
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
