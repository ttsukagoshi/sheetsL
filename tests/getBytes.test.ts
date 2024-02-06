import { getBlobBytes } from '../src/sheetsl';

Utilities.newBlob = jest.fn((text: string) => ({
  getBytes: jest.fn(() => ({
    length: text.length,
  })),
})) as any;

const patterns = [
  {
    input: 'test string',
    expectedOutput: 11,
  },
];

describe.each(patterns)('getBlobBytes', ({ input, expectedOutput }) => {
  test(`getBlobBytes test: ${input}`, () => {
    expect(getBlobBytes(input)).toBe(expectedOutput);
  });
});
