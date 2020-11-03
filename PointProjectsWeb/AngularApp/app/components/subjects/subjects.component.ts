import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SubjectService } from '../../services/subject.service';
import { Subject } from '../../domainclasses';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonService } from '../../services/common.service';
import { BsModalService } from 'ngx-bootstrap/modal/bs-modal.service';
import { SubjectmodalComponent } from './subject/subjectmodal.component';
import { MessageboxService } from '../common/messagebox/messagebox.service';
import { MessageBoxType, MessageBoxCommand, MessageBoxCommandValue } from '../common/ModalDialog';
import { Settings } from '../../settings';
import { UserService } from '../../services/user.service';


@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.css']
})
export class SubjectsComponent implements OnInit {

  constructor(private subjectService: SubjectService,
  private commonService: CommonService,
  private modalService: BsModalService,
  private msgBoxService: MessageboxService,
  private userService: UserService) {  }

  subjects: Subject[] = [];
  errorMessage: string;
  successMessage: string;
  @Input()
  mode = SubjectListMode.list;
  @Output()
  onRequest = new EventEmitter<any>();
  dateFormat = Settings.dateFormatnoTime;
  user = this.userService.User;

  modes = Object.assign({}, SubjectListMode);

  ngOnInit() {
    if (this.user.isAdmin) {
      this.mode = SubjectListMode.edit;
    }
    this.subjectService.getSubjects().subscribe(data => this.subjects = data,
      (err: HttpErrorResponse)  => {
        this.errorMessage = this.commonService.getError(err);
      });
  }

  getCourses(s: Subject) {
    return s.courses.map(c => c.shortname).join(', ');
  }

  edit(s: Subject) {
    const modal = this.modalService.show(SubjectmodalComponent);
    modal.content.title = 'Uredi temu';
    modal.content.Subject = s;
    modal.content.onOk.subscribe(subject => {
      Object.assign(s, subject);
    });
  }

  addNew() {
    const s = new Subject();
    s.courses = [];
    const modal = this.modalService.show(SubjectmodalComponent);
    modal.content.title = 'Kreiraj novu temu';
    modal.content.Subject = s;
    modal.content.onOk.subscribe(subject => {
      this.subjects.push(subject);
    });
  }

  request(s: Subject) {
    this.onRequest.emit(s);
  }

  delete(id: number) {
    const msgBox = this.msgBoxService.openDialog('Obrisati temu?', MessageBoxType.Yesno).subscribe( (data: MessageBoxCommand) => {
      if (data.value === MessageBoxCommandValue.Ok) {
        this.subjectService.delete(id).subscribe( d => {
          const index = this.subjects.findIndex(s => s.id === id);
          if (index >= 0) {
            this.subjects.splice(index, 1);
          }
          this.errorMessage = '';
          this.successMessage = 'Tema uspješno obrisana';
        },
        err => this.errorMessage =  this.commonService.getError(err));
      }
    });
  }

}

export enum SubjectListMode {
  edit,
  request,
  list
}
