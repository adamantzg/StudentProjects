import { Component, OnInit, Input, EventEmitter } from '@angular/core';
import { ProjectRequest, RequestComment, Subject } from '../../../domainclasses';
import { MessageBoxCommand, MessageBoxCommandValue } from '../../common/ModalDialog';
import { BsModalRef } from 'ngx-bootstrap';
import { CommonService } from '../../../services/common.service';
import { RequestService } from '../../../services/request.service';

@Component({
  selector: 'app-approvemodal',
  templateUrl: './approvemodal.component.html',
  styleUrls: ['./approvemodal.component.css']
})
export class ApproveModalComponent implements OnInit {

  constructor(private bsModalRef: BsModalRef,
  private commonService: CommonService,
  private requestService: RequestService ) { }

  title = 'Odobri temu';
  errorMessage = '';
  okText = 'Odobri';
  options = { addSubject: false};
  @Input()
  request: ProjectRequest = new ProjectRequest();
  @Input()
  subjects: Subject[] = [];
  onCommand = new EventEmitter<MessageBoxCommand>();
  comment: RequestComment = new RequestComment();

  ngOnInit() {
  }

  ok() {
    this.request.comments = [];
    if (this.options.addSubject) {
      const subject = new Subject();
      subject.name = this.request.subjectText;
      subject.description = this.request.comment;
      this.request.subject = subject;
    }
    if (this.comment != null && this.comment.text != null && this.comment.text.length > 0) {
        this.request.comments.push(this.comment);
    }
    this.requestService.approveRequest(this.request).subscribe( data => {
      this.onCommand.emit(new MessageBoxCommand(MessageBoxCommandValue.Ok, data));
      this.bsModalRef.hide();
    },
    err => this.errorMessage = this.commonService.getError(err) );
  }

  cancel() {
    this.onCommand.emit(MessageBoxCommand.getCancel());
    this.bsModalRef.hide();
  }

}
