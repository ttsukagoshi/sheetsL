import { setDeeplAuthKey } from '../src/sheetsl';

enum ButtonSet {
  OK_CANCEL,
}

enum Button {
  OK,
  CANCEL,
}

SpreadsheetApp.getUi = jest.fn(() => new MockUi()) as any;
PropertiesService.getUserProperties = jest.fn(() => ({
  setProperty: jest.fn((key: string, value: string) =>
    console.log(`key: ${key}, value: ${value}`)
  ),
})) as any;

class MockUi {
  ButtonSet: ButtonSet;
  Button: Button;
  constructor() {
    this.ButtonSet = ButtonSet.OK_CANCEL;
    this.Button = Button.OK;
  }
  prompt(message: string, buttonset: ButtonSet) {
    return new MockPromptResponse(message, buttonset);
  }
  alert(message: string) {
    console.log(message);
  }
}

class MockPromptResponse {
  responseText: string;
  buttonset: ButtonSet;
  constructor(message: string, buttonset: ButtonSet) {
    this.responseText = message;
    this.buttonset = buttonset;
  }
  getResponseText() {
    return this.responseText;
  }
  getSelectedButton = jest
    .fn()
    .mockReturnValueOnce(Button.OK)
    .mockReturnValueOnce(Button.CANCEL)
    .mockReturnValueOnce(undefined)
    .mockReturnValue(Button.OK);
}
