import { verifyApiKeyPrompt } from '../src/sheetsl';

describe('verifyApiKeyPrompt', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should return the original prompt response', () => {
    const mockPromptResponse = {
      getSelectedButton: () => 'ok',
      getResponseText: () => 'Sample-API-key:fx',
    } as unknown as GoogleAppsScript.Base.PromptResponse;
    const mockUi = {
      Button: {
        OK: 'ok',
      },
    } as unknown as GoogleAppsScript.Base.Ui;
    const result = verifyApiKeyPrompt(mockPromptResponse, mockUi);
    expect(result).toEqual(mockPromptResponse);
  });
  it('should throw an error if the user cancels the prompt', () => {
    const mockPromptResponse = {
      getSelectedButton: () => 'cancel',
      getResponseText: () => 'Sample-API-key:fx',
    } as unknown as GoogleAppsScript.Base.PromptResponse;
    const mockUi = {
      Button: {
        OK: 'ok',
      },
    } as unknown as GoogleAppsScript.Base.Ui;
    expect(() => verifyApiKeyPrompt(mockPromptResponse, mockUi)).toThrow(
      new Error(
        '[SheetsL] Canceled: Setting of DeepL Authentication Key has been canceled.',
      ),
    );
  });
  it('should throw an error if the user enters an empty string for the DeepL API key', () => {
    const mockPromptResponse = {
      getSelectedButton: () => 'ok',
      getResponseText: () => '',
    } as unknown as GoogleAppsScript.Base.PromptResponse;
    const mockUi = {
      Button: {
        OK: 'ok',
      },
    } as unknown as GoogleAppsScript.Base.Ui;
    expect(() => verifyApiKeyPrompt(mockPromptResponse, mockUi)).toThrow(
      new Error(
        '[SheetsL] You must enter a valid DeepL API Authentication Key.',
      ),
    );
  });
});
