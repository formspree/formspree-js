import { useState, useEffect, useRef } from 'react';
import StaticKit from '@statickit/core';

export default function useForm(props) {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errors, setErrors] = useState([]);
  const client = useRef(props.client);

  useEffect(() => {
    if (!client.current) {
      client.current = StaticKit();
    }

    return () => {
      if (client.current) {
        client.current.teardown();
      }
    };
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

    event.preventDefault();
    setSubmitting(true);

    return client.current
      .submitForm({
        id: id,
        endpoint: endpoint,
        data: formData
      })
      .then(result => {
        switch (result.response.status) {
          case 200:
            if (debug) console.log(id, 'Submitted', result);
            setSucceeded(true);
            setErrors([]);
            break;

          case 422:
            const errors = result.body.errors;
            if (debug) console.log(id, 'Validation error', result);
            setSucceeded(false);
            setErrors(errors);
            break;

          default:
            if (debug) console.log(id, 'Unexpected error', result);
            setSucceeded(false);
            break;
        }

        return result;
      })
      .catch(error => {
        if (debug) console.log(id, 'Unexpected error', error);
        setSucceeded(false);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return [{ submitting, succeeded, errors }, submit];
}
