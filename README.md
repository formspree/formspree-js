# @statickit/react

The React component library for [StaticKit](https://statickit.com).

## Quick Start Guide

### Install the package

```
npm install @statickit/react
```

This package assumes that you already have React available as a dependency.

Since we use [React Hooks](https://reactjs.org/docs/hooks-intro.html), **you must be on React >= 16.8.0**.

### Build your form component

Here's a simple example of a StaticKit-powered form:

```jsx
import { useForm } from '@statickit/react';

function MyForm() {
  // Call the `useForm` hook in your function component
  const [submit, submitting, succeeded, errors] = useForm('XXXXXXXXX');

  return (
    <form onSubmit={submit}>
      <input type="email" name="email" />
      <button type="submit">Sign up</button>
    </form>
  )
}
```

At a minimum, all you have to do is use a `<form>` element and pass `submit` as the `onSubmit` handler. Here's a more advanced example that displays validation errors and a success message:

```jsx
import { ValidationError, useForm } from '@statickit/react';

function MyForm() {
  const [submit, submitting, succeeded, errors] = useForm('XXXXXXXXX');

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
