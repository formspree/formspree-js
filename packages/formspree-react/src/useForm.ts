import {
  isSubmissionError,
  type Client,
  type FieldValues,
  type SubmissionError,
  type SubmissionSuccess,
} from '@formspree/core';
import { useState } from 'react';
import type { ExtraData, SubmitHandler } from './types';
import { useSubmit } from './useSubmit';

type ResetFunction = () => void;

export type TUseForm<T extends FieldValues> = [
  {
    errors: SubmissionError<T> | null;
    result: SubmissionSuccess | null;
    submitting: boolean;
    succeeded: boolean;
  },
  SubmitHandler<T, void>,
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
    origin: args.endpoint,
  });

  return [
    { errors, result, submitting, succeeded },

    async function handleSubmit(submissionData) {
      setSubmitting(true);
      const result = await submit(submissionData);
      setSubmitting(false);
      if (isSubmissionError(result)) {
        setErrors(result);
        setSucceeded(false);
      } else {
        setErrors(null);
        setResult(result);
        setSucceeded(true);
      }
    },

    function reset() {
      setErrors(null);
      setResult(null);
      setSubmitting(false);
      setSucceeded(false);
    },
  ];
}
