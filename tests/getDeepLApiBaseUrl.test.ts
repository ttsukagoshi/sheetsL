import { getDeepLApiBaseUrl } from '../src/sheetsl';

const patterns = [
  {
    title: 'DeepL API Free account',
    input: 'xxxxxxxxxxx:fx',
    expectedOutput: 'https://api-free.deepl.com/v2/',
  },
  {
    title: 'DeepL API Pro account',
    input: 'xxxxxxxxxxx',
    expectedOutput: 'https://api.deepl.com/v2/',
  },
];

describe.each(patterns)(
  'getDeepLApiBaseUrl',
  ({ title, input, expectedOutput }) => {
    test(`getDeepLApiBaseUrl test: ${title}`, () => {
      expect(getDeepLApiBaseUrl(input)).toBe(expectedOutput);
    });
  },
);
