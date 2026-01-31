import type { FormspreeClientConfig, FormspreeResponse } from "./types";

/**
 * FormspreeClient - A pure JavaScript client for Formspree form submissions
 */
export class FormspreeClient {
  private formId: string;
  private endpoint: string;

  constructor(config: FormspreeClientConfig) {
    this.formId = config.formId;
    this.endpoint = config.endpoint || 'https://formspree.io/f';
  }

  /**
   * Submit form data to Formspree
   */
  async submit(data: Record<string, any>): Promise<FormspreeResponse> {
    try {
      const response = await fetch(`${this.endpoint}/${this.formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const body = await response.json();

      return {
        ok: response.ok,
        body: response.ok ? body : undefined,
        errors: response.ok ? undefined : body.errors
      };
    } catch (error) {
      return {
        ok: false,
        errors: [{ message: 'Network error occurred' }]
      };
    }
  }

  /**
   * Submit a form element directly
   */
  async submitForm(formElement: HTMLFormElement): Promise<FormspreeResponse> {
    const formData = new FormData(formElement);
    const data: Record<string, any> = {};

    formData.forEach((value, key) => {
      data[key] = value;
    });

    return this.submit(data);
  }
}
