import {
  DEEPL_API_BASE_URL_FREE,
  DEEPL_API_BASE_URL_PRO,
  getDeepLApiBaseUrl,
} from '../src/sheetsl';

const patterns = [
  {
    title: 'DeepL API Free account',
    input: 'xxxxxxxxxxx:fx',
    expectedOutput: DEEPL_API_BASE_URL_FREE,
  },
  {
    title: 'DeepL API Pro account',
    input: 'xxxxxxxxxxx',
    expectedOutput: DEEPL_API_BASE_URL_PRO,
  },
];

describe.each(patterns)(
  'getDeepLApiBaseUrl',
  ({ title, input, expectedOutput }) => {
    test(`getDeepLApiBaseUrl test: ${title}`, () => {
      expect(getDeepLApiBaseUrl(input)).toBe(expectedOutput);
    });
  }
);
