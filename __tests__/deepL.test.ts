// Jest tests for deepLTranslate() and deepLGetLanguages()

import {
  deepLTranslate,
  deepLGetLanguages,
  DeepLSupportedLanguages,
  DeepLLanguageType,
} from '../src/sheetsl';

const ADDON_NAME = 'SheetsL';
const DEEPL_API_BASE_URL_FREE = 'https://api-free.deepl.com/v2/';
const translateUrl = DEEPL_API_BASE_URL_FREE + 'translate';
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
    if (text.startsWith(translateUrl)) {
      // URL with the endpoint of DeepL API translation will return
      // a stringified object of type DeepLTranslationResponse
      return JSON.stringify({
        translations: [
          {
            detected_source_language: 'JA',
            text: text, // This mock translated text will return the string of the input URL for UrlFetchApp.fetch
          },
        ],
      });
    } else if (text.startsWith(getLanguageUrl)) {
      // URL with the endpoint of DeepL API to retrieve the list of supported languages
      // will return a stringified list of type DeepLSupportedLanguages objects.
      return JSON.stringify([
        {
          language: 'EN-US',
          name: 'English (American)',
          supports_formality: false,
        },
        {
          language: 'JA',
          name: 'Japanese',
          supports_formality: false,
        },
        {
          language: 'MOCK',
          name: text, // This mock language will return the string of the input URL for UrlFetchApp.fetch
          supports_formality: true,
        },
      ]);
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

type DeepLGetLanguages = {
  title: string;
  input: DeepLLanguageType;
  expectedOutput: DeepLSupportedLanguages[];
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
      `${translateUrl}?auth_key=${mockApiKey}&target_lang=EN-US&text=${encodeURIComponent(
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
      `${translateUrl}?auth_key=${mockApiKey}&target_lang=EN-US&text=${encodeURIComponent(
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

const deepLGetLanguagesPatterns: DeepLGetLanguages[] = [
  {
    title: 'type = source',
    input: 'source',
    expectedOutput: [
      {
        language: 'EN-US',
        name: 'English (American)',
        supports_formality: false,
      },
      {
        language: 'JA',
        name: 'Japanese',
        supports_formality: false,
      },
      {
        language: 'MOCK',
        name: `${getLanguageUrl}?auth_key=${mockApiKey}&type=source`,
        supports_formality: true,
      },
    ],
  },
  {
    title: 'type = target',
    input: 'target',
    expectedOutput: [
      {
        language: 'EN-US',
        name: 'English (American)',
        supports_formality: false,
      },
      {
        language: 'JA',
        name: 'Japanese',
        supports_formality: false,
      },
      {
        language: 'MOCK',
        name: `${getLanguageUrl}?auth_key=${mockApiKey}&type=target`,
        supports_formality: true,
      },
    ],
  },
];

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
  ({ title, input }) => {
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

describe.each(deepLGetLanguagesPatterns)(
  'deepLGetLanguages',
  ({ title, input, expectedOutput }) => {
    test(`deepLGetLanguages test: ${title}`, () => {
      expect(deepLGetLanguages(input)).toEqual(expectedOutput);
    });
  }
);
