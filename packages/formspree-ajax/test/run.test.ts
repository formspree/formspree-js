import { run } from '../src/run';
import { initForm } from '../src/form';

jest.mock('../src/form', () => ({
  initForm: jest.fn(),
}));

const mockedInitForm = initForm as jest.MockedFunction<typeof initForm>;

describe('run', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('calls initForm with a valid config', () => {
    const config = { formElement: '#contact-form', formId: 'xyzabc123' };
    run(config);

    expect(mockedInitForm).toHaveBeenCalledTimes(1);
    expect(mockedInitForm).toHaveBeenCalledWith(config);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('passes through extra config properties', () => {
    const config = {
      formElement: '#contact-form',
      formId: 'abc123',
      debug: true,
      fields: { email: { prettyName: 'Email' } },
    };
    run(config);

    expect(mockedInitForm).toHaveBeenCalledWith(config);
  });

  it('warns when config is not provided', () => {
    run(undefined);

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('config object is required')
    );
  });

  it('warns when config is not an object', () => {
    run('not-an-object');

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('config object is required')
    );
  });

  it('warns when formElement is missing', () => {
    run({ formId: 'abc123' });

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"formElement" is required')
    );
  });

  it('warns when formId is missing', () => {
    run({ formElement: '#my-form' });

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"formId" is required')
    );
  });

  it('warns when config is null', () => {
    run(null);

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('config object is required')
    );
  });
});
