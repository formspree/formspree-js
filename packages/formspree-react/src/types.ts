/**
 * ExtraData values can be strings or functions that return a string, or a
 * promise that resolves to a string. Errors should be handled internally.
 * Functions can return undefined to skip this ExtraData value.
 */
export type ExtraDataValue =
  | undefined
  | string
  | (() => string)
  | (() => Promise<string>)
  | (() => undefined)
  | (() => Promise<undefined>);

export type ExtraData = {
  [key: string]: ExtraDataValue;
};
