# @statickit/react

The React component library for [StaticKit](https://statickit.com).

## Getting Started

Install the package in your React project:

```
npm install @statickit/react
```

This package assumes that you already have React available as a dependency.

Since we use [React Hooks](https://reactjs.org/docs/hooks-intro.html), **you must be on React >= 16.8.0**.

### Forms

Here's a simple example of a StaticKit-powered form:

```jsx
import { useForm } from '@statickit/react';

function MyForm() {
  // Call the `useForm` hook in your function component
  const [submitting, succeeded, errors, submit] = useForm('XXXXXXXXX');

  return (
    <form onSubmit={submit}>
      <input type="email" name="email" />
      <button type="submit">Sign up</button>
    </form>
  )
}
```

Note the requirements:

- Replace `XXXXXXXXX` with your StaticKit form id
- Use a `<form>` element and pass `submit` for `onSubmit`

The other values from the hook allow you to react to different stages of the form lifecycle:

- `submitting` becomes `true` when the request is being made to the server
- `succeeded` becomes `true` when the submission is successfully sent
- `errors` gets populated with an array of validation errors (when applicable)

Here's a more advanced example:

```jsx
import { ValidationError, useForm } from '@statickit/react';

function MyForm() {
  const [submitting, succeeded, errors, submit] = useForm('XXXXXXXXX');

  // Display success message in place of the form
  if (succeeded) {
    return (
      <div>Thank you for signing up!</div>
    )
  }

  // Render email validation errors and disable the submit button when submitting
  return (
    <form onSubmit={submit}>
      <input type="email" name="email" required />
      <ValidationError field="email" prefix="Email" errors={errors} />
      <button type="submit" disabled={submitting}>Sign up</button>
    </form>
  )
}
```
