---
'@formspree/core': major
'@formspree/react': minor
---

`@formspree/core`

- rename client config `stripePromise` to `stripe` since it expects the resolved Stripe client not a promise

`@formspree/react`

- add a new hook: `useSubmit` which is suitable with code that uses other ways to manage submission state (e.g. with a library like react-hook-form)
- update `useForm` to use `useSubmit` under the hood
- fix: `FormspreeContext` updates the client when `props.project` change
