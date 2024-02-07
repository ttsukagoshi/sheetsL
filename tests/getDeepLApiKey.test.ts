import { getDeepLApiKey } from '../src/sheetsl';

describe('getDeepLApiKey', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should get the DeepL API key from the user properties and return it', () => {
    const mockApiKey = 'Sample-API-key:fx';
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        getProperty: jest.fn(() => mockApiKey),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
    const result = getDeepLApiKey();
    expect(result).toBe(mockApiKey);
  });
  it('should throw an error if the DeepL API key is not saved in the user properties', () => {
    global.PropertiesService = {
      getUserProperties: jest.fn(() => ({
        getProperty: jest.fn(() => null),
      })),
    } as unknown as GoogleAppsScript.Properties.PropertiesService;
    expect(() => getDeepLApiKey()).toThrow(
      new Error(
        '[SheetsL] API Key Unavailable: Set the DeepL API Authentication Key from the Settings > Set Auth Key of the add-on menu.',
      ),
    );
  });
});
