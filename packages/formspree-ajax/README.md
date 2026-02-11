# Formspree AJAX

A vanilla JavaScript library for declarative form handling with [Formspree](https://formspree.io/). No framework required — works with plain HTML forms via data attributes or a simple JavaScript API.

## Installation

### NPM / Yarn

```sh
npm install @formspree/ajax @formspree/core

yarn add @formspree/ajax @formspree/core
```

### Script Tag (CDN)

No bundler needed. Add this snippet before the closing `</body>` tag:

```html
<script>
  window.formspree =
    window.formspree ||
    function () {
      (formspree.q = formspree.q || []).push(arguments);
    };
  formspree({ formElement: '#my-form', formId: 'YOUR_FORM_ID' });
</script>
<script src="https://unpkg.com/@formspree/ajax@1/dist/global.js" defer></script>
```

## Quick Start

### ESM (with a bundler)

```js
import { initForm } from '@formspree/ajax';

initForm({
  formElement: '#contact-form',
  formId: 'YOUR_FORM_ID',
});
```

### HTML

```html
<div data-fs-message></div>

<form id="contact-form">
  <label for="email">Email</label>
  <input type="email" id="email" name="email" data-fs-field />
  <span data-fs-error="email"></span>

  <button type="submit" data-fs-submit-btn>Send</button>
</form>
```

That's it. The library handles submission, validation errors, loading state, and success messages automatically.

## Data Attributes

These HTML attributes enable declarative form behavior without additional JavaScript:

| Attribute                   | Element                 | Description                                                                                                                                    |
| --------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-fs-error="fieldName"` | `<span>`, `<div>`       | Displays the first validation error for the named field.                                                                                       |
| `data-fs-field`             | `<input>`, `<textarea>` | Marks an input to receive `aria-invalid="true"` on error. The field name is read from the element's `name` attribute.                          |
| `data-fs-submit-btn`        | `<button>`              | Automatically disabled with a spinner during submission and re-enabled on completion.                                                          |
| `data-fs-message`           | `<div>`                 | Displays form-level success or error messages. Visibility is controlled by a `data-fs-message-type` attribute set to `"success"` or `"error"`. |

## Configuration

Pass a config object to `initForm()`:

```js
import { initForm } from '@formspree/ajax';

const handle = initForm({
  // Required
  formElement: '#contact-form', // CSS selector or HTMLFormElement
  formId: 'YOUR_FORM_ID', // Your Formspree form ID

  // Optional
  origin: 'https://formspree.io', // API origin (default)
  debug: false, // Enable console logging

  // Extra data merged into every submission
  data: {
    source: 'website',
    campaign: () => getCampaign(),
    timestamp: async () => await getServerTime(),
  },

  // Lifecycle callbacks
  onInit: (context) => {},
  onSubmit: (context) => {},
  onSuccess: (context, result) => {},
  onError: (context, error) => {},
  onFailure: (context, error) => {},

  // Custom rendering (override defaults)
  enable: (context) => {},
  disable: (context) => {},
  renderFieldErrors: (context, error) => {},
  renderFormMessage: (context, type, message) => {},
});

// Clean up when done
handle.destroy();
```

## Lifecycle Callbacks

| Callback    | Arguments           | Description                                          |
| ----------- | ------------------- | ---------------------------------------------------- |
| `onInit`    | `(context)`         | Called when the form is initialized.                 |
| `onSubmit`  | `(context)`         | Called before submission is sent.                    |
| `onSuccess` | `(context, result)` | Called on successful submission.                     |
| `onError`   | `(context, error)`  | Called on validation errors from Formspree.          |
| `onFailure` | `(context, error)`  | Called on unexpected errors (e.g., network failure). |

The `context` object contains: `form` (HTMLFormElement), `formKey`, `endpoint`, `client`, and `config`.

## Default Behaviors

The library provides sensible defaults out of the box:

- **Submit button** — Disabled with a loading spinner during submission, re-enabled on completion.
- **Field errors** — Populated into `data-fs-error="fieldName"` elements using the API error message.
- **Field validation** — `aria-invalid="true"` is set on `data-fs-field` inputs when their field has errors.
- **Form message** — Success ("Thank you!") or form-level error messages displayed in `data-fs-message` elements.
- **Success without message element** — If no `data-fs-message` element exists and no `onSuccess` callback is provided, the form is replaced with a "Thank you!" message.
- **Success with message element** — If a `data-fs-message` element exists and no `onSuccess` callback is provided, the form is reset after success.
- **Default styles** — Basic styles for error messages, invalid fields, message banners, and the loading spinner are automatically injected.

## Extra Data

Append extra data to every submission using the `data` option. Values can be static strings, sync functions, or async functions. `undefined` values are skipped.

```js
initForm({
  formElement: '#my-form',
  formId: 'YOUR_FORM_ID',
  data: {
    source: 'landing-page',
    referrer: () => document.referrer || undefined,
    sessionId: async () => await fetchSessionId(),
  },
});
```

## Styling

Default styles are injected automatically. You can override them with your own CSS:

```css
/* Error message text */
[data-fs-error] {
  color: #dc3545;
  font-size: 12px;
}

/* Invalid field border */
[data-fs-field][aria-invalid='true'] {
  border-color: #dc3545;
}

/* Success message banner */
[data-fs-message][data-fs-message-type='success'] {
  background: #d4edda;
  color: #155724;
}

/* Error message banner */
[data-fs-message][data-fs-message-type='error'] {
  background: #f8d7da;
  color: #721c24;
}
```

## Help and Support

For help and support please see the [Formspree docs](https://help.formspree.io/).
