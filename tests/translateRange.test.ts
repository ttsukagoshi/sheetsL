import { translateRange } from '../src/sheetsl';

describe('translateRange', () => {
  beforeEach(() => {
    global.PropertiesService = {
      // Mock getDeepLApiKey()
      getUserProperties: jest.fn(() => ({
        getProperty: jest.fn(() => 'mockApiKey'),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
    global.Utilities = {
      // Mock the newBlob() method for splitLongArray()
      newBlob: jest.fn(() => ({
        getBytes: jest.fn(() => []),
      })),
    } as unknown as GoogleAppsScript.Utilities.Utilities;
    global.UrlFetchApp = {
      fetch: jest.fn(() => ({
        // Mock the response for deepLTranslate()
        getContentText: jest.fn(() =>
          JSON.stringify({
            translations: [
              { text: 'カラム 1' },
              { text: 'カラム 2' },
              { text: 'カラム 3' },
              { text: '行 1-1' },
              { text: '行 1-2' },
              { text: '行 1-3' },
              { text: '行 2-1' },
              { text: '行 2-2' },
              { text: '行 2-3' },
              { text: '行 3-1' },
              { text: '行 3-2' },
              { text: '行 3-3' },
            ],
          }),
        ),
        getResponseCode: jest.fn(() => 200), // Mock the response code for handleDeepLErrors
      })),
    } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should return the translated 2-dimensional array of strings', () => {
    const mockSourceTextArray = [
      ['Column 1', 'Column 2', 'Column 3'],
      ['Row 1-1', 'Row 1-2', 'Row 1-3'],
      ['Row 2-1', 'Row 2-2', 'Row 2-3'],
      ['Row 3-1', 'Row 3-2', 'Row 3-3'],
    ];
    const mockTargetLocale = 'JA';
    const mockTranslatedTextArray = [
      ['カラム 1', 'カラム 2', 'カラム 3'],
      ['行 1-1', '行 1-2', '行 1-3'],
      ['行 2-1', '行 2-2', '行 2-3'],
      ['行 3-1', '行 3-2', '行 3-3'],
    ];
    expect(translateRange(mockSourceTextArray, mockTargetLocale)).toEqual(
      mockTranslatedTextArray,
    );
  });
});
