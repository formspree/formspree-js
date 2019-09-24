# Changelog

## 1.0.0-beta.4

- Update StaticKit Core
- Teardown the client when form components are unmounted

## 1.0.0-beta.3

Use the `@statickit/core` client library.

Also, rework the `useForm` arg structure to accomodate more options:

```diff
- const [state, submit] = useForm('XXXXXXXX')
+ const [state, submit] = useForm({ id: 'XXXXXXXX' })
```

We've retained backward-compatibility.

## 1.0.0-beta.2

Renamed the UMD global export from `statickit-react` to `StaticKitReact`

## 1.0.0-beta.1

Wrap state variables up in a `state` object in the return value for `useForm`:

```javascript
const [state, submit] = useForm('xyz');
```

## 1.0.0-beta.0

Initial release.
