import { Component, OnInit, EventEmitter } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap';
import { RequestService } from '../../../services/request.service';
import { CommonService } from '../../../services/common.service';
import { ProjectRequest, Subject, User, RequestStatusId, RequestComment } from '../../../domainclasses';
import { MessageBoxCommand, MessageBoxCommandValue } from '../../common/ModalDialog';


@Component({
  selector: 'app-changesubjectmodal',
  templateUrl: './changesubjectmodal.component.html',
  styleUrls: ['./changesubjectmodal.component.css']
})
export class ChangesubjectmodalComponent implements OnInit {

  constructor(private bsModalRef: BsModalRef,
  private requestService: RequestService,
  private commonService: CommonService) { }

  request: ProjectRequest = new ProjectRequest();
  user: User;
  subjects: Subject[] = [];
  title = 'Promijeni temu';
  errorMessage = '';
  selection = { type: '1'};
  onCommand = new EventEmitter<MessageBoxCommand>();

  ngOnInit() {
  }

  ok() {
    if (+this.selection.type === 1) {
      this.request.subjectText = '';
    } else {
      this.request.subjectId = null;
    }

    this.request.statusId = RequestStatusId.SubjectWaitingApproval;
    this.request.comments = [];
    const c = new RequestComment();
    c.text = this.request.comment;
    this.request.comments.push(c);
    this.requestService.updateRequest(this.request).subscribe( data => {
      this.onCommand.emit(new MessageBoxCommand(MessageBoxCommandValue.Ok, data));
      this.bsModalRef.hide();
    },
    err => this.errorMessage = this.commonService.getError(err));
  }

  cancel() {
    this.onCommand.emit(MessageBoxCommand.getCancel());
    this.bsModalRef.hide();
  }

}
