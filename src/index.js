const ADDON_NAME = 'sheetsL';

function onOpen() {
  SpreadsheetApp.getUi().createAddonMenu().addItem('Setup', 'setup').addToUi();
}

function onInstall() {
  onOpen();
}
