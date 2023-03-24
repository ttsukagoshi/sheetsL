import { ADDON_NAME, handleDeepLErrors } from '../src/sheetsl';

const successPattern = {
  title: 'HTTP Response Code 200',
  inputResponse: {
    getResponseCode: () => 200,
    getContentText: () => 'Testing HTTP Response Code 200',
  },
} as any;
const errorPatterns = [
  {
    title: 'HTTP Response Code 429',
    inputResponse: {
      getResponseCode: () => 429,
      getContentText: () => 'Testing HTTP Response Code 429',
    },
    expectedErrorMessage: `[${ADDON_NAME}] Too Many Requests: Try again after some time.`,
  },
  {
    title: 'HTTP Response Code 456',
    inputResponse: {
      getResponseCode: () => 456,
      getContentText: () => 'Testing HTTP Response Code 456',
    },
    expectedErrorMessage: `[${ADDON_NAME}] Quota Exceeded: The translation limit of your account has been reached.`,
  },
  {
    title: 'HTTP Response Code 500',
    inputResponse: {
      getResponseCode: () => 500,
      getContentText: () => 'Testing HTTP Response Code 500',
    },
    expectedErrorMessage: `[${ADDON_NAME}] Temporary errors in the DeepL service. Please retry after waiting for a while.`,
  },
  {
    title: 'HTTP Response Code 501',
    inputResponse: {
      getResponseCode: () => 501,
      getContentText: () => 'Testing HTTP Response Code 501',
    },
    expectedErrorMessage: `[${ADDON_NAME}] Temporary errors in the DeepL service. Please retry after waiting for a while.`,
  },
  {
    title: 'HTTP Response Code 300',
    inputResponse: {
      getResponseCode: () => 300,
      getContentText: () => 'Testing HTTP Response Code 300',
    },
    expectedErrorMessage: `[${ADDON_NAME}] Error on Calling DeepL API: Testing HTTP Response Code 300`,
  },
] as any[];

describe('handleDeepLErrors Success', () => {
  test(successPattern.title, () => {
    expect(handleDeepLErrors(successPattern.inputResponse)).toBeUndefined();
  });
});

describe.each(errorPatterns)(
  'handleDeepLErrors Errors',
  ({ title, inputResponse, expectedErrorMessage }) => {
    test(title, () => {
      expect(() => {
        handleDeepLErrors(inputResponse);
      }).toThrowError(new Error(expectedErrorMessage));
    });
  }
);
