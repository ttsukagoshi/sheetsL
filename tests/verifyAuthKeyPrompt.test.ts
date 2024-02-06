import { verifyAuthKeyPrompt } from '../src/sheetsl';

const verifyAuthKeyPromptSuccessPatterns = [
  {
    testName: 'Success',
    input: {
      promptResponse: {
        getSelectedButton: () => 'ok',
        getResponseText: () => 'ThisIsAnApiAuthKey:fx',
      },
      ui: {
        Button: {
          OK: 'ok', // Don't change this value.
        },
      },
    },
    expectedOutput: {
      getSelectedButton: () => 'ok',
      getResponseText: () => 'ThisIsAnApiAuthKey:fx',
    },
  },
] as any[];

const verifyAuthKeyPromptErrorPatterns = [
  {
    testName: 'Error: canceled auth key setting',
    input: {
      promptResponse: {
        getSelectedButton: () => 'canceled',
        getResponseText: () => 'ThisIsAnApiAuthKey:fx',
      },
      ui: {
        Button: {
          OK: 'ok', // Don't change this value.
        },
      },
    },
    expectedErrorMessage:
      '[SheetsL] Canceled: Setting of DeepL Authentication Key has been canceled.',
  },
  {
    testName: 'Error: empty auth key',
    input: {
      promptResponse: {
        getSelectedButton: () => 'ok',
        getResponseText: () => '',
      },
      ui: {
        Button: {
          OK: 'ok', // Don't change this value.
        },
      },
    },
    expectedErrorMessage:
      '[SheetsL] You must enter a valid DeepL API Authentication Key.',
  },
  {
    testName: 'Error: auth key is null',
    input: {
      promptResponse: {
        getSelectedButton: () => 'ok',
        getResponseText: () => null,
      },
      ui: {
        Button: {
          OK: 'ok', // Don't change this value.
        },
      },
    },
    expectedErrorMessage:
      '[SheetsL] You must enter a valid DeepL API Authentication Key.',
  },
] as any[];

describe.each(verifyAuthKeyPromptSuccessPatterns)(
  'verifyAuthKeyPrompt Test: success patterns',
  ({ testName, input, expectedOutput }) => {
    test(`${testName}: getSelectedButton`, () => {
      expect(
        verifyAuthKeyPrompt(input.promptResponse, input.ui).getSelectedButton(),
      ).toBe(expectedOutput.getSelectedButton());
    });
    test(`${testName}: getResponseText`, () => {
      expect(
        verifyAuthKeyPrompt(input.promptResponse, input.ui).getResponseText(),
      ).toBe(expectedOutput.getResponseText());
    });
  },
);

describe.each(verifyAuthKeyPromptErrorPatterns)(
  'verifyAuthKeyPrompt Test: error patterns',
  ({ testName, input, expectedErrorMessage }) => {
    test(testName, () => {
      expect(() => {
        verifyAuthKeyPrompt(input.promptResponse, input.ui);
      }).toThrowError(new Error(expectedErrorMessage));
    });
  },
);
