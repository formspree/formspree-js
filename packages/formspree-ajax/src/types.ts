/**
 * Configuration options for FormspreeClient
 */
export interface FormspreeClientConfig {
  /**
   * Your Formspree form ID
   */
  formId: string;

  /**
   * Optional endpoint override (defaults to Formspree's API)
   */
  endpoint?: string;
}

/**
 * Response from form submission
 */
export interface FormspreeResponse {
  ok: boolean;
  body?: any;
  errors?: any[];
}
