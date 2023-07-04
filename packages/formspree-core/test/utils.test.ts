import { appendExtraData } from '../src/utils';

describe('appendExtraData', () => {
  describe('given a plain object input', () => {
    type TestCase = {
      name: string;
      input: {
        formData: Record<string, string>;
        prop: string;
        value: string;
      };
      expected: Record<string, string>;
    };

    const testCases: TestCase[] = [
      {
        name: 'empty',
        input: {
          formData: {},
          prop: 'foo',
          value: 'bar',
        },
        expected: { foo: 'bar' },
      },
      {
        name: 'with some existing values',
        input: {
          formData: { a: '1', b: '2' },
          prop: 'foo',
          value: 'bar',
        },
        expected: { a: '1', b: '2', foo: 'bar' },
      },
      {
        name: 'with an existing value for the same prop',
        input: {
          formData: { foo: '(existing)' },
          prop: 'foo',
          value: 'bar',
        },
        expected: { foo: 'bar' },
      },
    ];

    test.each(testCases)('$name', ({ input, expected }) => {
      const { formData, prop, value } = input;
      appendExtraData(formData, prop, value);
      expect(formData).toEqual(expected);
    });
  });

  describe('given a FormData input', () => {
    type TestCase = {
      name: string;
      input: {
        formData: FormData;
        prop: string;
        value: string;
      };
      expectedEntries: [string, string][];
    };

    const testCases: TestCase[] = [
      {
        name: 'empty',
        input: {
          formData: createFormData({}),
          prop: 'foo',
          value: 'bar',
        },
        expectedEntries: [['foo', 'bar']],
      },
      {
        name: 'with some existing values',
        input: {
          formData: createFormData({ a: '1', b: '2' }),
          prop: 'foo',
          value: 'bar',
        },
        expectedEntries: [
          ['a', '1'],
          ['b', '2'],
          ['foo', 'bar'],
        ],
      },
      {
        name: 'with an existing value for the same prop',
        input: {
          formData: createFormData({ foo: '(existing)' }),
          prop: 'foo',
          value: 'bar',
        },
        expectedEntries: [
          ['foo', '(existing)'],
          ['foo', 'bar'],
        ],
      },
    ];

    test.each(testCases)('$name', ({ input, expectedEntries }) => {
      const { formData, prop, value } = input;
      appendExtraData(formData, prop, value);
      // convert FormData to an array of entries for better comparison
      expect(Array.from(formData)).toEqual(expectedEntries);
    });
  });
});

// createFormData creates a new instance of FormData and initializes it with init.
function createFormData(init: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [k, v] of Object.entries(init)) {
    formData.set(k, v);
  }
  return formData;
}
