import React, { type ComponentPropsWithoutRef } from 'react';
import type { FieldValues, SubmissionError } from '@formspree/core';

export type ValidationErrorProps<T extends FieldValues> = {
  errors: SubmissionError<T> | null;
  field?: keyof T;
  prefix?: string;
} & ComponentPropsWithoutRef<'div'>;

export function ValidationError<T extends FieldValues>(
  props: ValidationErrorProps<T>
) {
  const { prefix, field, errors, ...attrs } = props;
  if (errors == null) {
    return null;
  }

  const errs = field ? errors.getFieldErrors(field) : errors.getFormErrors();
  if (errs.length === 0) {
    return null;
  }

  return (
    <div {...attrs}>
      {prefix ? `${prefix} ` : null}
      {errs.map((err) => err.message).join(', ')}
    </div>
  );
}
