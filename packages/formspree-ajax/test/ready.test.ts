import { onReady } from '../src/ready';

describe('onReady', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('fires via setTimeout when readyState is "complete"', () => {
    jest.spyOn(document, 'readyState', 'get').mockReturnValue('complete');

    const callback = jest.fn();
    onReady(callback);

    // Should not fire synchronously
    expect(callback).not.toHaveBeenCalled();

    // Should fire after setTimeout
    jest.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('fires via setTimeout when readyState is "interactive"', () => {
    jest.spyOn(document, 'readyState', 'get').mockReturnValue('interactive');

    const callback = jest.fn();
    onReady(callback);

    expect(callback).not.toHaveBeenCalled();

    jest.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('fires on DOMContentLoaded when readyState is "loading"', () => {
    jest.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    const addEventSpy = jest.spyOn(document, 'addEventListener');

    const callback = jest.fn();
    onReady(callback);

    expect(callback).not.toHaveBeenCalled();
    expect(addEventSpy).toHaveBeenCalledWith('DOMContentLoaded', callback, {
      once: true,
    });

    // Simulate DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
