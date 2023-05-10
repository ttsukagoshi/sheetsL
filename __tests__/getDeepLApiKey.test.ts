import { getDeepLApiKey } from '../src/sheetsl';

const ADDON_NAME = 'SheetsL';

PropertiesService.getUserProperties = jest.fn(() => ({
  getProperty: jest.fn(() => undefined),
})) as any;

const testObj = {
  title:
    'Case when DeepL API Authentication Key is not saved in the user property',
  errorMessage: `[${ADDON_NAME}] API Key Unavailable: Set the DeepL API Authentication Key from the Settings > Set Auth Key of the add-on menu.`,
};

describe('getDeepLApiKey Error', () => {
  test(testObj.title, () => {
    expect(() => {
      getDeepLApiKey();
    }).toThrowError(new Error(testObj.errorMessage));
  });
});
