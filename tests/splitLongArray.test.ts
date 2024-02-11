import { splitLongArray } from '../src/sheetsl';

const maxLength = 5;
const maxBytes = 128;

describe('splitLongArray', () => {
  beforeEach(() => {
    global.Utilities = {
      newBlob: jest.fn((text: string) => ({
        getBytes: jest.fn(() => new TextEncoder().encode(text)),
      })),
    } as unknown as GoogleAppsScript.Utilities.Utilities;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should return the original array if it is less than or equal to maxLength and maxBytes', () => {
    const shortArray = new Array(3).fill('short');
    const result = splitLongArray(shortArray, maxLength, maxBytes);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(shortArray);
  });
  it('should return the original array split in half for a long array with small elements', () => {
    const longArrayWithSmallElements = new Array(7).fill('short');
    const result = splitLongArray(
      longArrayWithSmallElements,
      maxLength,
      maxBytes,
    );
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(['short', 'short', 'short']);
    expect(result[1]).toEqual(['short', 'short', 'short', 'short']);
  });
  it('should return the original array split in three for a long array with small elements', () => {
    const longArrayWithSmallElements = new Array(11).fill('short');
    const result = splitLongArray(
      longArrayWithSmallElements,
      maxLength,
      maxBytes,
    );
    expect(result.length).toBe(3);
    expect(result[0]).toEqual(['short', 'short', 'short', 'short', 'short']);
    expect(result[1]).toEqual(['short', 'short', 'short']);
    expect(result[2]).toEqual(['short', 'short', 'short']);
  });
  it('should return the original array split in three for a long array with long elements', () => {
    const longArrayWithSmallElements = new Array(9).fill(
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
    );
    const result = splitLongArray(
      longArrayWithSmallElements,
      maxLength,
      maxBytes,
    );
    expect(result.length).toBe(5);
    expect(result[0]).toEqual([
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
    ]);
    expect(result[1]).toEqual([
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
    ]);
    expect(result[2]).toEqual([
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
    ]);
    expect(result[3]).toEqual([
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
    ]);
    expect(result[4]).toEqual([
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglong',
    ]);
  });
  it('should return an error if an element in the given array exceeds maxBytes by itself', () => {
    const longArrayWithLargeElement = new Array(11).fill('short') as string[];
    longArrayWithLargeElement[0] = `# SheetsL - DeepL Translation for Google Sheets Google Sheets add-on to use DeepL translation. Translate the contents of the selected range and paste them in the range of cells adjacent to the original range.`;
    expect(() =>
      splitLongArray(longArrayWithLargeElement, maxLength, maxBytes),
    ).toThrow(
      new Error(
        `[SheetsL] The following cell value exceeds the maximum length of the text to translate. Please consider splitting the content into multiple cells.:\n${longArrayWithLargeElement[0]}`,
      ),
    );
  });
});
