import { Session } from '../src/session';

describe('Session', () => {
  const now = Date.now();

  beforeEach(() => {
    jest.useFakeTimers({ now });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('with webdriver', () => {
    beforeEach(() => {
      // pretend running in PhantomJS
      window._phantom = {};
    });

    afterEach(() => {
      window._phantom = undefined;
    });

    it('returns the correct data', () => {
      const sess = new Session();
      expect(sess.data()).toEqual({
        loadedAt: now,
        webdriver: true,
      });
    });
  });

  describe('without webdriver', () => {
    it('returns the correct data', () => {
      const sess = new Session();
      expect(sess.data()).toEqual({
        loadedAt: now,
        webdriver: false,
      });
    });
  });
});
