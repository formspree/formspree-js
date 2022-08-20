import { now } from './utils';

// @ts-ignore
import { atob } from './base64';

const webdriver = (): boolean => {
  return (
    navigator.webdriver ||
    !!document.documentElement.getAttribute(atob('d2ViZHJpdmVy')) ||
    // @ts-ignore
    !!window.callPhantom ||
    // @ts-ignore
    !!window._phantom
  );
};

export class Session {
  loadedAt: number;
  webdriver: boolean;

  constructor() {
    this.loadedAt = now();
    this.webdriver = webdriver();
  }

  teardown(): void {}

  data(): {
    loadedAt: number;
    webdriver: boolean;
  } {
    return {
      loadedAt: this.loadedAt,
      webdriver: this.webdriver
    };
  }
}
