# Formspree AJAX

A vanilla JavaScript library for declarative form handling with [Formspree](https://formspree.io/). No framework required — works with plain HTML forms via data attributes or a simple JavaScript API.

## Quick Start

### With a bundler

Install with your preferred package manager:

```sh
npm install @formspree/ajax
# or
yarn add @formspree/ajax
# or
pnpm add @formspree/ajax
```

Initialize your form:

```js
import { initForm } from '@formspree/ajax';

initForm({
  formElement: '#contact-form',
  formId: 'YOUR_FORM_ID',
});
```

Add the HTML:

```html
<div data-fs-success></div>
<div data-fs-error></div>

<form id="contact-form">
  <label for="email">Email</label>
  <input type="email" id="email" name="email" data-fs-field />
  <span data-fs-error="email"></span>

  <button type="submit" data-fs-submit-btn>Send</button>
</form>
```

### Without a bundler (CDN)

Add this snippet before the closing `</body>` tag — no install or bundler needed:

```html
<div data-fs-success></div>
<div data-fs-error></div>

<form id="contact-form">
  <label for="email">Email</label>
  <input type="email" id="email" name="email" data-fs-field />
  <span data-fs-error="email"></span>

  <button type="submit" data-fs-submit-btn>Send</button>
</form>

<script>
  window.formspree =
    window.formspree ||
    function () {
      (formspree.q = formspree.q || []).push(arguments);
    };
  formspree('initForm', { formElement: '#contact-form', formId: 'YOUR_FORM_ID' });
</script>
<script src="https://unpkg.com/@formspree/ajax@1" defer></script>
```

That's it. The library handles submission, validation errors, loading state, and success messages automatically.

## Data Attributes

These HTML attributes enable declarative form behavior without additional JavaScript:

| Attribute                   | Element                 | Description                                                                                                                                      |
| --------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data-fs-error="fieldName"` | `<span>`, `<div>`       | Displays field-level validation errors. If empty, the API error message is injected. If it has content, it is shown/hidden as-is.                |
| `data-fs-error`             | `<div>`                 | Displays form-level errors (without a value). Same content policy: empty elements get the server message, elements with content are shown as-is. |
| `data-fs-success`           | `<div>`                 | Displays a success message after submission. Empty elements get "Thank you!", elements with content are shown as-is.                             |
| `data-fs-field`             | `<input>`, `<textarea>` | Marks an input to receive `aria-invalid="true"` on error. The field name is read from the element's `name` attribute.                            |
| `data-fs-submit-btn`        | `<button>`              | Automatically disabled during submission and re-enabled on completion.                                                                           |
| `data-fs-active`            | any                     | Added by the library to toggle visibility of error and success elements. Use in CSS selectors to style visible messages (e.g. `[data-fs-success][data-fs-active]`). |

## Configuration

Pass a config object to `initForm()`:

```js
import { initForm } from '@formspree/ajax';

const handle = initForm({
  // Required
  formElement: '#contact-form', // CSS selector or HTMLFormElement
  formId: 'YOUR_FORM_ID', // Your Formspree form ID

  // Optional
  projectId: 'YOUR_PROJECT_ID', // Route to /p/{projectId}/f/{formId}
  origin: 'https://formspree.io', // API origin (default)
  debug: false, // Enable console logging
  useDefaultStyles: true, // Inject default CSS (default: true)

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
  // Render functions receive `null` to clear state before each submission.
  enable: (context) => {},
  disable: (context) => {},
  renderFieldErrors: (context, error) => {}, // error: SubmissionError | null
  renderSuccess: (context, message) => {}, // message: string | null
  renderFormError: (context, message) => {}, // message: string | null
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

- **Submit button** — Disabled during submission, re-enabled on completion.
- **Field errors** — Populated into `data-fs-error="fieldName"` elements. If the element is empty, the API error message is injected. If it has content, it is shown/hidden as-is.
- **Field validation** — `aria-invalid="true"` is set on `data-fs-field` inputs when their field has errors.
- **Success message** — The `data-fs-success` element is shown with "Thank you!" (or preserved user content).
- **Form errors** — The `data-fs-error` element (without a value) is shown with the form-level error message (or preserved user content).
- **Success without data-fs-success** — If no `data-fs-success` element exists and no `onSuccess` callback is provided, the form is replaced with a "Thank you!" message.
- **Success with data-fs-success** — If a `data-fs-success` element exists and no `onSuccess` callback is provided, the form is reset after success.
- **Default styles** — Basic styles for error messages, invalid fields, and message banners are automatically injected.

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

Default styles are injected automatically (disable with `useDefaultStyles: false`). You can override them with your own CSS:

```css
/* All error and success elements are hidden by default */
[data-fs-error],
[data-fs-success] {
  display: none;
}

/* Field-level error text */
[data-fs-error][data-fs-active] {
  display: block;
  color: #dc3545;
}

[data-fs-error]:not([data-fs-error=''])[data-fs-active] {
  font-size: 12px;
  margin-top: 4px;
}

/* Form-level error banner */
[data-fs-error=''][data-fs-active] {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Success message banner */
[data-fs-success][data-fs-active] {
  display: block;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

/* Invalid field border */
[data-fs-field][aria-invalid='true'] {
  border-color: #dc3545;
}
```

## Help and Support

For help and support please see the [Formspree docs](https://help.formspree.io/).

Part of the [formspree-js](https://github.com/formspree/formspree-js) monorepo. See also [`@formspree/core`](../formspree-core) and [`@formspree/react`](../formspree-react).

## License

MIT
