import { EventEmitter } from '@angular/core';

export interface IModalDialog {
    onCommand: EventEmitter<MessageBoxCommand>;
}

export enum MessageBoxType {
    Ok,
    Yesno,
    YesNoComment
  }

  export class MessageBoxCommand {
    value: MessageBoxCommandValue;
    data: any;
    constructor(value: MessageBoxCommandValue, data?: any) {
        this.value = value;
        this.data = data;
    }

    static getCancel() {
        return new MessageBoxCommand(MessageBoxCommandValue.Cancel);
    }

    static getOk(data?: any) {
        return new MessageBoxCommand(MessageBoxCommandValue.Ok, data);
    }

  }

  export enum MessageBoxCommandValue {
    Ok,
    Cancel
  }
