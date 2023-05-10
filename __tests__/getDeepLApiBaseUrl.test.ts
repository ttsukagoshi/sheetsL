import { getDeepLApiBaseUrl } from '../src/sheetsl';

const DEEPL_API_VERSION = 'v2';
const DEEPL_API_BASE_URL_FREE = `https://api-free.deepl.com/${DEEPL_API_VERSION}/`;
const DEEPL_API_BASE_URL_PRO = `https://api.deepl.com/${DEEPL_API_VERSION}/`;

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
