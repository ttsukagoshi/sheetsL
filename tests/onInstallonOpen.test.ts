import { onInstall } from '../src/sheetsl';

type MockMenuObj = {
  title?: string;
  menu: (MockMenuObj | MockMenuItemObj | string)[];
};

type MockMenuItemObj = {
  itemName: string;
  functionName: string;
};

const ADDON_MENU: MockMenuObj = {
  menu: [],
};
const ADDON_SUB_MENU_SETTINGS: MockMenuObj = {
  menu: [],
};
const SEPARATOR = '---';

SpreadsheetApp.getUi = jest.fn(() => new MockUi()) as any;

class MockUi {
  isAddonMenu: boolean;
  constructor() {}
  addItem(itemName: string, functionName: string): this {
    if (this.isAddonMenu) {
      ADDON_MENU.menu.push({
        itemName: itemName,
        functionName: functionName,
      });
    } else {
      ADDON_SUB_MENU_SETTINGS.menu.push({
        itemName: itemName,
        functionName: functionName,
      });
    }
    return this;
  }
  addSeparator(): this {
    if (this.isAddonMenu) {
      ADDON_MENU.menu.push(SEPARATOR);
    } else {
      ADDON_SUB_MENU_SETTINGS.menu.push(SEPARATOR);
    }
    return this;
  }
  addSubMenu(ui: MockUi): this {
    ADDON_MENU.menu.push(ADDON_SUB_MENU_SETTINGS);
    this.isAddonMenu = true;
    return this;
  }
  addToUi(): void {}
  createAddonMenu(): this {
    this.isAddonMenu = true;
    return this;
  }
  createMenu(title: string): this {
    this.isAddonMenu = false;
    ADDON_SUB_MENU_SETTINGS.title = title;
    return this;
  }
}

describe('onOpen/onInstall', () => {
  test('onOpen/onInstall test', () => {
    onInstall();
    expect(ADDON_MENU).toEqual({
      menu: [
        {
          title: 'Settings',
          menu: [
            {
              itemName: 'Set Auth Key',
              functionName: 'setDeeplAuthKey',
            },
            {
              itemName: 'Delete Auth Key',
              functionName: 'deleteDeeplAuthKey',
            },
            '---',
            {
              itemName: 'Set Language',
              functionName: 'setLanguage',
            },
          ],
        },
        '---',
        {
          itemName: 'Translate',
          functionName: 'translateRange',
        },
      ],
    });
  });
});
