import { deleteDeeplApiKey } from '../src/sheetsl';

describe('deleteDeeplApiKey', () => {
  beforeEach(() => {
    class MockUi {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {}
      alert: jest.Mock = jest.fn();
    }
    global.SpreadsheetApp = {
      getUi: jest.fn(() => new MockUi() as unknown as GoogleAppsScript.Base.Ui),
    } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should successfully delete the DeepL API key', () => {
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        deleteProperty: jest.fn(),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
    deleteDeeplApiKey();
    expect(PropertiesService.getUserProperties).toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });
  it('should catch an error if something went wrong', () => {
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        deleteProperty: jest.fn(() => {
          throw new Error('Test error');
        }),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
    deleteDeeplApiKey();
    expect(PropertiesService.getUserProperties).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
