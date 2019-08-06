# @statickit/react

The React component library for [StaticKit](https://statickit.com).

## Getting Started

Run the following to install via npm:

```
npm install @statickit/react
```

This package assumes that you already have React available as a dependency.

Since we use [React Hooks](https://reactjs.org/docs/hooks-intro.html), you must be on React >= 16.8.0.

### Simple example

Here's a simple example of a StaticKit-powered form:

```jsx
import { useForm } from '@statickit/react';

function MyForm() {
  // Call the `useForm` hook in your function component
  const [state, submit] = useForm('XXXXXXXXX');

  // Display success message in place of the form
  if (state.succeeded) {
    return (
      <div>Thank you for signing up!</div>
    )
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" name="email" />
      <button type="submit">Sign up</button>
    </form>
  )
}
```

At a minimum, all you have to do is use a `<form>` element and pass `submit` as the `onSubmit` handler.

The `state` object contains the following:

| Key            | Description                                                   |
| :------------- | :------------------------------------------------------------ |
| `submitting`   | A Boolean indicating whether the form is currently submitting |
| `succeeded`    | A Boolean indicating whether the form successfully submitted  |
| `errors`       | An Array of server-side validation errors                     |

The `errors` objects include the following:

| Key            | Description                                        |
| :------------- | :------------------------------------------------- |
| `field`        | The name of the field                              |
| `message`      | The error message (e.g. "is required")             |
| `code`         | The error code (e.g. "REQUIRED" or "EMAIL_FORMAT") |

### Rendering validation errors

Here's a more advanced example that displays validation errors for the `email` field:

```jsx
import { ValidationError, useForm } from '@statickit/react';

function MyForm() {
  const [state, submit] = useForm('XXXXXXXXX');

  if (state.succeeded) {
    return (
      <div>Thank you for signing up!</div>
    )
  }

  // Render email validation errors and disable the submit button when submitting
  return (
    <form onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input type="email" name="email" required />
      <ValidationError field="email" prefix="Email" errors={state.errors} />
      <button type="submit" disabled={state.submitting}>Sign up</button>
    </form>
  )
}
```

The `ValidationError` component accepts the following special properties:

- `field` - the name of the field for which to display errors (required)
- `errors` - the object containing validation errors (required)
- `prefix` - the human-friendly name of the field (optional, defaults to `This field`)

The rest of the props (such as `className`) are passed along to the `<div>` wrapper.
