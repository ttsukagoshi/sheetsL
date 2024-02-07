import { deepLGetLanguages } from '../src/sheetsl';

describe('deepLGetLanguages', () => {
  beforeEach(() => {
    global.UrlFetchApp = {
      fetch: jest.fn(() => ({
        getContentText: jest.fn(() =>
          JSON.stringify({
            languages: [
              { language: 'EN', name: 'English', supportsFormality: true },
              { language: 'DE', name: 'German', supportsFormality: true },
            ],
          }),
        ),
        getResponseCode: jest.fn(() => 200),
      })),
    } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        getProperty: jest.fn(() => 'SampleApiKey:fx'),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should return the list of supported languages', () => {
    expect(deepLGetLanguages()).toEqual({
      languages: [
        { language: 'EN', name: 'English', supportsFormality: true },
        { language: 'DE', name: 'German', supportsFormality: true },
      ],
    });
  });
});
