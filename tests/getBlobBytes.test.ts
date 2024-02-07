import { getBlobBytes } from '../src/sheetsl';

global.Utilities = {
  newBlob: jest.fn((text: string) => ({
    getBytes: jest.fn(() => ({
      length: text.length,
    })),
  })),
} as unknown as GoogleAppsScript.Utilities.Utilities;

describe('getBlobBytes', () => {
  it('should return the length of the given string in bytes', () => {
    expect(getBlobBytes('test string')).toBe(11);
  });
});
