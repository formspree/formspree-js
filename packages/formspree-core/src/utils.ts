import { version } from '../package.json';
import { btoa } from './base64';
import type { SubmissionData } from './submission';

/**
 * Base-64 encodes a (JSON-castable) object.
 *
 * @param obj - The object to encode.
 */
export const encode64 = (obj: object): string => {
  return btoa(JSON.stringify(obj));
};

/**
 * Generates a client header.
 *
 * @param givenLabel
 */
export const clientHeader = (givenLabel: string | undefined): string => {
  const label = `@formspree/core@${version}`;
  if (!givenLabel) return label;
  return `${givenLabel} ${label}`;
};

export function appendExtraData(
  formData: SubmissionData,
  prop: string,
  value: string
): void {
  if (formData instanceof FormData) {
    formData.append(prop, value);
  } else {
    formData[prop] = value;
  }
}

export type UnknownObject = Record<string | number | symbol, unknown>;

export function isUnknownObject(value: unknown): value is UnknownObject {
  return value !== null && typeof value === 'object';
}
