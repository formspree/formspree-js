import React, { useState } from 'react';
import { useStaticKit } from './context';
import { version } from '../package.json';

// TODO: Expose an interface for submitForm return value in core

interface Props {
  id?: string;
  site?: string;
  form?: string;
  endpoint?: string;
  debug?: boolean;
  data?: { [key: string]: string | (() => string) };
}

type ReturnValue = [
  { submitting: boolean; succeeded: boolean; errors: any },
  (
    event: React.FormEvent<HTMLFormElement>
  ) => Promise<{ body: any; response: Response }>
];

export function useForm(props: Props): ReturnValue {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errors, setErrors] = useState([]);
  const client = useStaticKit();

  const id = typeof props === 'object' ? props.id : props;

  if (!id && !(props.site && props.form)) {
    throw new Error('You must set an `id` or `site` & `form` properties');
  }

  const endpoint = props.endpoint || 'https://api.statickit.com';
  const debug = !!props.debug;
  const extraData = props.data;

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<{ body: any; response: Response }> => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    if (form.tagName != 'FORM') {
      throw new Error('submit was triggered for a non-form element');
    }

    if (!client) {
      throw new Error('The StaticKit client must be instantiated');
    }

    const formData = new FormData(form);

    // Append extra data from config
    if (typeof extraData === 'object') {
      for (const prop in extraData) {
        if (typeof extraData[prop] === 'function') {
          formData.append(prop, (extraData[prop] as (() => string)).call(null));
        } else {
          formData.append(prop, extraData[prop] as string);
        }
      }
    }

    setSubmitting(true);

    return client
      .submitForm({
        id: id,
        site: props.site,
        form: props.form,
        endpoint: endpoint,
        clientName: `@statickit/react@${version}`,
        data: formData
      })
      .then((result: { body: any; response: Response }) => {
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
      .catch((error: Error) => {
        if (debug) console.log(id, 'Unexpected error', error);
        setSucceeded(false);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return [{ submitting, succeeded, errors }, handleSubmit];
}
