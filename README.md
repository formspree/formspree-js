# Formspree JS

A monorepo containing libraries for seamless form integration with [Formspree](https://formspree.io/) via JavaScript and/or React.

## Packages

### `@formspree/core`

Core submission client and types. Provides `createClient`, `getDefaultClient`, `SubmissionError`, and submission types.

```sh
npm install @formspree/core

yarn add @formspree/core

pnpm add @formspree/core
```

### `@formspree/react`

React hooks (`useForm`, `useSubmit`) and components (`ValidationError`) built on top of core.

**Prerequisites:** React 16.8 or higher.

```sh
npm install @formspree/react

yarn add @formspree/react

pnpm add @formspree/react
```

_Note: `@formspree/core` is a dependency of `@formspree/react`, so you don't need to install it separately._

### `@formspree/ajax`

Vanilla JavaScript library for declarative form handling with plain HTML forms. No framework required — use data attributes and a single `initForm()` call, or load via a script tag with the `window.formspree()` global API.

```sh
npm install @formspree/ajax

yarn add @formspree/ajax
```

_Note: `@formspree/core` is a dependency of `@formspree/ajax`, so you don't need to install it separately._

Or via CDN (no bundler needed):

```html
<script>
  window.formspree =
    window.formspree ||
    function () {
      (formspree.q = formspree.q || []).push(arguments);
    };
  formspree('initForm', { formElement: '#my-form', formId: 'YOUR_FORM_ID' });
</script>
<script src="https://unpkg.com/@formspree/ajax@1" defer></script>
```

See the [@formspree/ajax README](./packages/formspree-ajax/README.md) for full documentation.

## Help and Support

For help and support please see [the Formspree React docs](https://help.formspree.io/hc/en-us/articles/360055613373).

## Contributing

Please follow our [contributing guidelines](./CONTRIBUTING.md).
