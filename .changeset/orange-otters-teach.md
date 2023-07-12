---
'@formspree/core': major
'@formspree/react': minor
---

## Improve error handling

- `@formspree/core` `submitForm` function now will never rejects but always produces a type of `SubmissionResult`, different types of the result can be refined/narrowed down using the field `kind`.
- Provide `SubmissionErrorResult` which can be used to get an array of form errors and/or field errors (by field name)
- `Response` is no longer made available on the submission result
- Update `@formspree/react` for the changes introduced to `@formspree/core`
