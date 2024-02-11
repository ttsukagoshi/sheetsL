/* Copyright 2022 TSUKAGOSHI Taro

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

const ADDON_NAME = 'SheetsL';
const UP_KEY_DEEPL_API_KEY = 'deeplApiKey'; // User property key for saving the DeepL API key
const UP_KEY_SOURCE_LOCALE = 'sourceLocale'; // User property key for saving the source language for DeepL
const UP_KEY_TARGET_LOCALE = 'targetLocale'; // User property key for saving the target language for DeepL
const DEEPL_API_VERSION = 'v2'; // DeepL API version
const DEEPL_API_BASE_URL_FREE = `https://api-free.deepl.com/${DEEPL_API_VERSION}/`;
const DEEPL_API_BASE_URL_PRO = `https://api.deepl.com/${DEEPL_API_VERSION}/`;

const MAX_TEXT_NUM = 50; // Maximum number of texts to translate in a single request
// Threshold value of the length of the text to translate, in bytes.
// From the DeepL API Doc: "The total request body size must not exceed 128 KiB (128 · 1024 bytes)."
// See https://www.deepl.com/docs-api/translate-text
// The constant part of the request body is approx. 200 bytes, so we'll set the limit to 127 * 1028 bytes with a margin
const THRESHOLD_BYTES = 127 * 1028;

/**
 * The JavaScript object of a DeepL-supported language.
 * GET request on /v2/languages returns an array of this object.
 * @see https://www.deepl.com/docs-api/general/get-languages/
 */
export interface DeepLSupportedLanguages {
  language: string;
  name: string;
  supports_formality: boolean;
}

/**
 * The request payload to the DeepL API for POST /v2/translate.
 * @see https://www.deepl.com/docs-api/translate-text/
 */
interface DeepLTranslationRequest {
  text: (string | number)[];
  target_lang: string;
  source_lang?: string;
}

/**
 * The response from the DeepL API for POST /v2/translate.
 * @see https://www.deepl.com/docs-api/translate-text/
 */
interface DeepLTranslationResponse {
  translations: DeepLTranslationObj[];
}

/**
 * The individual translated text object in the translated response
 * from DeepL API.
 * @see https://www.deepl.com/docs-api/translate-text/
 */
interface DeepLTranslationObj {
  detected_source_language: string;
  text: string;
}

/**
 * The type of language that should be returned in the GET request
 * to the DeepL API to retrieve its supported languages.
 * @see https://www.deepl.com/docs-api/general/get-languages/
 */
export type DeepLLanguageType = 'source' | 'target';

/**
 * The type of the object containing key-values pairs to set in the properties of the Google Apps Script.
 * @see https://developers.google.com/apps-script/reference/properties/properties#setpropertiesproperties
 */
type PropertiesObj = Record<string, string>;

/**
 * Create add-on menu on opening spreadsheet file.
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
    .addSubMenu(
      ui
        .createMenu('Settings')
        .addItem('Set DeepL API Key', 'setDeeplApiKey')
        .addItem('Delete DeepL API Key', 'deleteDeeplApiKey')
        .addSeparator()
        .addItem('Set Language', 'setLanguage'),
    )
    .addSeparator()
    .addItem('Translate', 'translateSelectedRange')
    .addToUi();
}

/**
 * Create add-on menu on installation of add-on.
 */
export function onInstall(): void {
  onOpen();
}

/**
 * Store DeepL API authentication key in user property.
 */
export function setDeeplApiKey(): void {
  const ui = SpreadsheetApp.getUi();
  try {
    const promptResponse = ui.prompt(
      'Enter your DeepL API Authentication Key',
      ui.ButtonSet.OK_CANCEL,
    );
    const apiKey = verifyApiKeyPrompt(promptResponse, ui).getResponseText();
    PropertiesService.getUserProperties().setProperty(
      UP_KEY_DEEPL_API_KEY,
      apiKey,
    );
    ui.alert(
      `[${ADDON_NAME}] Completed: Your DeepL API Authentication Key has been saved as a user property.`,
    );
  } catch (error) {
    console.error((error as Error).stack);
    ui.alert((error as Error).message);
  }
}

/**
 * Verify the prompt response in setDeeplApiKey and return an error
 * if the prompt is canceled or if an invalid DeepL API Authentication Key
 * was entered.
 * @param promptResponse Response object for the user prompt in setDeeplApiKey
 * to enter the user's DeepL API Authentication Key.
 * @returns The entered prompt response object.
 */
export function verifyApiKeyPrompt(
  promptResponse: GoogleAppsScript.Base.PromptResponse,
  ui: GoogleAppsScript.Base.Ui,
): GoogleAppsScript.Base.PromptResponse {
  if (promptResponse.getSelectedButton() !== ui.Button.OK) {
    throw new Error(
      `[${ADDON_NAME}] Canceled: Setting of DeepL Authentication Key has been canceled.`,
    );
  }
  const apiKey = promptResponse.getResponseText();
  if (!apiKey || apiKey === '') {
    throw new Error(
      `[${ADDON_NAME}] You must enter a valid DeepL API Authentication Key.`,
    );
  }
  return promptResponse;
}

/**
 * Delete the stored DeepL API authentication key in user property.
 */
export function deleteDeeplApiKey(): void {
  const ui = SpreadsheetApp.getUi();
  try {
    PropertiesService.getUserProperties().deleteProperty(UP_KEY_DEEPL_API_KEY);
    ui.alert(
      `[${ADDON_NAME}] Complete: DeepL API Authentication Key has been deleted from your user property.`,
    );
  } catch (error) {
    console.error((error as Error).stack);
    ui.alert((error as Error).message);
  }
}

/**
 * Set source and target languages for translation.
 */
export function setLanguage(): void {
  const ui = SpreadsheetApp.getUi();
  try {
    const up = PropertiesService.getUserProperties();
    const userProperties = up.getProperties();
    // Proceed?
    if (userProperties[UP_KEY_TARGET_LOCALE]) {
      // Ask user whether to proceed if a target language is already set
      const alertProceed = ui.alert(
        `There is an existing language setting:\n - Source Language: ${userProperties[UP_KEY_SOURCE_LOCALE]}\n - Target Language: ${userProperties[UP_KEY_TARGET_LOCALE]}\n\nDo you want to update these values?`,
        ui.ButtonSet.YES_NO,
      );
      if (alertProceed !== ui.Button.YES) {
        throw new Error(
          `[${ADDON_NAME}] Canceled: Language setting has been canceled.`,
        );
      }
    }
    // Retrieve the list of available languages for source and target, respectively
    const availableLocaleSource = deepLGetLanguages('source'); // .map((langObj) => `${langObj.language} (${langObj.name})`).join('\n');
    const availableLocaleTarget = deepLGetLanguages('target');
    // Prompt user to enter the language settings
    // Source language
    const promptSourceLocale = ui.prompt(
      `In which language is the source text written? Enter the two-letter language code. Leave this value empty to use DeepL's language auto detection.\n\nAvailable values:\n${availableLocaleSource
        .map(
          (langObj: DeepLSupportedLanguages) =>
            `- ${langObj.language} (${langObj.name})`,
        )
        .join('\n')}`,
      ui.ButtonSet.OK_CANCEL,
    );
    if (promptSourceLocale.getSelectedButton() !== ui.Button.OK) {
      throw new Error(
        `[${ADDON_NAME}] Canceled: Language setting has been canceled.`,
      );
    }
    const responseSourceLocale = promptSourceLocale
      .getResponseText()
      .toUpperCase();
    if (
      !availableLocaleSource
        .map((langObj: DeepLSupportedLanguages) => langObj.language)
        .includes(responseSourceLocale) &&
      responseSourceLocale != ''
    ) {
      throw new Error(
        `[${ADDON_NAME}] Invalid Value (${responseSourceLocale}): Enter a valid value.`,
      );
    }
    // Target language
    const promptTargetLocale = ui.prompt(
      `Into which language should the text be translated? Enter the two- or four-letter language code.\n\nAvailable values:\n${availableLocaleTarget
        .map(
          (langObj: DeepLSupportedLanguages) =>
            `- ${langObj.language} (${langObj.name})`,
        )
        .join('\n')}`,
      ui.ButtonSet.OK_CANCEL,
    );
    if (promptTargetLocale.getSelectedButton() !== ui.Button.OK) {
      throw new Error(
        `[${ADDON_NAME}] Canceled: Language setting has been canceled.`,
      );
    }
    const responseTargetLocale = promptTargetLocale
      .getResponseText()
      .toUpperCase();
    if (
      !availableLocaleTarget
        .map((langObj: DeepLSupportedLanguages) => langObj.language)
        .includes(responseTargetLocale)
    ) {
      throw new Error(
        `[${ADDON_NAME}] Invalid Value (${responseTargetLocale}): Enter a valid value.`,
      );
    }
    // Set the values as user properties
    const setObj: PropertiesObj = {};
    setObj[UP_KEY_SOURCE_LOCALE] = responseSourceLocale;
    setObj[UP_KEY_TARGET_LOCALE] = responseTargetLocale;
    up.setProperties(setObj, false);
    // Complete
    ui.alert('Completed: Language setting has been completed.');
  } catch (error) {
    console.error((error as Error).stack);
    ui.alert((error as Error).message);
  }
}

/**
 * Translate the selected cell range using DeepL API
 * and paste the result in the adjacent range.
 */
export function translateSelectedRange(): void {
  const ui = SpreadsheetApp.getUi();
  const activeSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const selectedRange = activeSheet.getActiveRange();
  const userProperties = PropertiesService.getUserProperties().getProperties();
  try {
    if (!userProperties[UP_KEY_TARGET_LOCALE]) {
      // If the target language is not set, throw an error
      throw new Error(
        `[${ADDON_NAME}] Target Language Unavailable: Set the target language in Settings > Set Language of the add-on menu.`,
      );
    }
    if (!selectedRange) {
      // If no cell is selected, throw an error
      throw new Error(`[${ADDON_NAME}] Select cells to translate.`);
    }
    // Check target range, i.e., the range where translated texts will be placed
    const selectedRangeNumCol = selectedRange.getNumColumns();
    const targetRange = activeSheet.getRange(
      selectedRange.getRow(),
      selectedRange.getColumn() + selectedRangeNumCol,
      selectedRange.getNumRows(),
      selectedRangeNumCol,
    );
    if (!targetRange.isBlank()) {
      // If the target range is not empty, ask the user whether to proceed and overwrite the contents
      const alertOverwrite = ui.alert(
        'Translated text(s) will be pasted in the cell(s) to the right of the currently selected range. This target area is not empty.\nContinuing this process will overwrite the contents.\n\nAre you sure you want to continue?',
        ui.ButtonSet.OK_CANCEL,
      );
      if (alertOverwrite !== ui.Button.OK) {
        throw new Error(`[${ADDON_NAME}] Translation canceled.`);
      }
    }

    // Get the source text
    const sourceTextArr = selectedRange.getValues();

    // Set translated text in target range
    targetRange.setValues(
      translateRange(
        sourceTextArr as (string | number)[][],
        userProperties[UP_KEY_TARGET_LOCALE],
        userProperties[UP_KEY_SOURCE_LOCALE],
      ),
    );
    // Complete
    ui.alert('Complete: Translation has been completed.');
  } catch (error) {
    console.error((error as Error).stack);
    ui.alert((error as Error).message);
  }
}

/**
 * Translate the given 2-dimension array of texts using DeepL API
 * and return the translated texts in the same format.
 * @param sourceTextArr 2-dimension array of texts to translate
 * @returns 2-dimension array of translated texts
 * @see https://www.deepl.com/docs-api/translate-text
 */
export function translateRange(
  sourceTextArr: (string | number)[][],
  targetLocale: string,
  sourceLocale?: string,
): string[][] {
  const columnNumber = sourceTextArr[0].length;
  const translatedRangeFlat = splitLongArray(
    // Split the array into multiple arrays if the total length of the array exceeds the given maximum length
    // or if the total length of the stringified array in bytes exceeds the given maximum bytes
    sourceTextArr.flat(),
    MAX_TEXT_NUM,
    THRESHOLD_BYTES,
  )
    .map((arr) => deepLTranslate(arr, targetLocale, sourceLocale))
    .flat();
  return translatedRangeFlat.reduce((acc, _, i, arr) => {
    if (i % columnNumber === 0) {
      acc.push(arr.slice(i, i + columnNumber));
    }
    return acc;
  }, [] as string[][]);
}

/**
 * Split the given array into multiple arrays
 * if the total length of the array exceeds the given maximum length
 * or if the total length of the stringified array in bytes exceeds the given maximum bytes.
 * Execute this function recursively until the given array is within the given limits.
 * @param originalArray The original array to split
 * @param maxLength The maximum length of the array
 * @param maxBytes The maximum length of the stringified array in bytes
 * @returns An array of arrays. If the original array is within the given limits, the array will contain the original array.
 */
export function splitLongArray<T>(
  originalArray: T[],
  maxLength: number,
  maxBytes: number,
): T[][] {
  const returnArray: T[][] = [];
  if (
    originalArray.length <= maxLength &&
    getBlobBytes(JSON.stringify(originalArray)) <= maxBytes
  ) {
    returnArray.push(originalArray);
  } else {
    const halfLength = Math.floor(originalArray.length / 2);
    const firstHalf = originalArray.slice(0, halfLength);
    const secondHalf = originalArray.slice(halfLength);
    [firstHalf, secondHalf].forEach((arr) => {
      if (arr.length === 1 && getBlobBytes(JSON.stringify(arr)) > maxBytes) {
        throw new Error(
          `[${ADDON_NAME}] The following cell value exceeds the maximum length of the text to translate. Please consider splitting the content into multiple cells.:\n${String(arr[0])}`,
        );
      }
      if (
        arr.length <= maxLength &&
        getBlobBytes(JSON.stringify(arr)) <= maxBytes
      ) {
        returnArray.push(arr);
      } else {
        returnArray.push(...splitLongArray(arr, maxLength, maxBytes));
      }
    });
  }
  return returnArray;
}

/**
 * Call the DeepL API on the `translate` endpoint
 * @param sourceText Array of texts to translate
 * @param targetLocale The language to be translated into
 * @param sourceLocale The language of the source text
 * @returns Array of translated texts.
 * @see https://www.deepl.com/docs-api/translate-text/
 */
export function deepLTranslate(
  sourceText: string | number | (string | number)[] | null | undefined,
  targetLocale: string,
  sourceLocale?: string | null,
): string[] {
  const endpoint = 'translate';
  let sourceTexts: (string | number)[];
  if (
    !sourceText ||
    (typeof sourceText === 'string' && sourceText.length === 0)
  ) {
    throw new Error(`[${ADDON_NAME}] Empty input.`);
  } else if (Array.isArray(sourceText)) {
    sourceTexts = sourceText;
  } else {
    sourceTexts = [sourceText];
  }

  // API key
  const apiKey = getDeepLApiKey();
  const baseUrl = getDeepLApiBaseUrl(apiKey);
  // Call the DeepL API
  const url = baseUrl + endpoint;
  const payload: DeepLTranslationRequest = {
    text: sourceTexts,
    target_lang: targetLocale,
  };
  if (sourceLocale) {
    payload.source_lang = sourceLocale;
  }
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  // Call the DeepL API translate request
  const response = handleDeepLErrors(UrlFetchApp.fetch(url, options));

  const translatedTextObj = JSON.parse(
    response.getContentText(),
  ) as DeepLTranslationResponse;
  const translatedText: string[] = translatedTextObj.translations.map(
    (translationsResponse: DeepLTranslationObj): string =>
      translationsResponse.text,
  );

  return translatedText;
}

/**
 * Retrieve the list of languages that are currently supported for translation,
 * either as source or target language.
 * @param type The type of languages that should be listed.
 * @returns An array of the supported languages.
 * @see https://www.deepl.com/docs-api/general/get-languages/
 */
export function deepLGetLanguages(
  type: DeepLLanguageType = 'source',
): DeepLSupportedLanguages[] {
  const endpoint = 'languages';
  // API key
  const apiKey = getDeepLApiKey();
  const baseUrl = getDeepLApiBaseUrl(apiKey);
  // Call the DeepL API
  const url = baseUrl + endpoint + `?auth_key=${apiKey}&type=${type}`;
  const response = handleDeepLErrors(
    UrlFetchApp.fetch(url, { muteHttpExceptions: true }),
  );

  return JSON.parse(response.getContentText()) as DeepLSupportedLanguages[];
}

/**
 * Get the length of a given string in bytes.
 * @param text The string of which to get the bytes.
 * @returns The length of the given text in bytes.
 */
export function getBlobBytes(text: string): number {
  return Utilities.newBlob(text).getBytes().length;
}

/**
 * Handle DeepL API errors based on the response code.
 * Returns the entered response if the response code is 200.
 * @param response The UrlFetchApp.fetch response from the DeepL API
 * @see https://www.deepl.com/docs-api/api-access/error-handling/
 */
export function handleDeepLErrors(
  response: GoogleAppsScript.URL_Fetch.HTTPResponse,
): GoogleAppsScript.URL_Fetch.HTTPResponse {
  const responseCode = response.getResponseCode();
  if (responseCode === 429) {
    throw new Error(
      `[${ADDON_NAME}] Too Many Requests: Try again after some time.`,
    );
  } else if (responseCode === 456) {
    throw new Error(
      `[${ADDON_NAME}] Quota Exceeded: The translation limit of your account has been reached.`,
    );
  } else if (responseCode >= 500) {
    throw new Error(
      `[${ADDON_NAME}] Temporary errors in the DeepL service. Please retry after waiting for a while.`,
    );
  } else if (responseCode !== 200) {
    throw new Error(
      `[${ADDON_NAME}] Error on Calling DeepL API: ${response.getContentText()}`,
    );
  }
  return response;
}

/**
 * Get the string of DeepL API Authentication Key saved as a user property of the add-on.
 * Throws an error if the key is not save in the user property.
 * @returns The string of DeepL API Authentication Key saved as a user property of the add-on.
 */
export function getDeepLApiKey(): string {
  const apiKey =
    PropertiesService.getUserProperties().getProperty(UP_KEY_DEEPL_API_KEY);
  if (!apiKey) {
    throw new Error(
      `[${ADDON_NAME}] API Key Unavailable: Set the DeepL API Authentication Key from the Settings > Set Auth Key of the add-on menu.`,
    );
  } else {
    return apiKey;
  }
}

/**
 * Returns the DeepL API base URL. The URL depends on whether the user's account
 * is DeepL API Free or Pro. Auth keys of DeepL API Free end with `:fx`
 * @param apiKey The DeepL API Free/Pro Authentication Key
 * @returns The relevant base URL for DeepL API
 * @see https://support.deepl.com/hc/en-us/articles/360021183620-DeepL-API-Free-vs-DeepL-API-Pro
 */
export function getDeepLApiBaseUrl(apiKey: string): string {
  return apiKey.endsWith(':fx')
    ? DEEPL_API_BASE_URL_FREE
    : DEEPL_API_BASE_URL_PRO;
}
