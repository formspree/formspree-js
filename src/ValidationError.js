import React from 'react';

export default function ValidationError(props) {
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
}
