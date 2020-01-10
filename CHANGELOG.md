# Changelog

## 2.0.0

- Migrate to TypeScript
- Add `StaticKitProvider` and `useStaticKit` hook for consuming context
- **Breaking change**: New argument structure for the `useForm` hook:

```js
// You only have to supply a `client` if you aren't using the `<StaticKitProvider>`
const [state, handleSubmit] = useForm(formKey, {
  client,
  data,
  endpoint,
  debug
});
```

## 1.2.0

- Update core to fix body serialization bug.
- Pass along `clientName` with form submission.

## 1.1.2

- Bug fix: an undeclared variable was referenced when `data` values were functions.

## 1.1.1

- Accept `data` property for adding programmatic fields to the form payload.

## 1.1.0

- Accept `site` + `form` combo (in lieu of `id`) for identifying forms.

## 1.0.1

- Bundle iife for testing in browser.

## 1.0.0

- Refactor npm packaging and add tests.

## 1.0.0-beta.7

- Use `useRef` internally to store the StaticKit client.

## 1.0.0-beta.6

- Bug fix with form component teardown.

## 1.0.0-beta.5

- Update StaticKit Core to prevent messing with `window` object.

## 1.0.0-beta.4

- Update StaticKit Core.
- Teardown the client when form components are unmounted.

## 1.0.0-beta.3

Use the `@statickit/core` client library.

Also, rework the `useForm` arg structure to accomodate more options:

```diff
- const [state, submit] = useForm('XXXXXXXX')
+ const [state, submit] = useForm({ id: 'XXXXXXXX' })
```

We've retained backward-compatibility.

## 1.0.0-beta.2

Renamed the UMD global export from `statickit-react` to `StaticKitReact`.

## 1.0.0-beta.1

Wrap state variables up in a `state` object in the return value for `useForm`:

```javascript
const [state, submit] = useForm('xyz');
```

## 1.0.0-beta.0

Initial release.
