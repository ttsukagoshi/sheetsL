import { setDeeplApiKey } from '../src/sheetsl';

describe('setDeeplApiKey', () => {
  beforeAll(() => {
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        setProperty: jest.fn(),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should successfully save the DeepL API key', () => {
    class MockUi {
      ButtonSet = { OK_CANCEL: 'ok_cancel' };
      Button = { OK: 'ok' };
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {}
      prompt: jest.Mock = jest.fn(
        () =>
          ({
            getSelectedButton: () => 'ok',
            getResponseText: () => 'Sample-API-key:fx',
          }) as unknown as GoogleAppsScript.Base.PromptResponse,
      );
      alert: jest.Mock = jest.fn();
    }
    global.SpreadsheetApp = {
      getUi: jest.fn(() => new MockUi() as unknown as GoogleAppsScript.Base.Ui),
    } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
    setDeeplApiKey();
    expect(SpreadsheetApp.getUi).toHaveBeenCalled();
    expect(PropertiesService.getUserProperties).toHaveBeenCalled();
  });
  it('should catch an error if the user cancels the prompt', () => {
    class MockUi {
      ButtonSet = { OK_CANCEL: 'ok_cancel' };
      Button = { OK: 'ok' };
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {}
      prompt: jest.Mock = jest.fn(
        () =>
          ({
            getSelectedButton: () => 'cancel',
            getResponseText: () => null,
          }) as unknown as GoogleAppsScript.Base.PromptResponse,
      );
      alert: jest.Mock = jest.fn();
    }
    global.SpreadsheetApp = {
      getUi: jest.fn(() => new MockUi() as unknown as GoogleAppsScript.Base.Ui),
    } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {});
    setDeeplApiKey();
    expect(SpreadsheetApp.getUi).toHaveBeenCalled();
    expect(PropertiesService.getUserProperties).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
