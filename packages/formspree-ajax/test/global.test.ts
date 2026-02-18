const mockRun = jest.fn();

jest.mock('../src/run', () => ({
  run: mockRun,
}));

describe('global', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRun.mockClear();
    delete (window as unknown as Record<string, unknown>).formspree;
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).formspree;
    jest.useRealTimers();
    jest.resetModules();
  });

  it('flushes queued calls after load', () => {
    // Simulate the inline stub
    const stub = (...args: unknown[]) => {
      (stub.q = stub.q || []).push(args);
    };
    stub.q = [] as unknown[][];
    (window as unknown as Record<string, unknown>).formspree = stub;

    // Queue a call before load
    stub('initForm', { formElement: '#queued-form', formId: 'abc' });
    expect(stub.q).toHaveLength(1);

    // Load the global module
    require('../src/global');

    // onReady uses setTimeout when DOM is already ready, so flush timers
    jest.runAllTimers();

    // The queued call should have been flushed via run()
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun).toHaveBeenCalledWith('initForm', {
      formElement: '#queued-form',
      formId: 'abc',
    });
  });

  it('direct calls after load work immediately', () => {
    require('../src/global');
    jest.runAllTimers();

    // Call directly after library has loaded
    window.formspree('initForm', {
      formElement: '#direct-form',
      formId: 'def',
    });

    expect(mockRun).toHaveBeenCalledWith('initForm', {
      formElement: '#direct-form',
      formId: 'def',
    });
  });

  it('works when no stub existed before load', () => {
    // No stub on window - just load the module
    require('../src/global');
    jest.runAllTimers();

    expect(typeof window.formspree).toBe('function');
    // No queued calls, so run should not have been called
    expect(mockRun).not.toHaveBeenCalled();

    window.formspree('initForm', {
      formElement: '#new-form',
      formId: 'ghi',
    });

    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
