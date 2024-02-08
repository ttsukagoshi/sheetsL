import { translateRange } from '../src/sheetsl';

describe('translateRange', () => {
  beforeEach(() => {
    global.UrlFetchApp = {
      fetch: jest.fn(() => ({
        getContentText: jest.fn(
          () => JSON.stringify({ translations: [{ text: 'Hallo, Welt!' }] }), // mock deepLTranslate
        ),
        getResponseCode: jest.fn(() => 200), // mock handleDeepLErrors() to not throw errors
      })),
    } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should translate the selected range without errors', () => {
    const mockSelectedRangeValues = [
      ['Hello, world!', 'Hello, world!'],
      ['Hello, world!', ''], // empty cell
      ['Hello, world!', 12345], // non-string cell
    ];
    global.SpreadsheetApp = {
      getActiveSpreadsheet: jest.fn(() => ({
        getActiveSheet: jest.fn(() => ({
          getActiveRange: jest.fn(() => ({
            getValues: jest.fn(() => mockSelectedRangeValues),
            getRow: jest.fn(() => 1),
            getColumn: jest.fn(() => 1),
            getNumRows: jest.fn(() => mockSelectedRangeValues.length),
            getNumColumns: jest.fn(() => mockSelectedRangeValues[0].length),
          })),
          getRange: jest.fn(() => ({
            isBlank: jest.fn(() => true), // mock target range is blank
            setValues: jest.fn(),
          })),
        })),
      })),
      getUi: jest.fn(() => ({
        ButtonSet: {
          OK_CANCEL: 'ok_cancel',
        },
        alert: jest.fn(),
      })),
    } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        getProperties: jest.fn(() => ({
          targetLocale: 'DE', // mock target locale set
        })),
        getProperty: jest.fn((key) => {
          if (key === 'deeplApiKey') return 'Sample-API-key'; // mock getDeepLApiKey()
          return null;
        }),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
    global.Utilities = {
      newBlob: jest.fn(() => ({
        getBytes: jest.fn(() => [0, 1, 2, 3]), // mock blob < THRESHOLD_BYTES (1900)
      })),
      sleep: jest.fn(),
    } as unknown as GoogleAppsScript.Utilities.Utilities;
    translateRange();
    expect(global.Utilities.sleep).toHaveBeenCalledTimes(5);
    expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(5);
    expect(console.error).not.toHaveBeenCalled();
  });
  describe('should catch errors', () => {
    it('when target locale is not set in user properties', () => {
      const mockSelectedRangeValues = [
        ['Hello, world!', 'Hello, world!'],
        ['Hello, world!', ''], // empty cell
        ['Hello, world!', 12345], // non-string cell
      ];
      global.SpreadsheetApp = {
        getActiveSpreadsheet: jest.fn(() => ({
          getActiveSheet: jest.fn(() => ({
            getActiveRange: jest.fn(() => ({
              getValues: jest.fn(() => mockSelectedRangeValues),
              getRow: jest.fn(() => 1),
              getColumn: jest.fn(() => 1),
              getNumRows: jest.fn(() => mockSelectedRangeValues.length),
              getNumColumns: jest.fn(() => mockSelectedRangeValues[0].length),
            })),
          })),
        })),
        getUi: jest.fn(() => ({
          alert: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
      global.PropertiesService = {
        getUserProperties: jest.fn(() => ({
          getProperties: jest.fn(() => ({})), // mock target locale NOT set
        })),
      } as unknown as GoogleAppsScript.Properties.PropertiesService;
      translateRange();
      expect(global.Utilities.sleep).not.toHaveBeenCalled();
      expect(global.UrlFetchApp.fetch).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Error: \[SheetsL\] Target Language Unavailable: Set the target language in Settings > Set Language of the add-on menu.\n/,
        ),
      );
    });
    it('when cell(s) are not selected', () => {
      global.SpreadsheetApp = {
        getActiveSpreadsheet: jest.fn(() => ({
          getActiveSheet: jest.fn(() => ({
            getActiveRange: jest.fn(() => null), // mock no active range
          })),
        })),
        getUi: jest.fn(() => ({
          alert: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
      global.PropertiesService = {
        getUserProperties: jest.fn(() => ({
          getProperties: jest.fn(() => ({
            targetLocale: 'DE', // mock target locale set
          })),
        })),
      } as unknown as GoogleAppsScript.Properties.PropertiesService;
      translateRange();
      expect(global.Utilities.sleep).not.toHaveBeenCalled();
      expect(global.UrlFetchApp.fetch).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Error: \[SheetsL\] Select cells to translate.\n/,
        ),
      );
    });
    it('when target range is not blank and the user cancels the process', () => {
      const mockSelectedRangeValues = [
        ['Hello, world!', 'Hello, world!'],
        ['Hello, world!', ''], // empty cell
        ['Hello, world!', 12345], // non-string cell
      ];
      global.SpreadsheetApp = {
        getActiveSpreadsheet: jest.fn(() => ({
          getActiveSheet: jest.fn(() => ({
            getActiveRange: jest.fn(() => ({
              getValues: jest.fn(() => mockSelectedRangeValues),
              getRow: jest.fn(() => 1),
              getColumn: jest.fn(() => 1),
              getNumRows: jest.fn(() => mockSelectedRangeValues.length),
              getNumColumns: jest.fn(() => mockSelectedRangeValues[0].length),
            })),
            getRange: jest.fn(() => ({
              isBlank: jest.fn(() => false), // mock target range is NOT blank
              setValues: jest.fn(),
            })),
          })),
        })),
        getUi: jest.fn(() => ({
          ButtonSet: {
            OK_CANCEL: 'ok_cancel',
          },
          Button: {
            OK: 'ok',
          },
          alert: jest.fn().mockReturnValueOnce('cancel'), // mock user cancel of the process
        })),
      } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
      global.PropertiesService = {
        getUserProperties: jest.fn(() => ({
          getProperties: jest.fn(() => ({
            targetLocale: 'DE', // mock target locale set
          })),
          getProperty: jest.fn((key) => {
            if (key === 'deeplApiKey') return 'Sample-API-key:fx'; // mock getDeepLApiKey()
            return null;
          }),
        })),
      } as unknown as GoogleAppsScript.Properties.PropertiesService;
      global.Utilities = {
        newBlob: jest.fn(() => ({
          getBytes: jest.fn(() => [0, 1, 2, 3]), // mock blob < THRESHOLD_BYTES (1900)
        })),
        sleep: jest.fn(),
      } as unknown as GoogleAppsScript.Utilities.Utilities;
      translateRange();
      expect(global.Utilities.sleep).not.toHaveBeenCalled();
      expect(global.UrlFetchApp.fetch).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/^Error: \[SheetsL\] Translation canceled.\n/),
      );
    });
    it('when a given text has a byte length that is larger than the threshold ', () => {
      const mockSelectedRangeValues = [
        ['Hello, world!', 'Hello, world!'],
        ['Hello, world!', ''], // empty cell
        ['Hello, world!', 12345], // non-string cell
      ];
      global.SpreadsheetApp = {
        getActiveSpreadsheet: jest.fn(() => ({
          getActiveSheet: jest.fn(() => ({
            getActiveRange: jest.fn(() => ({
              getValues: jest.fn(() => mockSelectedRangeValues),
              getRow: jest.fn(() => 1),
              getColumn: jest.fn(() => 1),
              getNumRows: jest.fn(() => mockSelectedRangeValues.length),
              getNumColumns: jest.fn(() => mockSelectedRangeValues[0].length),
            })),
            getRange: jest.fn(() => ({
              isBlank: jest.fn(() => true), // mock target range is blank
              setValues: jest.fn(),
            })),
          })),
        })),
        getUi: jest.fn(() => ({
          ButtonSet: {
            OK_CANCEL: 'ok_cancel',
          },
          alert: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
      global.PropertiesService = {
        getUserProperties: jest.fn(() => ({
          getProperties: jest.fn(() => ({
            targetLocale: 'DE', // mock target locale set
          })),
          getProperty: jest.fn((key) => {
            if (key === 'deeplApiKey') return 'Sample-API-key:fx'; // mock getDeepLApiKey()
            return null;
          }),
        })),
      } as unknown as GoogleAppsScript.Properties.PropertiesService;
      global.Utilities = {
        newBlob: jest.fn(() => ({
          getBytes: jest.fn(() => new Array(2000) as number[]), // mock blob > THRESHOLD_BYTES (1900)
        })),
        sleep: jest.fn(),
      } as unknown as GoogleAppsScript.Utilities.Utilities;
      translateRange();
      expect(global.Utilities.sleep).not.toHaveBeenCalled();
      expect(global.UrlFetchApp.fetch).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Error: \[SheetsL\] Cell content length exceeds Google's limits. Please consider splitting the content into multiple cells./,
        ),
      );
    });
  });
});
