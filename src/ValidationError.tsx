import React from 'react';
import { Error } from './types';

interface Props {
  prefix?: string;
  field?: string;
  errors: Error[];
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
