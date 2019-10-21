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

  if (!id && !(props.site && props.form)) {
    throw new Error('You must set an `id` or `site` & `form` properties');
  }

  const endpoint = props.endpoint || 'https://api.statickit.com';
  const debug = !!props.debug;
  const extraData = props.data;

  const submit = event => {
    const form = event.target;

    if (form.tagName != 'FORM')
      throw new Error('submit was triggered for a non-form element');

    const formData = new FormData(form);

    // Append extra data from config
    if (typeof extraData === 'object') {
      for (const prop in extraData) {
        if (typeof extraData[prop] === 'function') {
          formData.append(prop, extraData[prop].call(null, config));
        } else {
          formData.append(prop, extraData[prop]);
        }
      }
    }

    event.preventDefault();
    setSubmitting(true);

    return client.current
      .submitForm({
        id: id,
        site: props.site,
        form: props.form,
        endpoint: endpoint,
        data: formData
      })
      .then(result => {
        switch (result.response.status) {
          case 200:
            if (debug) console.log('Form submitted', result);
            setSucceeded(true);
            setErrors([]);
            break;

          case 422:
            const errors = result.body.errors;
            if (debug) console.log('Validation error', result);
            setSucceeded(false);
            setErrors(errors);
            break;

          default:
            if (debug) console.log('Unexpected error', result);
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
