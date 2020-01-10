# StaticKit React [![CircleCI](https://circleci.com/gh/unstacked/statickit-react.svg?style=svg)](https://circleci.com/gh/unstacked/statickit-react)

The React component library for [StaticKit](https://statickit.com).

## Installation

Run the following to install via npm:

```
npm install @statickit/react
```

This package assumes that you already have React available as a dependency. Since we use [React Hooks](https://reactjs.org/docs/hooks-intro.html), you must be on React >= 16.8.0.

## Usage

Place the `StaticKit` provider in your main `App` or layout component. This will provide an instance of the StaticKit client to child components:

_app.jsx_:

```jsx
import { StaticKitProvider } from '@statickit/react';

function App(props) {
  return (
    <StaticKitProvider site="REPLACE WITH SITE ID">
      {props.children}
    </StaticKit>
  );
}

export default App;
```

### Forms

Here's a simple example of a StaticKit-powered form:

_ContactForm.jsx_:

```jsx
import { useForm } from '@statickit/react';

function ContactForm() {
  // Call the `useForm` hook in your function component
  const [state, submit] = useForm('myForm');

  // Display success message in place of the form
  if (state.succeeded) {
    return <div>Thank you for signing up!</div>;
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" name="email" />
      <button type="submit">Sign up</button>
    </form>
  );
}

export default ContactForm;
```

[**&rarr; Read the docs**](https://statickit.com/docs/react)
