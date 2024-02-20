import { deepLGetUsage } from '../src/sheetsl';

describe('deepLGetUsage', () => {
  beforeEach(() => {
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        getProperty: jest.fn(() => 'SampleApiKey'),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should get usage', () => {
    global.UrlFetchApp = {
      fetch: jest.fn(() => ({
        getContentText: jest.fn(() =>
          JSON.stringify({
            character_count: 10,
            character_limit: 50,
          }),
        ),
        getResponseCode: jest.fn(() => 200), // Mock a successful response
      })),
    } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
    const usage = deepLGetUsage();
    expect(usage).toEqual({
      character_count: 10,
      character_limit: 50,
    });
  });
});
