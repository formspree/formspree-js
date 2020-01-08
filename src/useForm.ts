import React, { useState } from 'react';
import { useStaticKit } from './context';
import { version } from '../package.json';
import { StaticKit as Client } from '@statickit/core';
import { SubmissionResponse } from '@statickit/core/forms';

type SubmitHandler = (
  event: React.FormEvent<HTMLFormElement>
) => Promise<SubmissionResponse>;

export function useForm(args: {
  form: string;
  client?: Client;
  data?: { [key: string]: string | (() => string) };
  endpoint?: string;
  debug?: boolean;
}): [
  {
    submitting: boolean;
    succeeded: boolean;
    errors: {
      field: string;
      message: string;
      code: string | null;
      properties: object;
    }[];
  },
  SubmitHandler
] {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errors, setErrors] = useState([]);
  const globalClient = useStaticKit();
  const client = args.client || globalClient;

  if (!client) {
    throw new Error('You must provide a StaticKit client');
  }

  if (!args.form) {
    throw new Error('You must provide a `form` key');
  }

  const debug = !!args.debug;
  const extraData = args.data;

  const handleSubmit: SubmitHandler = event => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;

    if (form.tagName != 'FORM') {
      throw new Error('submit was triggered for a non-form element');
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
      .submitForm(args.form, formData, {
        endpoint: args.endpoint,
        clientName: `@statickit/react@${version}`
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
        if (debug) console.log('Unexpected error', error);
        setSucceeded(false);
        throw error;
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return [{ submitting, succeeded, errors }, handleSubmit];
}
