import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ProjectRequest, RequestStatusId, RequestStatus, Subject, RequestComment } from '../../domainclasses';
import { UserService } from '../../services/user.service';
import { Settings } from '../../settings';
import { RequestService } from '../../services/request.service';
import { MessageboxService } from '../common/messagebox/messagebox.service';
import { MessageBoxCommand, MessageBoxType, MessageBoxCommandValue } from '../common/ModalDialog';
import { CommonService } from '../../services/common.service';
import { RequestData, RequestEventData } from '../../modelclasses';
import { BsModalService } from 'ngx-bootstrap';
import { ChangesubjectmodalComponent } from './changesubject/changesubjectmodal.component';
import { Observable, of } from 'rxjs';
// import { of } from 'rxjs/observable/of';
import { SubjectService } from '../../services/subject.service';
import { ApproveModalComponent } from './approve/approvemodal.component';
import { RequestEditmodalComponent } from './request-edit/request-editmodal.component';
import { RequestEditModel } from './request-edit/request-edit.component';
import { ExamService } from '../../services/exam.service';

@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.css']
})
export class RequestListComponent implements OnInit {

  constructor(private userService: UserService,
    private requestService: RequestService,
    private messageBoxService: MessageboxService,
    private commonService: CommonService,
    private bsModalService: BsModalService,
    private subjectService: SubjectService,
    private examService: ExamService
    ) { }

  @Input()
  requests: ProjectRequest[];
  subjects: Subject[] = [];
  user = this.userService.User;
  dateFormat = Settings.dateFormatwTime;
  @Input()
  displayOwnErrors = false;
  errorMessage = '';
  @Output()
  onError = new EventEmitter<string>();
  @Output()
  onChange = new EventEmitter<RequestData>();
  statuses: RequestStatus[] = [];

  ngOnInit() {
    this.requestService.getStatuses().subscribe(data => this.statuses = data);
  }

  checkButtonVisible(r: ProjectRequest, name: string): boolean {
    let statusList = [];
    const statuses = Object.assign({}, RequestStatusId);
    let exclude = true;
    switch (name) {
        case 'cancel':
            statusList = [statuses.ExamTimeSlotDecided, statuses.RequestCancelled, statuses.PassedExam];
            break;
        case 'refresh':
            return r.statusId === statuses.RequestCancelled &&
            this.requests.find(re => re.courseId === r.courseId && re.statusId !== statuses.RequestCancelled) == null;
        case 'approve':
        case 'reject':
            statusList = [statuses.RequestCreated, statuses.RequestReinstated, statuses.SubjectWaitingApproval];
            exclude = false;
            break;
        case 'changeSubject':
            statusList = [statuses.SubjectWaitingApproval, statuses.RequestCreated, statuses.RequestReinstated];
            exclude = false;
            break;
        case 'upload':
            statusList = [statuses.RequestCreated, statuses.RequestReinstated,
              statuses.SubjectWaitingApproval, statuses.RequestCancelled, statuses.SubjectRejected];
            break;
        case 'cancelExam':
            exclude = false;
            statusList = [statuses.ExamTimeSlotDecided];
            break;
    }
    return exclude ? statusList.indexOf(r.statusId) < 0 : statusList.indexOf(r.statusId) >= 0;
  }

  cancel(r: ProjectRequest) {
    this.messageBoxService.openDialog('Želite li poništiti prijavu teme ' + this.getSubjectName(r) + ' za predmet ' + r.course.name + '?',
    MessageBoxType.Yesno).
    subscribe((c: MessageBoxCommand) => {
        if (c.value === MessageBoxCommandValue.Ok) {
            this.requestService.cancelRequest(r.id).subscribe((d: RequestData) => {
                r.status = d.request.status;
                r.statusId = r.status.id;
                this.userService.addCourse(this.user, r.course);
                this.userService.saveUser(this.user);
                this.onChange.emit(new RequestEventData('cancel', d.request, d.log));
            },
        err => this.onError.emit(this.commonService.getError(err)));
        }
    });
  }

  reactivate(r: ProjectRequest) {
    this.messageBoxService.openDialog('Želite li reaktivirati temu ' + this.getSubjectName(r) + ' za predmet ' + r.course.name + '?',
    MessageBoxType.Yesno).
    subscribe((c: MessageBoxCommand) => {
        if (c.value === MessageBoxCommandValue.Ok) {
            this.requestService.reactivateRequest(r.id).subscribe((d: RequestData) => {
                r.status = d.request.status;
                r.statusId = r.status.id;
                this.userService.removeCourse(this.user, r.course);
                this.userService.saveUser(this.user);
                this.onChange.emit(new RequestEventData('reactivate', d.request, d.log));
            },
        err => this.onError.emit(this.commonService.getError(err)));
        }
    });
  }

  approve(r: ProjectRequest) {
    this.getSubjects().subscribe(subjects => {
        this.subjects = subjects;
        const dialog = this.bsModalService.show(ApproveModalComponent);
        dialog.content.subjects = subjects;
        dialog.content.request = this.commonService.deepClone(r);
        dialog.content.user = this.user;
        dialog.content.onCommand.subscribe((c: MessageBoxCommand) => {
            if (c.value === MessageBoxCommandValue.Ok) {
                const data: RequestData = c.data;
                const request = data.request;
                if (request != null) {
                    if (request.subject != null) {
                        r.subjectId = request.subjectId;
                    }
                    r.subject = request.subject;
                    r.status = request.status;
                    r.statusId = request.status.id;
                    if (request.comments != null) {
                        r.comments.push(request.comments[0]);
                    }
                    this.onChange.emit(new RequestEventData('approve', r, data.log));
                }
            }

        });
    });
  }

  reject(r: ProjectRequest) {
    this.messageBoxService.openDialog('', MessageBoxType.YesNoComment, 'Odbij temu', 'Odbij').
    subscribe((c: MessageBoxCommand) => {
        if (c.value === MessageBoxCommandValue.Ok) {
            this.requestService.setStatus(r.id, RequestStatusId.SubjectRejected, c.data).subscribe( data => {
                this.postSetStatus(r, data, 'reject');
            },
        err => this.errorMessage = this.commonService.getError(err));
        }
    });
  }

  private postSetStatus(request: ProjectRequest, data: RequestData, op: string) {
    const r = data.request;
    request.status = r.status;
    request.statusId = r.status.id;
    request.subject = r.subject;
    if (r.subject != null) {
        request.subjectId = r.subject.id;
    }
    if (data.comment != null) {
        if (request.comments == null) {
            request.comments = [];
        }
        request.comments.push(data.comment);
    }
    this.onChange.emit(new RequestEventData(op, r, data.log, data.comment));
  }

  changeSubject(r: ProjectRequest) {
    this.getSubjects().subscribe(subjects => {
        this.subjects = subjects;
        const dialog = this.bsModalService.show(ChangesubjectmodalComponent);
        dialog.content.subjects = subjects;
        dialog.content.request = this.commonService.deepClone(r);
        dialog.content.user = this.user;
        dialog.content.onCommand.subscribe((c: MessageBoxCommand) => {
            if (c.value === MessageBoxCommandValue.Ok) {
                const data: RequestData = c.data;
                const request = data.request;
                if (request != null) {
                    r.subjectId = request.subjectId;
                    r.subjectText = request.subjectText;
                    r.subject = request.subject;
                    r.status = request.status;
                    r.comment = request.comment;
                    this.onChange.emit(new RequestEventData('changeSubject', r, data.log));
                }
            }

        });
    });

  }

  getSubjects(): Observable<Subject[]> {
    if (this.subjects.length === 0) {
        return this.subjectService.getSubjects();
    }
    return of(this.subjects);
  }

  edit(r: ProjectRequest) {
    this.getSubjects().subscribe(subjects => {
        this.subjects = subjects;
        const request = this.commonService.deepClone(r);
        this.requestService.getDatesFromJson(request);
        const modal = this.bsModalService.show(RequestEditmodalComponent);
        const editModel = new RequestEditModel();
        editModel.request = request;
        editModel.subjects = subjects;
        editModel.user = this.user;
        editModel.statuses = this.statuses;
        editModel.courses = this.user.administeredCourses;
        modal.content.model = editModel;
        modal.content.okText = 'Spremi';
        modal.content.title = 'Uredi prijavu';
        modal.content.onCommand.subscribe((c: MessageBoxCommand) => {
          if (c.value === MessageBoxCommandValue.Ok && c.data != null) {
            const d: RequestData = c.data;
            Object.assign(r, d.request);
            this.onChange.emit(new RequestEventData('editRequest', r, d.log));
          }
        });
    });
  }

  cancelExam(r) {
      this.messageBoxService.openDialog('Odjaviti obranu (ispit)?', MessageBoxType.Yesno).subscribe((mc: MessageBoxCommand) => {
        if (mc.value === MessageBoxCommandValue.Ok) {
            this.examService.cancelExam(r.id).subscribe(ed => {
                r.status = ed.log.request.status;
                r.statusId = ed.log.requestStatusId;
                this.onChange.emit(new RequestData(ed.log.request, ed.log, null, ed.exam));
            },
            err => this.errorMessage = this.commonService.getError(err));
        }
      });
  }

  getSubjectName(r: ProjectRequest) {
    return r.subject != null ? r.subject.name : r.subjectText;
  }

  getStatus(r: ProjectRequest) {
    let value = r.status.name;
    if (r.statusId === RequestStatusId.ExamTimeSlotDecided && r.examDateTime != null) {
        value += ' ' + this.commonService.formatDateTime(r.examDateTime);
    }
    return value;
  }

}


