import { toCamel, camelizeTopKeys } from '../src/utils';

describe('toCamel', () => {
  it('converts snake case to camel', () => {
    expect(toCamel('first_name')).toBe('firstName');
  });

  it('converts kebab case to camel', () => {
    expect(toCamel('first-name')).toBe('firstName');
  });

  it('does not change camel case', () => {
    expect(toCamel('firstName')).toBe('firstName');
  });
});

describe('camelizeTopKeys', () => {
  it('converts top-level keys to camel case', () => {
    expect(
      camelizeTopKeys({ first_name: { first_letter: 'B' } })
    ).toStrictEqual({
      firstName: { first_letter: 'B' }
    });
  });
});
