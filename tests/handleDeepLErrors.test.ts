import { handleDeepLErrors } from '../src/sheetsl';

describe('handleDeepLErrors', () => {
  it('should return the entered response if the response code is 200', () => {
    const mockResponse = {
      getResponseCode: () => 200,
      getContentText: () => 'Testing HTTP Response Code 200',
    } as unknown as GoogleAppsScript.URL_Fetch.HTTPResponse;
    const result = handleDeepLErrors(mockResponse);
    expect(result).toEqual(mockResponse);
  });
  describe('handleDeepLErrors Error', () => {
    const errorPatterns = [
      {
        title: 'HTTP Response Code 429',
        inputResponse: {
          getResponseCode: () => 429,
          getContentText: () => 'Testing HTTP Response Code 429',
        } as unknown as GoogleAppsScript.URL_Fetch.HTTPResponse,
        expectedErrorMessage:
          '[SheetsL] Too Many Requests: Try again after some time.',
      },
      {
        title: 'HTTP Response Code 456',
        inputResponse: {
          getResponseCode: () => 456,
          getContentText: () => 'Testing HTTP Response Code 456',
        } as unknown as GoogleAppsScript.URL_Fetch.HTTPResponse,
        expectedErrorMessage:
          '[SheetsL] Quota Exceeded: The translation limit of your account has been reached.',
      },
      {
        title: 'HTTP Response Code 500',
        inputResponse: {
          getResponseCode: () => 500,
          getContentText: () => 'Testing HTTP Response Code 500',
        } as unknown as GoogleAppsScript.URL_Fetch.HTTPResponse,
        expectedErrorMessage:
          '[SheetsL] Temporary errors in the DeepL service. Please retry after waiting for a while.',
      },
      {
        title: 'HTTP Response Code 501',
        inputResponse: {
          getResponseCode: () => 501,
          getContentText: () => 'Testing HTTP Response Code 501',
        } as unknown as GoogleAppsScript.URL_Fetch.HTTPResponse,
        expectedErrorMessage:
          '[SheetsL] Temporary errors in the DeepL service. Please retry after waiting for a while.',
      },
      {
        title: 'HTTP Response Code 300',
        inputResponse: {
          getResponseCode: () => 300,
          getContentText: () => 'Testing HTTP Response Code 300',
        } as unknown as GoogleAppsScript.URL_Fetch.HTTPResponse,
        expectedErrorMessage:
          '[SheetsL] Error on Calling DeepL API: Testing HTTP Response Code 300',
      },
    ];
    it.each(errorPatterns)(
      'should throw an error when the $title',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ title, inputResponse, expectedErrorMessage }) => {
        expect(() => handleDeepLErrors(inputResponse)).toThrow(
          new Error(expectedErrorMessage),
        );
      },
    );
  });
});
