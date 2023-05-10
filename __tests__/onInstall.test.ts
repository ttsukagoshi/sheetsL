import { onInstall } from '../src/sheetsl';

const ADDON_NAME = 'SheetsL';

SpreadsheetApp.getUi = jest.fn(() => ({
  createAddonMenu: jest.fn(() => new MockMenu(true)),
  createMenu: jest.fn((title: string) => new MockMenu(false, title)),
})) as any;

class MockMenu {
  mockMenu: MockMenuObj;
  isAddonMenu: boolean;
  constructor(isAddonMenu: boolean, title: string = '') {
    this.mockMenu = {
      title: isAddonMenu ? ADDON_NAME : title,
      menu: [],
      isAddonMenu: isAddonMenu,
    };
  }
  addItem(itemName: string, functionName: string): this {
    this.mockMenu.menu.push({ itemName: itemName, functionName: functionName });
    return this;
  }
  addSeparator(): this {
    this.mockMenu.menu.push('---');
    return this;
  }
  addSubMenu(menu: MockMenuObj): this {
    this.mockMenu.menu.push(menu);
    return this;
  }
  addToUi(): MockMenuObj {
    return this.mockMenu;
  }
}

type MockMenuObj = {
  title: string;
  menu: any[];
  isAddonMenu: boolean;
};

describe('onOpen/onInstall', () => {
  test('onOpen/onInstall test', () => {
    expect(onInstall).toEqual({
      title: ADDON_NAME,
      menu: [
        {
          title: 'Settings',
          menu: [{ itemName: 'Set Auth Key', functionName: 'setDeeplAuthKey' }],
          isAddonMenu: false,
        },
      ],
      isAddonMenu: true,
    });
  });
});
