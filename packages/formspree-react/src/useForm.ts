import {
  type Client,
  type FieldValues,
  type SubmissionError,
  type SubmissionSuccess,
} from '@formspree/core';
import { useState } from 'react';
import type { ExtraData } from './types';
import { useSubmit, type SubmitHandler } from './useSubmit';

type ResetFunction = () => void;

export type TUseForm<T extends FieldValues> = [
  {
    errors: SubmissionError<T> | null;
    result: SubmissionSuccess | null;
    submitting: boolean;
    succeeded: boolean;
  },
  SubmitHandler<T>,
  ResetFunction
];

export function useForm<T extends FieldValues>(
  formKey: string,
  args: {
    client?: Client;
    data?: ExtraData;
    endpoint?: string;
  } = {}
): TUseForm<T> {
  const [errors, setErrors] = useState<SubmissionError<T> | null>(null);
  const [result, setResult] = useState<SubmissionSuccess | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  if (!formKey) {
    throw new Error(
      'You must provide a form key or hashid ' +
        '(e.g. useForm("myForm") or useForm("123xyz")'
    );
  }

  const submit = useSubmit<T>(formKey, {
    client: args.client,
    extraData: args.data,
    onError(error) {
      setErrors(error);
      setSubmitting(false);
      setSucceeded(false);
    },
    onSuccess(result) {
      setErrors(null);
      setResult(result);
      setSubmitting(false);
      setSucceeded(true);
    },
    origin: args.endpoint,
  });

  return [
    { errors, result, submitting, succeeded },

    async function handleSubmit(submissionData) {
      setSubmitting(true);
      await submit(submissionData);
    },

    function reset() {
      setErrors(null);
      setResult(null);
      setSubmitting(false);
      setSucceeded(false);
    },
  ];
}
