---
'@formspree/react': minor
'@formspree/core': minor
---

# Fix types in @formspree/core

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
