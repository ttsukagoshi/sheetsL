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

// Threshold value of the length of the text to translate, in bytes. See https://developers.google.com/apps-script/guides/services/quotas#current_limitations
const THRESHOLD_BYTES = 1900;

/**
 * The JavaScript object of a DeepL-supported language.
 * GET request on /v2/languages returns an array of this object.
 * @see https://www.deepl.com/docs-api/general/get-languages/
 */
export type DeepLSupportedLanguages = {
  language: string;
  name: string;
  supports_formality: boolean;
};

/**
 * The response from the DeepL API for POST /v2/translate.
 * @see https://www.deepl.com/docs-api/translate-text/
 */
type DeepLTranslationResponse = {
  translations: DeepLTranslationObj[];
};

/**
 * The individual translated text object in the translated response
 * from DeepL API.
 * @see https://www.deepl.com/docs-api/translate-text/
 */
type DeepLTranslationObj = {
  detected_source_language: string;
  text: string;
};

/**
 * The type of language that should be returned in the GET request
 * to the DeepL API to retrieve its supported languages.
 * @see https://www.deepl.com/docs-api/general/get-languages/
 */
export type DeepLLanguageType = 'source' | 'target';

/**
 * Create add-on menu on opening spreadsheet file.
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
    .addSubMenu(
      ui
        .createMenu('Settings')
        .addItem('Set Auth Key', 'setDeeplAuthKey')
        .addItem('Delete Auth Key', 'deleteDeeplAuthKey')
        .addSeparator()
        .addItem('Set Language', 'setLanguage')
    )
    .addSeparator()
    .addItem('Translate', 'translateRange')
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
export function setDeeplAuthKey(): void {
  const ui = SpreadsheetApp.getUi();
  try {
    const promptResponse = ui.prompt(
      'Enter your DeepL API Authentication Key',
      ui.ButtonSet.OK_CANCEL
    );
    if (promptResponse.getSelectedButton() !== ui.Button.OK) {
      throw new Error(
        `[${ADDON_NAME}] Canceled: Setting of DeepL Authentication Key has been canceled.`
      );
    }
    const apiKey = promptResponse.getResponseText();
    if (!apiKey || apiKey === '') {
      throw new Error(
        `[${ADDON_NAME}] You must enter a valid DeepL API Authentication Key.`
      );
    }
    PropertiesService.getUserProperties().setProperty(
      UP_KEY_DEEPL_API_KEY,
      apiKey
    );
    ui.alert(
      `[${ADDON_NAME}] Completed: Your DeepL API Authentication Key has been saved as a user property.`
    );
  } catch (error) {
    console.error(error.stack);
    ui.alert(error.message);
  }
}

/**
 * Delete the stored DeepL API authentication key in user property.
 */
export function deleteDeeplAuthKey(): void {
  const ui = SpreadsheetApp.getUi();
  try {
    PropertiesService.getUserProperties().deleteProperty(UP_KEY_DEEPL_API_KEY);
    ui.alert(
      `[${ADDON_NAME}] Complete: DeepL API Authentication Key has been deleted from your user property.`
    );
  } catch (error) {
    console.error(error.stack);
    ui.alert(error.message);
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
        ui.ButtonSet.YES_NO
      );
      if (alertProceed !== ui.Button.YES) {
        throw new Error(
          `[${ADDON_NAME}] Canceled: Language setting has been canceled.`
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
            `- ${langObj.language} (${langObj.name})`
        )
        .join('\n')}`,
      ui.ButtonSet.OK_CANCEL
    );
    if (promptSourceLocale.getSelectedButton() !== ui.Button.OK) {
      throw new Error(
        `[${ADDON_NAME}] Canceled: Language setting has been canceled.`
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
        `[${ADDON_NAME}] Invalid Value (${responseSourceLocale}): Enter a valid value.`
      );
    }
    // Target language
    const promptTargetLocale = ui.prompt(
      `Into which language should the text be translated? Enter the two- or four-letter language code.\n\nAvailable values:\n${availableLocaleTarget
        .map(
          (langObj: DeepLSupportedLanguages) =>
            `- ${langObj.language} (${langObj.name})`
        )
        .join('\n')}`,
      ui.ButtonSet.OK_CANCEL
    );
    if (promptTargetLocale.getSelectedButton() !== ui.Button.OK) {
      throw new Error(
        `[${ADDON_NAME}] Canceled: Language setting has been canceled.`
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
        `[${ADDON_NAME}] Invalid Value (${responseTargetLocale}): Enter a valid value.`
      );
    }
    // Set the values as user properties
    let setObj = {};
    setObj[UP_KEY_SOURCE_LOCALE] = responseSourceLocale;
    setObj[UP_KEY_TARGET_LOCALE] = responseTargetLocale;
    up.setProperties(setObj, false);
    // Complete
    ui.alert('Completed: Language setting has been completed.');
  } catch (error) {
    console.error(error.stack);
    ui.alert(error.message);
  }
}

/**
 * Translate the selected cell range using DeepL API
 * and paste the result in the adjacent range.
 */
export function translateRange(): void {
  const ui = SpreadsheetApp.getUi();
  const activeSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const selectedRange = activeSheet.getActiveRange();
  const userProperties = PropertiesService.getUserProperties().getProperties();
  try {
    if (!userProperties[UP_KEY_TARGET_LOCALE]) {
      throw new Error(
        `[${ADDON_NAME}] Target Language Unavailable: Set the target language in Settings > Set Language of the add-on menu.`
      );
    }
    if (!selectedRange) {
      throw new Error(`[${ADDON_NAME}] Select cells to translate.`);
    }
    // Check target range, i.e., the range where translated texts will be placed
    const selectedRangeNumCol = selectedRange.getNumColumns();
    const targetRange = activeSheet.getRange(
      selectedRange.getRow(),
      selectedRange.getColumn() + selectedRangeNumCol,
      selectedRange.getNumRows(),
      selectedRangeNumCol
    );
    if (!targetRange.isBlank()) {
      const alertOverwrite = ui.alert(
        'Translated text(s) will be pasted in the cell(s) to the right of the currently selected range. This target area is not empty.\nContinuing this process will overwrite the contents.\n\nAre you sure you want to continue?',
        ui.ButtonSet.OK_CANCEL
      );
      if (alertOverwrite !== ui.Button.OK) {
        throw new Error(`[${ADDON_NAME}] Translation canceled.`);
      }
    }

    // Get the source text
    const sourceTextArr = selectedRange.getValues();
    // console.log(`sourceTextArr: ${JSON.stringify(sourceTextArr)}`);

    const translatedText = sourceTextArr.map((row) =>
      row.map((cellValue: string | number | boolean) => {
        if (cellValue === '') {
          return '';
        }
        if (getBlobBytes(encodeURIComponent(cellValue)) > THRESHOLD_BYTES) {
          throw new Error(
            `[${ADDON_NAME}] Cell content is too long. Please consider splitting the content into multiple cells:\n${cellValue}`
          );
        } else {
          Utilities.sleep(1000); // Interval to avoid concentrated access to API
          // Cell-based translation
          return deepLTranslate(
            cellValue.toString(),
            userProperties[UP_KEY_SOURCE_LOCALE],
            userProperties[UP_KEY_TARGET_LOCALE]
          )[0];
        }
      })
    );
    // console.log(`translatedText: ${JSON.stringify(translatedText)}`);

    // Set translated text in target range
    targetRange.setValues(translatedText);
    // Complete
    ui.alert('Complete: Translation has been completed.');
  } catch (error) {
    console.error(error.stack);
    ui.alert(error.message);
  }
}

/**
 * Call the DeepL API on the `translate` endpoint
 * @param sourceText Array of texts to translate
 * @param sourceLocale The language of the source text
 * @param targetLocale The language to be translated into
 * @returns Array of translated texts.
 * @see https://www.deepl.com/docs-api/translate-text/
 */
export function deepLTranslate(
  sourceText: string | string[],
  sourceLocale: string | null | undefined,
  targetLocale: string
): string[] {
  const endpoint = 'translate';
  let sourceTextCasted: string;
  if (!sourceText || sourceText.length === 0) {
    throw new Error(`[${ADDON_NAME}] Empty input.`);
  }
  if (Array.isArray(sourceText)) {
    sourceTextCasted = sourceText
      .map((text) => `text=${encodeURIComponent(text)}`)
      .join('&');
  } else {
    sourceTextCasted = `text=${encodeURIComponent(sourceText)}`;
  }
  // console.log(`sourceTextCasted: ${sourceTextCasted}`);

  // API key
  const apiKey = getDeepLApiKey();
  const baseUrl = getDeepLApiBaseUrl(apiKey);
  // Call the DeepL API
  let url =
    baseUrl +
    endpoint +
    `?auth_key=${apiKey}&target_lang=${targetLocale}&${sourceTextCasted}`;
  if (sourceLocale) {
    url += `&source_lang=${sourceLocale}`;
  }
  // console.log(`url: ${url}`);

  // Call the DeepL API translate request
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  // Handle DeepL API errors
  handleDeepLErrors(response);

  const translatedTextObj: DeepLTranslationResponse = JSON.parse(
    response.getContentText()
  );
  const translatedText: string[] = translatedTextObj.translations.map(
    (translationsResponse: DeepLTranslationObj): string =>
      translationsResponse.text
  );
  // console.log(`translatedText: ${JSON.stringify(translatedText)}`);

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
  type: DeepLLanguageType = 'source'
): DeepLSupportedLanguages[] {
  const endpoint = 'languages';
  // API key
  const apiKey = getDeepLApiKey();
  const baseUrl = getDeepLApiBaseUrl(apiKey);
  // Call the DeepL API
  let url = baseUrl + endpoint + `?auth_key=${apiKey}&type=${type}`;
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

  // Handle DeepL API errors
  handleDeepLErrors(response);

  return JSON.parse(response.getContentText());
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
 * @param response The UrlFetchApp.fetch response from the DeepL API
 * @see https://www.deepl.com/docs-api/api-access/error-handling/
 */
export function handleDeepLErrors(
  response: GoogleAppsScript.URL_Fetch.HTTPResponse
): void {
  const responseCode = response.getResponseCode();
  if (responseCode === 429) {
    throw new Error(
      `[${ADDON_NAME}] Too Many Requests: Try again after some time.`
    );
  } else if (responseCode === 456) {
    throw new Error(
      `[${ADDON_NAME}] Quota Exceeded: The translation limit of your account has been reached.`
    );
  } else if (responseCode >= 500) {
    throw new Error(
      `[${ADDON_NAME}] Temporary errors in the DeepL service. Please retry after waiting for a while.`
    );
  } else if (responseCode !== 200) {
    throw new Error(
      `[${ADDON_NAME}] Error on Calling DeepL API: ${response.getContentText()}`
    );
  }
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
      `[${ADDON_NAME}] API Key Unavailable: Set the DeepL API Authentication Key from the Settings > Set Auth Key of the add-on menu.`
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
