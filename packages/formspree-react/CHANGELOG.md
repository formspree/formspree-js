# Changelog

## 2.5.4

### Patch Changes

- ceaae3d: Bump (patch) @formspree/core and @formspree/react to verify that the release pipeline is fixed
- Updated dependencies [ceaae3d]
  - @formspree/core@3.0.4

## 2.5.3

### Patch Changes

- 805aa4d: Bump (patch) @formspree/core and @formspree/react to fix the release pipeline
- Updated dependencies [805aa4d]
  - @formspree/core@3.0.3

## 2.5.2

### Patch Changes

- 6c31cd1: (type) Support array as FieldValue
- Updated dependencies [6c31cd1]
  - @formspree/core@3.0.2

## 2.5.1

### Patch Changes

- 56a444b: remove unused package-specific yarn.lock
- Updated dependencies [56a444b]
  - @formspree/core@3.0.1

## 2.5.0

### Minor Changes

- 4c40e1b: # Fix types in @formspree/core

  ## `@formspree/core`

  - fix `SubmissionData` has a type of `any` causing everything after it to opt-out typechecking
  - remove a no-op `teardown` method on `Client` and `Session`
  - remove `utils.now` and use `Date.now` instead
  - remove unused functions from `utils` module: `append`, `toCamel`, `camelizeTopKeys`
  - add tests for `utils.appendExtraData` and convert the test file to typescript
  - add tests for `session.data()`
  - no longer export `Session` type

  ## `@formspree/react`

  - update types as a result of `SubmissionData` is no longer `any`
  - fix `createPaymentMethod` does not properly map payload when the submission data is a type of `FormData`
  - fix the `Client` is not updated when project changes

- 49730d9: ## Improve error handling

  - `@formspree/core` `submitForm` function now will never rejects but always produces a type of `SubmissionResult`, different types of the result can be refined/narrowed down using the field `kind`.
  - Provide `SubmissionErrorResult` which can be used to get an array of form errors and/or field errors (by field name)
  - `Response` is no longer made available on the submission result
  - Update `@formspree/react` for the changes introduced to `@formspree/core`

- d025831: `@formspree/core`

  - rename client config `stripePromise` to `stripe` since it expects the resolved Stripe client not a promise

  `@formspree/react`

  - add a new hook: `useSubmit` which is suitable with code that uses other ways to manage submission state (e.g. with a library like react-hook-form)
  - update `useForm` to use `useSubmit` under the hood
  - fix: `FormspreeContext` updates the client when `props.project` change

### Patch Changes

- Updated dependencies [4c40e1b]
- Updated dependencies [49730d9]
- Updated dependencies [d025831]
  - @formspree/core@3.0.0

## 2.4.4

### Patch Changes

- a359edd: Upgrade jest to v29 using centralized dependency, and run tests in CI
- Updated dependencies [a359edd]
  - @formspree/core@2.8.3

## 2.4.3

### Patch Changes

- Unify typescript version and enforce typechecking

  - Centralize typescript and its related `devDependencies` to project root for version consistency
  - Centralize `tsconfig` to root and have package-specific `tsconfig` extends it for consistency
  - Make typescript config more strict especially around detecting `null` and `undefined`
  - Run typecheck on test folders
  - Fix type errors
  - Add Turbo `typecheck` task which runs `tsc` in typechecking mode
  - Set up Github Action to run `typecheck` task

- Updated dependencies [07c30c5]
  - @formspree/core@2.8.2

## 2.4.2

### Patch Changes

- 758b606: Upgrading react version used for development. Making react peerDependency explicit. Fixing dependency on core.

## 2.4.1

### Patch Changes

- Fixed promise detection in extradata
- Better error handling

## 2.4.0

### Minor Changes

- Conversion to monorepo. Path for type imports changed. Lazy loading stripe.

## 2.1.1

- Update dependencies for security.

## 2.1.0

- Update core library.

## 2.0.1

- Bug fix: add indexer to ValidationError props type. This will allow any additional props to pass-through without TypeScript having an issue with it.

## 2.0.0

- Migrate to TypeScript
- Add `StaticKitProvider` and `useStaticKit` hook for consuming context
- **Breaking change**: New argument structure for the `useForm` hook:

```js
const [state, handleSubmit] = useForm(formKey, opts);
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
