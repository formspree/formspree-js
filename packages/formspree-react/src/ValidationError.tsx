import React, { type ComponentPropsWithoutRef } from 'react';
import type { FieldValues, SubmissionErrorResult } from '@formspree/core';

export type ValidationErrorProps<T extends FieldValues = FieldValues> = {
  errors: SubmissionErrorResult<T> | null;
  field?: keyof T;
  prefix?: string;
} & ComponentPropsWithoutRef<'div'>;

export const ValidationError: React.FC<ValidationErrorProps> = (props) => {
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
      {prefix ? `${prefix} ` : ''}
      {errs.map((err) => err.message).join(', ')}
    </div>
  );
};
