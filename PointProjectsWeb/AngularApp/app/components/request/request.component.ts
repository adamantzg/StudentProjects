import { Component, OnInit } from '@angular/core';
import { RequestLog, ProjectWorkflow, ProjectRequest, RequestStatusId } from '../../domainclasses';
import { Settings } from '../../settings';
import { UserService } from '../../services/user.service';
import { RequestService } from '../../services/request.service';
import { CommonService } from '../../services/common.service';
import { ActivatedRoute } from '@angular/router';
import { RequestEventData } from '../../modelclasses';

@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.css']
})
export class RequestComponent implements OnInit {

  constructor(public userService: UserService,
    public requestService: RequestService,
    public commonService: CommonService,
    public activatedRoute: ActivatedRoute) { }

  successMessage = '';
  errorMessage = '';
  user = this.userService.User;
  logs: RequestLog[] = [];
  uploadLimit = Settings.uploadLimit;
  requests: ProjectRequest[] = [];

  workflows: ProjectWorkflow[] = [];

  ngOnInit() {
    if (this.requests.length === 0 && this.logs.length === 0) {
      this.requestService.getRequestsForIds([this.activatedRoute.snapshot.params.id]).subscribe(
        data => {
          data.requests.forEach(r => {
            this.requestService.getDatesFromJson(r);
          });
          this.requests = data.requests;
          data.logs.forEach(l => l.dateCreated = new Date(l.dateCreated));
          this.logs = data.logs;
          this.workflows = data.workflows;
        },
        err => this.errorMessage = this.commonService.getError(err) );
    }
  }

  activeRequests(): ProjectRequest[] {
    return this.requests.filter(r => r.statusId !== RequestStatusId.RequestCancelled && r.statusId !== RequestStatusId.PassedExam);
  }

  onCommentCreate(log: RequestLog) {
    const request = this.requests.find(r => r.id === log.comment.requestId);
    if (request != null) {
      let r = log.request;
      if (r == null) {
        r = log.comment.request;
      }
      if (r != null) {
        request.status = r.status;
        request.statusId = r.status.id;
      }

    }
    this.logs.splice(0, 0, log);

  }

  getRequestSubjects() {
    return this.requests.map(r => r.subject != null ? r.subject.name : r.subjectText).join(', ');
  }

  onError(text: string) {
    this.errorMessage = text;
  }

  onRequestListChange(data: RequestEventData) {
    data.log.dateCreated = new Date(data.log.dateCreated);
    this.logs.push(data.log);
  }


}
