import React, { useState } from 'react';
import { useFormspree } from './context';
import { version } from '../package.json';
import { Client } from '@formspree/core';
import {
  SubmissionResponse,
  SubmissionData,
  ErrorBody,
  FormError
} from '@formspree/core/forms';

type FormEvent = React.FormEvent<HTMLFormElement>;

type DataObject = {
  [key: string]: string | (() => string) | (() => Promise<string>);
};

type ExtraData = DataObject | (() => DataObject) | (() => Promise<DataObject>);

type SubmitHandler = (
  submissionData: FormEvent | SubmissionData
) => Promise<SubmissionResponse>;

type ResetFunction = () => void;

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
    errors: FormError[];
  },
  SubmitHandler,
  ResetFunction
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
  let extraData = args.data;

  const reset: ResetFunction = () => {
    setSubmitting(false);
    setSucceeded(false);
    setErrors([]);
  };

  const handleSubmit: SubmitHandler = async submissionData => {
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
    if (typeof extraData === 'function') {
      extraData = (extraData as (() => DataObject | Promise<DataObject>)).call(
        null
      );
      if (extraData instanceof Promise) {
        extraData = await extraData;
      }
    }

    if (typeof extraData === 'object') {
      for (const prop in extraData) {
        if (typeof extraData[prop] === 'function') {
          let extraDataValue = (extraData[prop] as (() =>
            | string
            | Promise<string>)).call(null);
          if (extraDataValue instanceof Promise) {
            extraDataValue = await extraDataValue;
          }
          appendExtraData(prop, extraDataValue);
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
          body = result.body as ErrorBody;
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
