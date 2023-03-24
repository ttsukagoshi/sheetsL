import {
  ADDON_NAME,
  DEEPL_API_BASE_URL_FREE,
  deepLTranslate,
  deepLGetLanguages,
} from '../src/sheetsl';

const translationUrl = DEEPL_API_BASE_URL_FREE + 'translate';
const getLanguageUrl = DEEPL_API_BASE_URL_FREE + 'languages';
const mockApiKey = 'apiKeyString:fx';

PropertiesService.getUserProperties = jest.fn(() => ({
  getProperty: jest.fn(() => mockApiKey),
})) as any;

UrlFetchApp.fetch = jest.fn((url: string, options: UrlFetchAppOptions) => ({
  _options: options,
  getResponseCode: jest.fn((): number => 200),
  getContentText: jest.fn((text: string = url) => {
    // Switch the returning value of the mock function for UrlFetchApp.fetch
    // depending on the input URL.
    if (text.startsWith(translationUrl)) {
      // URL with the endpoint of DeepL API translation will return
      // a stringified object of type DeepLTranslationResponse
      return JSON.stringify({
        translations: [
          {
            detected_source_language: 'JA',
            text: text,
          },
        ],
      });
    } else if (text.startsWith(getLanguageUrl)) {
    }
  }),
})) as any;

type UrlFetchAppOptions = {
  muteHttpExceptions: boolean;
};

type DeepLTranslatePattern = {
  title: string;
  input: DeepLTranslatePatternInput;
  expectedOutput: string[];
};

type DeepLTranslatePatternInput = {
  sourceText: string | string[];
  sourceLocale: string | null | undefined;
  targetLocale: string;
};

const deepLTranslatePatterns: DeepLTranslatePattern[] = [
  {
    title: 'sourceText as string',
    input: {
      sourceText: 'text to translate',
      sourceLocale: 'JA',
      targetLocale: 'EN-US',
    },
    expectedOutput: [
      `${translationUrl}?auth_key=${mockApiKey}&target_lang=EN-US&text=${encodeURIComponent(
        'text to translate'
      )}&source_lang=JA`,
    ],
  },
  {
    title: 'sourceText as an array of strings',
    input: {
      sourceText: [
        'text to translate 1',
        'text to translate 2',
        'text to translate 3',
      ],
      sourceLocale: 'JA',
      targetLocale: 'EN-US',
    },
    expectedOutput: [
      `${translationUrl}?auth_key=${mockApiKey}&target_lang=EN-US&text=${encodeURIComponent(
        'text to translate 1'
      )}&text=${encodeURIComponent(
        'text to translate 2'
      )}&text=${encodeURIComponent('text to translate 3')}&source_lang=JA`,
    ],
  },
];

const deepLTranslatePatternsWithErrors: DeepLTranslatePattern[] = [
  {
    title: 'Empty sourceText',
    input: {
      sourceText: '',
      sourceLocale: 'JA',
      targetLocale: 'EN-US',
    },
    expectedOutput: ['returns an error'],
  },
];

const deepLGetLanguagePatterns = [];

describe.each(deepLTranslatePatterns)(
  'deepLTranslate',
  ({ title, input, expectedOutput }) => {
    test(`deepLTranslate test: ${title}`, () => {
      expect(
        deepLTranslate(input.sourceText, input.sourceLocale, input.targetLocale)
      ).toEqual(expectedOutput);
    });
  }
);

// Error patterns in deepLTranslate
describe.each(deepLTranslatePatternsWithErrors)(
  'deepLTranslate Errors',
  ({ title, input, expectedOutput }) => {
    test(`deepLTranslate error test: ${title}`, () => {
      expect(() => {
        deepLTranslate(
          input.sourceText,
          input.sourceLocale,
          input.targetLocale
        );
      }).toThrowError(new Error(`[${ADDON_NAME}] Empty input.`));
    });
  }
);
