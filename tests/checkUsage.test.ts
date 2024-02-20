import { checkUsage } from '../src/sheetsl';

describe('checkUsage', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        getProperty: jest.fn(() => 'SampleApiKey'),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
    global.SpreadsheetApp = {
      getUi: jest.fn(() => ({
        alert: jest.fn(),
      })),
    } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should check usage without errors', () => {
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
    checkUsage();
    expect(console.error).not.toHaveBeenCalled();
  });
  it('should catch an error', () => {
    global.UrlFetchApp = {
      fetch: jest.fn(() => ({
        getContentText: jest.fn(() =>
          JSON.stringify({
            character_count: 10,
            character_limit: 50,
          }),
        ),
        getResponseCode: jest.fn(() => 500), // Mock an unsuccessful response
      })),
    } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
    checkUsage();
    expect(console.error).toHaveBeenCalled();
  });
});
