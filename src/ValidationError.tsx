import React from 'react';
import { FormError } from '@formspree/core/forms';

interface Props {
  prefix?: string;
  field?: string;
  errors: FormError[];
  [x: string]: any;
}

export const ValidationError: React.FC<Props> = props => {
  const { prefix, field, errors, ...attrs } = props;

  const error = (errors || []).find(error => {
    return error.field == field;
  });

  if (!error) {
    return null;
  }

  return (
    <div {...attrs}>
      {prefix} {error.message}
    </div>
  );
};
