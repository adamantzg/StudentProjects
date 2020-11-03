import { Injectable, EventEmitter } from '@angular/core';
import {BsModalService} from 'ngx-bootstrap';
import { MessageBoxType, MessageBoxCommand } from '../ModalDialog';
import { MessageboxComponent } from './messagebox.component';
import { Observable } from 'rxjs';


@Injectable()
export class MessageboxService {

  constructor(private bsModalService: BsModalService) { }

  openDialog(message: string, type: MessageBoxType = MessageBoxType.Ok, title?: string,
      okText: string = 'Ok', cancelText: string = 'Cancel'): EventEmitter<MessageBoxCommand> {
    const modal = this.bsModalService.show(MessageboxComponent);
    modal.content.text = message;
    modal.content.type = type;
    modal.content.title = title;
    modal.content.okText = okText;
    modal.content.cancelText = cancelText;
    return modal.content.onCommand;
  }
}


