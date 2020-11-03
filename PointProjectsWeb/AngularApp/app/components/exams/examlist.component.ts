import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Exam } from '../../domainclasses';
import { ExamService } from '../../services/exam.service';
import { CommonService } from '../../services/common.service';
import { UserService } from '../../services/user.service';
import { BsModalService } from 'ngx-bootstrap/modal/bs-modal.service';
import { ExameditmodalComponent } from './exameditmodal.component';
import { MessageBoxCommand, MessageBoxCommandValue, MessageBoxType } from '../common/ModalDialog';
import { MessageboxService } from '../common/messagebox/messagebox.service';
import { ExamData } from '../../modelclasses';


@Component({
  selector: 'app-examlist',
  templateUrl: './examlist.component.html',
  styleUrls: ['./examlist.component.css']
})
export class ExamlistComponent implements OnInit {

  constructor(private examService: ExamService,
  private commonService: CommonService,
  private userService: UserService,
  private bsModalService: BsModalService,
  private msgBoxService: MessageboxService) { }

  modes = Object.assign({}, ExamListMode);
  exams: Exam[] = [];
  errorMessage = '';
  successMessage = '';
  @Input()
  mode = ExamListMode.Administration;
  user = this.userService.User;
  dateFormat = 'dd.MM.yyyy HH:mm';
  @Output()
  onApplied = new EventEmitter<ExamData>();

  ngOnInit() {
    this.examService.getForCurrentUser().subscribe(data => {
      data.forEach(e => this.examService.getDatesFromJson(e));
      this.exams = data;
    } ,
    err => this.errorMessage = this.commonService.getError(err));

    if (!this.user.isAdmin) {
      this.mode = ExamListMode.Applying;
    }
  }

  addNew() {
    const modal = this.bsModalService.show(ExameditmodalComponent);
    modal.content.courses = this.user.administeredCourses;
    modal.content.exam = new Exam();
    modal.content.onCommand.subscribe((c: MessageBoxCommand) => {
      if (c.value === MessageBoxCommandValue.Ok) {
        c.data.requests = [];
        c.data.examDateTime = new Date(c.data.examDateTime);
        this.exams.push(c.data);
      }
    });

  }

  edit(e: Exam) {
    const modal = this.bsModalService.show(ExameditmodalComponent);
    modal.content.courses = this.user.administeredCourses;
    modal.content.title = 'Uredi obranu';
    const examCopy: Exam = this.commonService.deepClone(e);

    examCopy.examDateTime = new Date(examCopy.examDateTime);
    modal.content.exam = examCopy;
    modal.content.onCommand.subscribe((c: MessageBoxCommand) => {
      if (c.value === MessageBoxCommandValue.Ok) {
        this.examService.getDatesFromJson(c.data);
        Object.assign(e, c.data);
      }
    });
  }

  apply(e: Exam) {
    this.msgBoxService.openDialog(`Prijaviti obranu ${this.commonService.formatDateTime(e.examDateTime)}?`, MessageBoxType.Yesno).subscribe(
      (m: MessageBoxCommand) => {
        if (m.value === MessageBoxCommandValue.Ok) {
          this.examService.apply(e.id).subscribe(ed => {
            this.onApplied.emit(ed);
          },
          err => this.errorMessage = this.commonService.getError(err));
        }
      }
    );

  }

  delete(e: Exam) {
    let hasRequests = false;
    if (e.requests.length > 0) {
      hasRequests = e.requests.find(r => r.dateCancelled == null || r.dateApplied > r.dateCancelled) != null;
    }
    if (hasRequests) {
      this.msgBoxService.openDialog('Ispit ne može biti obrisan jer ima aktivnih prijava.');
    } else {
      this.msgBoxService.openDialog('Obrisati ispit?', MessageBoxType.Yesno, 'Potvrda brisanja').subscribe((c: MessageBoxCommand) => {
        if (c.value === MessageBoxCommandValue.Ok) {
          this.examService.deleteExam(e.id).subscribe(d =>  {
            const index = this.exams.findIndex(ex => ex.id === e.id);
            if (index >= 0) {
              this.exams.splice(index, 1);
            }
          },
          err => this.errorMessage = this.commonService.getError(err));
        }
      });
    }

  }

  showRequests(e: Exam) {
    this.examService.getExam(e.id).subscribe(exam => {
        const students = exam.requests.map(r => r.request.createdBy.name + ' ' + r.request.createdBy.surname).join(', ');
        this.msgBoxService.openDialog(students);
    });
  }

}

export enum ExamListMode {
  Administration,
  Applying
}
