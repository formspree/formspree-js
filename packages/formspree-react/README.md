# Formspree React

React hooks and components for seamless form integration with [Formspree](https://formspree.io).

## Installation

Install with your preferred package manager:

```sh
npm install @formspree/react
# or
yarn add @formspree/react
# or
pnpm add @formspree/react
```

**Peer dependencies:** React 16.8, 17, 18, or 19.

_`@formspree/core` is included as a dependency, so you don't need to install it separately._

## Quick Start

```jsx
import { useForm, ValidationError } from '@formspree/react';

function ContactForm() {
  const [state, submit, reset] = useForm('YOUR_FORM_ID');

  if (state.succeeded) {
    return <p>Thanks for your submission!</p>;
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" />
      <ValidationError field="email" errors={state.errors} />

      <label htmlFor="message">Message</label>
      <textarea id="message" name="message" />
      <ValidationError field="message" errors={state.errors} />

      <ValidationError errors={state.errors} />

      <button type="submit" disabled={state.submitting}>Send</button>
    </form>
  );
}
```

## `useForm`

The primary hook for form submissions.

```ts
const [state, submit, reset] = useForm(formKey, options?);
```

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `formKey` | `string` | Your Formspree form ID (required). |
| `options.data` | `ExtraData` | Additional fields merged into every submission. |
| `options.endpoint` | `string` | Custom API origin (default: `https://formspree.io`). |
| `options.client` | `Client` | Custom Formspree client instance. |

**Returns a tuple:**

| Index | Name | Type | Description |
| --- | --- | --- | --- |
| 0 | `state` | object | Current form state (see below). |
| 1 | `submit` | function | Submit handler — pass to `onSubmit` or call with data directly. |
| 2 | `reset` | function | Resets all state back to initial values. |

**State properties:**

| Property | Type | Description |
| --- | --- | --- |
| `submitting` | `boolean` | `true` while the submission is in flight. |
| `succeeded` | `boolean` | `true` if the last submission was successful. |
| `errors` | `SubmissionError \| null` | Validation errors from Formspree, or `null`. |
| `result` | `SubmissionSuccess \| null` | Success result with optional `next` redirect URL. |

## `useSubmit`

A lower-level hook that returns only a submit handler without managing state. Use this when you need full control over state management.

```ts
import { useSubmit } from '@formspree/react';

const submit = useSubmit(formKey, options?);

// With a form event
const handleSubmit = async (e) => {
  const result = await submit(e);
  // result is SubmissionSuccess or SubmissionError
};

// Or with data directly
const result = await submit({ email: 'user@example.com' });
```

**Options:**

| Name | Type | Description |
| --- | --- | --- |
| `options.client` | `Client` | Custom Formspree client instance. |
| `options.extraData` | `ExtraData` | Additional fields merged into every submission. |
| `options.origin` | `string` | Custom API origin (default: `https://formspree.io`). |

## `ValidationError`

Renders validation error messages from a submission.

```jsx
// Field-level errors
<ValidationError field="email" errors={state.errors} />

// Form-level errors
<ValidationError errors={state.errors} />

// With a prefix
<ValidationError field="email" errors={state.errors} prefix="Email" />
```

**Props:**

| Prop | Type | Description |
| --- | --- | --- |
| `errors` | `SubmissionError \| null` | The `errors` value from `useForm` state. |
| `field` | `string` | Show errors for a specific field. Omit for form-level errors. |
| `prefix` | `string` | Text prepended before each error message. |

Also accepts any standard `<div>` HTML attributes (e.g. `className`, `style`).

Renders nothing when there are no errors for the given field.

## `FormspreeProvider`

Optional context provider for sharing a Formspree client across your app and enabling Stripe payment integration.

```jsx
import { FormspreeProvider } from '@formspree/react';

function App() {
  return (
    <FormspreeProvider project="YOUR_PROJECT_ID" stripePK="pk_test_...">
      <ContactForm />
    </FormspreeProvider>
  );
}
```

**Props:**

| Prop | Type | Description |
| --- | --- | --- |
| `project` | `string` | Formspree project ID. |
| `stripePK` | `string` | Stripe publishable key — enables Stripe Elements for payment forms. |

When `stripePK` is provided, the provider wraps children in Stripe's `<Elements>` provider. Use the re-exported `CardElement` component for card inputs.

## Extra Data

Append additional fields to every submission using the `data` option. Values can be static strings, sync functions, or async functions. Return `undefined` to skip a field.

```jsx
const [state, submit] = useForm('YOUR_FORM_ID', {
  data: {
    source: 'contact-page',
    referrer: () => document.referrer || undefined,
    sessionId: async () => await fetchSessionId(),
  },
});
```

## Help and Support

For help and support please see the [Formspree docs](https://help.formspree.io).

Part of the [formspree-js](https://github.com/formspree/formspree-js) monorepo. See also [`@formspree/core`](../formspree-core) and [`@formspree/ajax`](../formspree-ajax).

## License

MIT
