import { Component, OnInit } from '@angular/core';
import { ProjectRequest, Subject, RequestLog, RequestStatusId, Exam, ProjectWorkflow } from '../../domainclasses';
import { RequestService } from '../../services/request.service';
import { CommonService } from '../../services/common.service';
import { SubjectListMode } from '../subjects/subjects.component';
import { UserService } from '../../services/user.service';
import { BsModalService } from 'ngx-bootstrap';
import { RequestEditmodalComponent } from '../requests/request-edit/request-editmodal.component';
import { RequestEditModel } from '../requests/request-edit/request-edit.component';
import { MessageBoxCommand, MessageBoxCommandValue } from '../common/ModalDialog';
import { RequestData, RequestEventData, ExamData } from '../../modelclasses';
import { Settings } from '../../settings';
import { Router } from '@angular/router';
import { ExamService } from '../../services/exam.service';
import { ExamListMode } from '../exams/examlist.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private requestService: RequestService,
  private commonService: CommonService,
  private userService: UserService,
  private modalService: BsModalService,
  private router: Router,
  private examService: ExamService) { }

  requests: ProjectRequest[] = [];
  errorMessage = '';
  successMessage = '';
  subjectListModes = Object.assign({}, SubjectListMode);
  user = this.userService.User;
  logs: RequestLog[] = [];
  uploadLimit = Settings.uploadLimit;
  exams: Exam[] = [];
  workflows: ProjectWorkflow[] = [];
  examModes = Object.assign({}, ExamListMode);

  ngOnInit() {
    if (this.user == null) {
      this.router.navigate(['/login']);
    }
    if (this.requests.length === 0 && this.logs.length === 0) {
      this.requestService.getRequestsForCurrentUser().subscribe(
        data => {
          data.requests.forEach(r => {
            this.requestService.getDatesFromJson(r);
          });
          this.requests = data.requests;
          /*this.requests.forEach(r => {

          });*/
          data.logs.forEach(l => l.dateCreated = new Date(l.dateCreated));
          this.logs = data.logs;
          if (!this.user.isAdmin) {
            if (this.requests.find(r => r.statusId === RequestStatusId.CodeApprovedPendingExam) != null) {
              this.examService.getForCurrentUser().subscribe(exams => this.exams = exams);
            }
          }
          this.workflows = data.workflows;
        },
        err => this.errorMessage = this.commonService.getError(err) );
    }



  }

  newRequest(s: Subject) {
    const request = new ProjectRequest();
    request.subject = s;
    request.statusId = RequestStatusId.SubjectWaitingApproval;
    if (this.user.availableCourses.length === 1) {
      request.courseId = this.user.availableCourses[0].id;
    }
    if (s != null) {
      request.subjectId = s.id;
    }
    const modal = this.modalService.show(RequestEditmodalComponent);
    const editModel = new RequestEditModel();
    editModel.request = request;
    editModel.user = this.user;
    editModel.courses = this.user.availableCourses;
    modal.content.model = editModel;
    modal.content.okText = 'Prijavi';
    modal.content.title = 'Prijavi temu';
    modal.content.onCommand.subscribe((c: MessageBoxCommand) => {
      if (c.value === MessageBoxCommandValue.Ok && c.data != null) {
        const d: RequestData = c.data;
        this.requests.push(d.request);
        this.logs.push(d.log);
        this.userService.removeCourse(this.user, d.request.course);
        this.userService.saveUser(this.user);
      }
    });

  }

  onError(text: string) {
    this.errorMessage = text;
  }

  onRequestListChange(data: RequestEventData) {
    data.log.dateCreated = new Date(data.log.dateCreated);
    this.logs.push(data.log);
    if (data.log.requestStatusId === RequestStatusId.CodeApprovedPendingExam && data.exam != null) {
      if (this.exams.find(e => e.id === data.exam.id) == null) {
        this.exams.push(data.exam);
      }
    }
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

  showExams() {
    if (this.user == null || this.user.isAdmin) {
      return false;
    }
    return this.requests.find(r => r.statusId === RequestStatusId.CodeApprovedPendingExam && this.exams.length > 0) != null;
  }

  onExamApplied(ed: ExamData) {
    const req = this.requests.find(r => r.id === ed.log.requestId);
    if (req != null) {
      req.statusId = ed.log.requestStatusId;
      req.status = ed.log.request.status;
      req.examDateTime = new Date(ed.log.request.examDateTime);
    }
    const index = this.exams.findIndex(e => e.id === ed.exam.id);
    if (index >= 0) {
      this.exams.splice(index, 1);
    }
    this.logs.push(ed.log);
  }

  activeRequests(): ProjectRequest[] {
    return this.requests.filter(r => r.statusId !== RequestStatusId.RequestCancelled && r.statusId !== RequestStatusId.PassedExam);
  }

}
