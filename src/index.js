import React, { useState, useEffect } from 'react';
import StaticKit from '@statickit/core';

function ValidationError(props) {
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

function useForm(props) {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errors, setErrors] = useState([]);
  const [client, setClient] = useState(undefined);

  useEffect(() => {
    const client = StaticKit();
    setClient(client);
  }, []);

  const id = typeof props === 'object' ? props.id : props;
  if (!id) throw new Error('You must define an `id` property');

  const endpoint = props.endpoint || 'https://api.statickit.com';
  const debug = !!props.debug;

  const submit = event => {
    const form = event.target;

    if (form.tagName != 'FORM')
      throw new Error('submit was triggered for a non-form element');

    const formData = new FormData(form);

    const sendRequest = async () => {
      try {
        const result = await client.submitForm({
          id: id,
          endpoint: endpoint,
          data: formData
        });

        if (result.response.status == 200) {
          if (debug) console.log(id, 'Submitted', result);
          setSucceeded(true);
          setErrors([]);
        } else {
          const errors = result.body.errors;
          if (debug) console.log(id, 'Validation error', result);
          setSucceeded(false);
          setErrors(errors);
        }
      } catch (e) {
        if (debug) console.log(id, 'Unexpected error', e);
        setSucceeded(false);
      } finally {
        setSubmitting(false);
      }
    };

    e.preventDefault();
    setSubmitting(true);
    sendRequest();
    return true;
  };

  return [{ submitting, succeeded, errors }, submit];
}

export { useForm, ValidationError };
