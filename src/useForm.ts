import React, { useState } from 'react';
import { useFormspree } from './context';
import { version } from '../package.json';
import { Client } from '@formspree/core';
import { SubmissionResponse, SubmissionData } from '@formspree/core/forms';

interface ErrorPayload {
  field?: string;
  code: string | null;
  message: string;
}

type FormEvent = React.FormEvent<HTMLFormElement>;

type ExtraData = { [key: string]: string | (() => string) };

type SubmitHandler = (
  submissionData: FormEvent | SubmissionData
) => Promise<SubmissionResponse>;

function isEvent(data: FormEvent | SubmissionData): data is FormEvent {
  return (data as FormEvent).preventDefault !== undefined;
}

export function useForm(
  formKey: string,
  args: {
    client?: Client;
    data?: ExtraData;
    endpoint?: string;
    debug?: boolean;
  } = {}
): [
  {
    submitting: boolean;
    succeeded: boolean;
    errors: ErrorPayload[];
  },
  SubmitHandler
] {
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errors, setErrors] = useState([]);
  const globalClient = useFormspree();
  const client = args.client || globalClient;

  if (!client) {
    throw new Error('You must provide a Formspree client');
  }

  if (!formKey) {
    throw new Error(
      'You must provide a form key or hashid ' +
        '(e.g. useForm("myForm") or useForm("123xyz")'
    );
  }

  const debug = !!args.debug;
  const extraData = args.data;
  
  const reset: () => {
    setSubmitting(false);
    setSucceeded(false);
    setErrors([]);
  }

  const handleSubmit: SubmitHandler = submissionData => {
    const getFormData = (event: FormEvent) => {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      if (form.tagName != 'FORM') {
        throw new Error('submit was triggered for a non-form element');
      }
      return new FormData(form);
    };

    let formData = isEvent(submissionData)
      ? getFormData(submissionData)
      : submissionData;

    const appendExtraData = (prop: string, value: string) => {
      if (formData instanceof FormData) {
        formData.append(prop, value);
      } else {
        formData = Object.assign(formData, { [prop]: value });
      }
    };

    // Append extra data from config
    if (typeof extraData === 'object') {
      for (const prop in extraData) {
        if (typeof extraData[prop] === 'function') {
          appendExtraData(prop, (extraData[prop] as (() => string)).call(null));
        } else {
          appendExtraData(prop, extraData[prop] as string);
        }
      }
    }

    setSubmitting(true);

    return client
      .submitForm(formKey, formData, {
        endpoint: args.endpoint,
        clientName: `@formspree/react@${version}`
      })
      .then((result: SubmissionResponse) => {
        let status = result.response.status;
        let body;

        if (status === 200) {
          if (debug) console.log('Form submitted', result);
          setSucceeded(true);
          setErrors([]);
        } else if (status >= 400 && status < 500) {
          body = result.body as { errors: ErrorPayload[] };
          if (body.errors) setErrors(body.errors);
          if (debug) console.log('Validation error', result);
          setSucceeded(false);
        } else {
          if (debug) console.log('Unexpected error', result);
          setSucceeded(false);
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

  return [{ submitting, succeeded, errors }, handleSubmit, reset];
}
