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

  it('calls initForm with config for ("form", "init", config)', () => {
    const config = { formElement: '#contact-form', formId: 'xyzabc123' };
    run('form', 'init', config);

    expect(mockedInitForm).toHaveBeenCalledTimes(1);
    expect(mockedInitForm).toHaveBeenCalledWith(config);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('handles # selector shorthand: ("form", "#selector", config)', () => {
    const config = { formId: 'abc123' };
    run('form', '#my-form', config);

    expect(mockedInitForm).toHaveBeenCalledTimes(1);
    expect(mockedInitForm).toHaveBeenCalledWith({
      formId: 'abc123',
      formElement: '#my-form',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('handles . selector shorthand: ("form", ".selector", config)', () => {
    const config = { formId: 'abc123' };
    run('form', '.contact-form', config);

    expect(mockedInitForm).toHaveBeenCalledTimes(1);
    expect(mockedInitForm).toHaveBeenCalledWith({
      formId: 'abc123',
      formElement: '.contact-form',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('shorthand overrides formElement in config', () => {
    const config = { formId: 'abc123', formElement: '#old-selector' };
    run('form', '#new-selector', config);

    expect(mockedInitForm).toHaveBeenCalledWith(
      expect.objectContaining({ formElement: '#new-selector' })
    );
  });

  it('warns on unknown resource', () => {
    run('widget', 'init', { formElement: '#f', formId: 'x' });

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown resource')
    );
  });

  it('warns on unknown action', () => {
    run('form', 'destroy', { formElement: '#f', formId: 'x' });

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown action')
    );
  });

  it('warns when second argument is not a string', () => {
    run('form', 42, { formElement: '#f', formId: 'x' });

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Second argument must be a string')
    );
  });

  it('warns when config is missing for "init" action', () => {
    run('form', 'init');

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Config object is required')
    );
  });

  it('warns when config is missing for selector shorthand', () => {
    run('form', '#my-form');

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Config object is required')
    );
  });

  it('warns when config is not an object for "init" action', () => {
    run('form', 'init', 'not-an-object');

    expect(mockedInitForm).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Config object is required')
    );
  });
});
