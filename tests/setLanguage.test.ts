import { setLanguage } from '../src/sheetsl';

describe('setLanguage', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should set the language', () => {
    global.SpreadsheetApp = {
      getUi: jest.fn(() => ({
        Button: { OK: 'ok' },
        ButtonSet: { OK_CANCEL: 'ok_cancel' },
        prompt: jest
          .fn()
          .mockReturnValueOnce({
            // prompt for source language
            getSelectedButton: jest.fn(() => 'ok'),
            getResponseText: jest.fn(() => 'EN'),
          })
          .mockReturnValueOnce({
            // prompt for target language
            getSelectedButton: jest.fn(() => 'ok'),
            getResponseText: jest.fn(() => 'DE'),
          }) as unknown as GoogleAppsScript.Base.PromptResponse,
        alert: jest.fn(),
      })),
    } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        getProperties: jest.fn(() => ({})), // No existing settings
        getProperty: jest.fn(() => 'Sample-API-Key:fx'),
        setProperties: jest.fn(),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
    global.UrlFetchApp = {
      fetch: jest
        .fn()
        .mockReturnValueOnce({
          // deepLGetLanguages('source')
          getContentText: jest.fn(() =>
            JSON.stringify([
              { language: 'EN', name: 'English' },
              { language: 'DE', name: 'German' },
            ]),
          ),
          getResponseCode: jest.fn(() => 200),
        })
        .mockReturnValueOnce({
          // deepLGetLanguages('target')
          getContentText: jest.fn(() =>
            JSON.stringify([
              { language: 'EN-US', name: 'English (US)' },
              { language: 'DE', name: 'German' },
            ]),
          ),
          getResponseCode: jest.fn(() => 200),
        }),
    } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
    setLanguage();
    expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(2);
    expect(console.error).not.toHaveBeenCalled();
  });
  describe('should catch an error', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('when the user cancels the language setup after notification of existing settings', () => {
      global.SpreadsheetApp = {
        getUi: jest.fn(() => ({
          Button: { YES: 'yes' },
          ButtonSet: { YES_NO: 'yes_no' },
          prompt: jest.fn(),
          alert: jest.fn(() => 'no'), // cancel the setup
        })),
      } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
      global.PropertiesService = {
        getUserProperties: jest.fn(() => ({
          getProperties: jest.fn(() => ({
            targetLocale: 'DE', // existing settings
          })),
        })),
      } as unknown as GoogleAppsScript.Properties.PropertiesService;
      global.UrlFetchApp = {
        fetch: jest.fn(),
      } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
      setLanguage();
      expect(global.UrlFetchApp.fetch).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Error: \[SheetsL\] Canceled: Language setting has been canceled.\n/,
        ),
      );
    });
    it('when the user cancels the language setup after prompted to enter source locale', () => {
      global.SpreadsheetApp = {
        getUi: jest.fn(() => ({
          Button: { OK: 'ok' },
          ButtonSet: { OK_CANCEL: 'ok_cancel' },
          prompt: jest.fn().mockReturnValueOnce({
            // prompt for source language
            getSelectedButton: jest.fn(() => 'cancel'), // cancel the setup after prompted to enter source locale
            getResponseText: jest.fn(() => 'EN'),
          }) as unknown as GoogleAppsScript.Base.PromptResponse,
          alert: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
      global.PropertiesService = {
        getUserProperties: jest.fn(() => ({
          getProperties: jest.fn(() => ({})), // No existing settings
          getProperty: jest.fn(() => 'Sample-API-Key:fx'),
          setProperties: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Properties.PropertiesService;
      global.UrlFetchApp = {
        fetch: jest
          .fn()
          .mockReturnValueOnce({
            // deepLGetLanguages('source')
            getContentText: jest.fn(() =>
              JSON.stringify([
                { language: 'EN', name: 'English' },
                { language: 'DE', name: 'German' },
              ]),
            ),
            getResponseCode: jest.fn(() => 200),
          })
          .mockReturnValueOnce({
            // deepLGetLanguages('target')
            getContentText: jest.fn(() =>
              JSON.stringify([
                { language: 'EN-US', name: 'English (US)' },
                { language: 'DE', name: 'German' },
              ]),
            ),
            getResponseCode: jest.fn(() => 200),
          }),
      } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
      setLanguage();
      expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Error: \[SheetsL\] Canceled: Language setting has been canceled.\n/,
        ),
      );
    });
    it('when the user enters a value not included in the list of available source languages', () => {
      global.SpreadsheetApp = {
        getUi: jest.fn(() => ({
          Button: { OK: 'ok' },
          ButtonSet: { OK_CANCEL: 'ok_cancel' },
          prompt: jest.fn().mockReturnValueOnce({
            // prompt for source language
            getSelectedButton: jest.fn(() => 'ok'),
            getResponseText: jest.fn(() => 'JA'), // a source locale that is not included in the response value of deepLGetLanguages('source')
          }) as unknown as GoogleAppsScript.Base.PromptResponse,
          alert: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
      global.PropertiesService = {
        getUserProperties: jest.fn(() => ({
          getProperties: jest.fn(() => ({})), // No existing settings
          getProperty: jest.fn(() => 'Sample-API-Key:fx'),
          setProperties: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Properties.PropertiesService;
      global.UrlFetchApp = {
        fetch: jest
          .fn()
          .mockReturnValueOnce({
            // deepLGetLanguages('source')
            getContentText: jest.fn(() =>
              JSON.stringify([
                { language: 'EN', name: 'English' },
                { language: 'DE', name: 'German' },
              ]),
            ),
            getResponseCode: jest.fn(() => 200),
          })
          .mockReturnValueOnce({
            // deepLGetLanguages('target')
            getContentText: jest.fn(() =>
              JSON.stringify([
                { language: 'EN-US', name: 'English (US)' },
                { language: 'DE', name: 'German' },
              ]),
            ),
            getResponseCode: jest.fn(() => 200),
          }),
      } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
      setLanguage();
      expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Error: \[SheetsL\] Invalid Value \(JA\): Enter a valid value.\n/,
        ),
      );
    });
    it('when the user cancels the language setup after prompted to enter target locale', () => {
      global.SpreadsheetApp = {
        getUi: jest.fn(() => ({
          Button: { OK: 'ok' },
          ButtonSet: { OK_CANCEL: 'ok_cancel' },
          prompt: jest
            .fn()
            .mockReturnValueOnce({
              // prompt for source language
              getSelectedButton: jest.fn(() => 'ok'),
              getResponseText: jest.fn(() => 'EN'),
            })
            .mockReturnValueOnce({
              // prompt for target language
              getSelectedButton: jest.fn(() => 'cancel'), // cancel the setup after prompted to enter target locale
              getResponseText: jest.fn(() => 'DE'),
            }) as unknown as GoogleAppsScript.Base.PromptResponse,
          alert: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
      global.PropertiesService = {
        getUserProperties: jest.fn(() => ({
          getProperties: jest.fn(() => ({})), // No existing settings
          getProperty: jest.fn(() => 'Sample-API-Key:fx'),
          setProperties: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Properties.PropertiesService;
      global.UrlFetchApp = {
        fetch: jest
          .fn()
          .mockReturnValueOnce({
            // deepLGetLanguages('source')
            getContentText: jest.fn(() =>
              JSON.stringify([
                { language: 'EN', name: 'English' },
                { language: 'DE', name: 'German' },
              ]),
            ),
            getResponseCode: jest.fn(() => 200),
          })
          .mockReturnValueOnce({
            // deepLGetLanguages('target')
            getContentText: jest.fn(() =>
              JSON.stringify([
                { language: 'EN-US', name: 'English (US)' },
                { language: 'DE', name: 'German' },
              ]),
            ),
            getResponseCode: jest.fn(() => 200),
          }),
      } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
      setLanguage();
      expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Error: \[SheetsL\] Canceled: Language setting has been canceled.\n/,
        ),
      );
    });
    it('when the user enters a value not included in the list of available source languages', () => {
      global.SpreadsheetApp = {
        getUi: jest.fn(() => ({
          Button: { OK: 'ok' },
          ButtonSet: { OK_CANCEL: 'ok_cancel' },
          prompt: jest
            .fn()
            .mockReturnValueOnce({
              // prompt for source language
              getSelectedButton: jest.fn(() => 'ok'),
              getResponseText: jest.fn(() => 'DE'),
            })
            .mockReturnValueOnce({
              // prompt for target language
              getSelectedButton: jest.fn(() => 'ok'),
              getResponseText: jest.fn(() => 'JA'), // a target locale that is not included in the response value of deepLGetLanguages('target')
            }) as unknown as GoogleAppsScript.Base.PromptResponse,
          alert: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
      global.PropertiesService = {
        getUserProperties: jest.fn(() => ({
          getProperties: jest.fn(() => ({})), // No existing settings
          getProperty: jest.fn(() => 'Sample-API-Key:fx'),
          setProperties: jest.fn(),
        })),
      } as unknown as GoogleAppsScript.Properties.PropertiesService;
      global.UrlFetchApp = {
        fetch: jest
          .fn()
          .mockReturnValueOnce({
            // deepLGetLanguages('source')
            getContentText: jest.fn(() =>
              JSON.stringify([
                { language: 'EN', name: 'English' },
                { language: 'DE', name: 'German' },
              ]),
            ),
            getResponseCode: jest.fn(() => 200),
          })
          .mockReturnValueOnce({
            // deepLGetLanguages('target')
            getContentText: jest.fn(() =>
              JSON.stringify([
                { language: 'EN-US', name: 'English (US)' },
                { language: 'DE', name: 'German' },
              ]),
            ),
            getResponseCode: jest.fn(() => 200),
          }),
      } as unknown as GoogleAppsScript.URL_Fetch.UrlFetchApp;
      setLanguage();
      expect(global.UrlFetchApp.fetch).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Error: \[SheetsL\] Invalid Value \(JA\): Enter a valid value.\n/,
        ),
      );
    });
  });
});
