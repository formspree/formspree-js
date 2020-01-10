import React from 'react';

interface Props {
  prefix?: string;
  field: string;
  errors: Array<{
    field: string;
    message: string;
    code: string | null;
    properties: object;
  }>;
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
