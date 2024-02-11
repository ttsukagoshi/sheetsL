import { deepLTranslate } from '../src/sheetsl';

describe('deepLTranslate', () => {
  beforeEach(() => {
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        getProperty: jest.fn(() => 'SampleApiKey:fx'),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
    global.encodeURIComponent = jest.fn(
      (text: string) => text,
    ) as unknown as typeof encodeURIComponent;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  const mockSourceObjects = [
    {
      note: 'with source language specified',
      targetLang: 'DE',
      sourceLang: 'EN-US',
      sourceText: 'Hello, World!',
      translatedText: 'Hallo, Welt!',
    },
    {
      note: 'without source language specified',
      targetLang: 'DE',
      sourceLang: null,
      sourceText: 'Hello, World!',
      translatedText: 'Hallo, Welt!',
    },
    {
      note: 'in an array of strings',
      targetLang: 'DE',
      sourceLang: null,
      sourceText: ['Hello, World!', 'Hello, World!'],
      translatedText: ['Hallo, Welt!', 'Hallo, Welt!'],
    },
  ];
  it.each(mockSourceObjects)(
    'should translate text $note',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ note, sourceLang, targetLang, sourceText, translatedText }) => {
      global.UrlFetchApp = {
        fetch: jest.fn(() => ({
          getContentText: jest.fn(() =>
            JSON.stringify({
              translations: Array.isArray(translatedText)
                ? translatedText.map((text) => ({ text: text }))
                : [{ text: translatedText }],
            }),
          ),
          getResponseCode: jest.fn(() => 200),
        })),
      } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
      const translated = deepLTranslate(sourceText, targetLang, sourceLang);
      expect(translated).toStrictEqual(
        Array.isArray(translatedText) ? translatedText : [translatedText],
      );
      expect(global.UrlFetchApp.fetch).toHaveBeenCalled();
    },
  );
  const mockSourceObjectsError = [
    {
      note: 'when source text is null',
      sourceLang: 'EN-US',
      targetLang: 'DE',
      sourceText: null,
    },
    {
      note: 'when source text is empty',
      sourceLang: 'EN-US',
      targetLang: 'DE',
      sourceText: '',
    },
  ];
  it.each(mockSourceObjectsError)(
    'should throw an error $note',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ note, sourceLang, targetLang, sourceText }) => {
      expect(() => deepLTranslate(sourceText, targetLang, sourceLang)).toThrow(
        new Error('[SheetsL] Empty input.'),
      );
    },
  );
});
