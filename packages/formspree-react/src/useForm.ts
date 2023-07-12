import {
  type Client,
  type FieldValues,
  type SubmissionData,
  type SubmissionErrorResult,
  type SubmissionRedirectResult,
} from '@formspree/core';
import { useState } from 'react';
import type { ExtraData } from './types';
import { useSubmit } from './useSubmit';

type FormEvent = React.FormEvent<HTMLFormElement>;

type SubmitHandler<T extends FieldValues> = (
  submissionData: FormEvent | SubmissionData<T>
) => void;

type ResetFunction = () => void;

export type TUseForm<T extends FieldValues> = [
  {
    errors: SubmissionErrorResult<T> | null;
    result: SubmissionRedirectResult | null;
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
  const [errors, setErrors] = useState<SubmissionErrorResult<T> | null>(null);
  const [result, setResult] = useState<SubmissionRedirectResult | null>(null);
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
      setSucceeded(false);
    },
    onSuccess(result) {
      setErrors(null);
      setResult(result);
      setSucceeded(true);
    },
    onSettled() {
      setSubmitting(false);
    },
    origin: args.endpoint,
  });

  return [
    { result, submitting, succeeded, errors },

    function handleSubmit(submissionData) {
      setSubmitting(true);
      submit(submissionData);
    },

    function reset() {
      setErrors(null);
      setResult(null);
      setSubmitting(false);
      setSucceeded(false);
    },
  ];
}
