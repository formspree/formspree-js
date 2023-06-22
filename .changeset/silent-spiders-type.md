---
'@formspree/react': patch
'@formspree/core': patch
---

Unify typescript version and enforce typechecking

- Centralize typescript and its related `devDependencies` to project root for version consistency
- Centralize `tsconfig` to root and have package-specific `tsconfig` extends it for consistency
- Make typescript config more strict especially around detecting `null` and `undefined`
- Run typecheck on test folders
- Fix type errors
- Add Turbo `typecheck` task which runs `tsc` in typechecking mode
- Set up Github Action to run `typecheck` task
