import { atob } from './base64';

/**
 * Check whether the user agent is controlled by an automation.
 */
const webdriver = (): boolean => {
  return (
    navigator.webdriver ||
    !!document.documentElement.getAttribute(atob('d2ViZHJpdmVy')) ||
    !!window.callPhantom ||
    !!window._phantom
  );
};

export class Session {
  private readonly loadedAt: number;
  private readonly webdriver: boolean;

  constructor() {
    this.loadedAt = Date.now();
    this.webdriver = webdriver();
  }

  data(): {
    loadedAt: number;
    webdriver: boolean;
  } {
    return {
      loadedAt: this.loadedAt,
      webdriver: this.webdriver,
    };
  }
}
