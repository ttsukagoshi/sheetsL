import { onInstall } from '../src/sheetsl';

class MockUi {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  createAddonMenu: jest.Mock = jest.fn(() => this);
  createMenu: jest.Mock = jest.fn(() => this);
  addItem: jest.Mock = jest.fn(() => this);
  addSeparator: jest.Mock = jest.fn(() => this);
  addSubMenu: jest.Mock = jest.fn(() => this);
  addToUi: jest.Mock = jest.fn();
}

describe('onInstall and onOpen', () => {
  it('should create the add-on menu', () => {
    global.SpreadsheetApp = {
      getUi: jest.fn(() => new MockUi()),
    } as unknown as GoogleAppsScript.Spreadsheet.SpreadsheetApp;
    onInstall();
    expect(SpreadsheetApp.getUi).toHaveBeenCalled();
  });
});
