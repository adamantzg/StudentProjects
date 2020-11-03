import { Component, OnInit, EventEmitter } from '@angular/core';
import { RequestEditModel } from './request-edit.component';
import { IModalDialog, MessageBoxCommand, MessageBoxCommandValue } from '../../common/ModalDialog';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { RequestService } from '../../../services/request.service';
import { CommonService } from '../../../services/common.service';
import { RequestData } from '../../../modelclasses';

@Component({
  selector: 'app-request-editmodal',
  templateUrl: './request-editmodal.component.html',
  styleUrls: ['./request-editmodal.component.css']
})
export class RequestEditmodalComponent implements OnInit, IModalDialog {


  constructor(private bsModalRef: BsModalRef,
  private requestService: RequestService,
  private commonService: CommonService) { }

  errorMessage = '';
  title = '';
  model: RequestEditModel = new RequestEditModel();
  okText = 'Ok';
  onCommand = new EventEmitter<MessageBoxCommand>();

  ngOnInit() {
  }

  ok() {
    const data = this.commonService.deepClone(this.model.request);
    data.comments = [];
    if (this.model.comment.text != null && this.model.comment.text.length > 0) {
        data.comments.push(this.model.comment);
    }
    data.subject = null;
    this.requestService.updateRequest(data).subscribe((d: RequestData) => {
      this.onCommand.emit(new MessageBoxCommand(MessageBoxCommandValue.Ok, d));
      this.bsModalRef.hide();
    },
    err => this.errorMessage = this.commonService.getError(err));

  }

  cancel() {
    this.onCommand.emit(MessageBoxCommand.getCancel());
    this.bsModalRef.hide();
  }

}
