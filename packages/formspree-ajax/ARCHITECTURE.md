# @formspree/ajax Architecture

## Overview

`@formspree/ajax` is a vanilla JavaScript library for declarative form handling with [Formspree](https://formspree.io). It provides two usage modes:

- **ESM/CJS** (`initForm()`) for bundler-based projects
- **Script tag** (`window.formspree()`) for plain HTML pages, no bundler required

It depends on `@formspree/core` for the underlying submission client.

## Source Files

### `types.ts`

All TypeScript types and the `DataAttributes` constant.

- **`DataAttributes`** -- maps logical names to `data-fs-*` attribute strings used for DOM element identification:
  - `ERROR` (`data-fs-error`) -- marks elements that display field validation errors
  - `FIELD` (`data-fs-field`) -- marks inputs to receive `aria-invalid` on error
  - `SUBMIT_BTN` (`data-fs-submit-btn`) -- marks buttons to auto-disable during submission
  - `MESSAGE` (`data-fs-message`) -- marks elements for form-level success/error messages
- **`FormConfig`** -- main configuration interface accepted by `initForm()`. Includes `formElement`, `formId`, lifecycle callbacks (`onInit`, `onSubmit`, `onSuccess`, `onError`, `onFailure`), and customizable rendering functions (`enable`, `disable`, `renderErrors`, `renderMessage`).
- **`FormContext`** -- passed to every callback. Contains the resolved `form` element, `formKey`, `endpoint`, `client`, and the original `config`.
- **`FormHandle`** -- returned by `initForm()`. Exposes `destroy()` to remove event listeners.
- **`FieldConfig` / `FieldsConfig`** -- per-field configuration for `prettyName` and custom `errorMessages`.

### `form.ts`

Core form initialization and submission logic.

- **`initForm(config)`** -- entry point. Resolves the form element (selector or reference), validates config, injects default styles, attaches a `submit` event listener, enables buttons, and calls `onInit`. Returns a `FormHandle`.
- **`handleSubmit(context)`** -- async submit handler. Collects `FormData`, merges `data` (static or dynamic), clears previous errors/messages, disables buttons, calls `onSubmit`, then submits via the core client. Routes the result to `onSuccess`/`onError`/`onFailure` and re-enables buttons.
- **Default implementations** -- `defaultEnable`, `defaultDisable`, `defaultRenderErrors`, `defaultRenderMessage`, `defaultOnSuccess`. These use `data-fs-*` attributes to find DOM elements and update them. Users can override any of these via the config.
- **`injectDefaultStyles()`** -- injects a `<style>` element once with default CSS for error, field, and message styling.

### `run.ts`

Entry point for the global `window.formspree(...)` API.

Accepts a single config object with required `formElement` and `formId`, then delegates to `initForm()`:

```
formspree({ formElement: '#contact-form', formId: 'abc' })  --> initForm(config)
```

Validates that the config is an object and that both `formElement` and `formId` are present. Invalid inputs produce `console.warn` messages (no throws, safe for script-tag context).

### `ready.ts`

DOM-ready helper.

```ts
onReady(callback);
```

If `document.readyState` is `'loading'`, listens for `DOMContentLoaded`. Otherwise, defers via `setTimeout(callback, 0)` for consistent async behavior.

### `global.ts`

IIFE entry point that powers the script-tag usage. Runs three steps:

1. **Capture** -- reads any queued calls from `window.formspree.q` (populated by an optional inline stub before the library loaded).
2. **Replace** -- overwrites `window.formspree` with the real dispatcher (`run`).
3. **Flush** -- on DOM ready, iterates the captured queue and executes each call via `run`.

After loading, `window.formspree(...)` calls execute immediately through `run`.

### `index.ts`

Barrel export for ESM/CJS consumers. Exports `initForm` and all types from `types.ts`.

## Build Output

Configured in `tsup.config.ts` with two entries:

| File               | Format | Description                                                                                  |
| ------------------ | ------ | -------------------------------------------------------------------------------------------- |
| `dist/index.js`    | CJS    | CommonJS entry                                                                               |
| `dist/index.mjs`   | ESM    | ES module entry                                                                              |
| `dist/index.d.ts`  | types  | TypeScript declarations                                                                      |
| `dist/index.d.mts` | types  | ESM TypeScript declarations                                                                  |
| `dist/global.js`   | IIFE   | Self-contained browser bundle (~12KB min). Inlines `@formspree/core`. No `require`/`import`. |

## Usage

### ESM/CJS (bundler)

```ts
import { initForm } from '@formspree/ajax';

const handle = initForm({
  formElement: '#contact-form',
  formId: 'xyzabc123',
  onSuccess: ({ form }) => form.reset(),
});

// Later: handle.destroy();
```

### Script tag (no bundler)

An inline stub queues calls while `global.js` loads asynchronously with `defer` (non-blocking):

```html
<script>
  window.formspree =
    window.formspree ||
    function () {
      (formspree.q = formspree.q || []).push(arguments);
    };
  formspree({ formElement: '#contact-form', formId: 'xyzabc123' });
</script>
<script src="https://unpkg.com/@formspree/ajax@1/dist/global.js" defer></script>
```

The stub is a tiny function that pushes calls into a queue (`formspree.q`). When `global.js` loads, it captures the queue, replaces the stub with the real dispatcher, and flushes all queued calls on DOM ready.

### Declarative HTML attributes

The library finds DOM elements via `data-fs-*` attributes:

```html
<div data-fs-message></div>

<form id="contact-form">
  <input type="email" name="email" data-fs-field="email" />
  <span data-fs-error="email"></span>
  <button type="submit" data-fs-submit-btn>Send</button>
</form>
```

## Lifecycle Flow

```
initForm(config)
  |
  +--> injectDefaultStyles()
  +--> resolve form element
  +--> enable(context)
  +--> onInit(context)
  +--> attach 'submit' listener
         |
         v
      handleSubmit(context)
        |
        +--> renderErrors(context, null)     // clear previous errors
        +--> renderMessage(context, null)     // clear previous message
        +--> disable(context)                 // disable submit buttons
        +--> onSubmit(context)
        +--> client.submitForm(...)
               |
               +--> success:
               |      renderMessage(context, 'success', 'Thank you!')
               |      onSuccess(context, result)
               |
               +--> validation error:
               |      renderErrors(context, error)
               |      renderMessage(context, 'error', message)
               |      onError(context, error)
               |
               +--> unexpected error:
                      renderMessage(context, 'error', message)
                      onFailure(context, error)
               |
               +--> finally: enable(context)  // re-enable submit buttons
```
