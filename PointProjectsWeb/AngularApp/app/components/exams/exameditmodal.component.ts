import { Component, OnInit, EventEmitter } from '@angular/core';
import { MessageBoxCommand, MessageBoxCommandValue } from '../common/ModalDialog';
import { ExamService } from '../../services/exam.service';
import { CommonService } from '../../services/common.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Exam, Course } from '../../domainclasses';
import { NgForm } from '@angular/forms';
import { BsDatepickerConfig, enGbLocale } from 'ngx-bootstrap';

@Component({
  selector: 'app-exameditmodal',
  templateUrl: './exameditmodal.component.html',
  styleUrls: ['./exameditmodal.component.css']
})
export class ExameditmodalComponent implements OnInit {

  constructor(private examService: ExamService,
  private commonService: CommonService,
  private bsModalRef: BsModalRef) { }

  errorMessage = '';
  validationMessage = '';
  showValidation = false;
  title = 'Nova obrana';
  exam: Exam = new Exam();
  courses: Course[] = [];
  onCommand = new EventEmitter<MessageBoxCommand>();
  bsConfig = new BsDatepickerConfig();

  ngOnInit() {
    // this.bsConfig.locale = enGbLocale.abbr;
    this.bsConfig.dateInputFormat = 'DD.MM.YYYY';
  }

  ok(form: NgForm) {
    if (form.valid) {
      const data = this.commonService.deepClone(this.exam);
      data.course = null;
      data.createdBy = null;
      this.examService.createOrUpdate(data).subscribe(e => {
        const command = MessageBoxCommand.getOk(e);
        this.onCommand.emit(command);
        this.bsModalRef.hide();
      },
    err => this.errorMessage = this.commonService.getError(err));
    } else {
      this.showValidation = true;
      this.validationMessage = 'Unesite sve potrebne podatke.';
    }
  }

  cancel() {
    this.onCommand.emit(MessageBoxCommand.getCancel());
    this.bsModalRef.hide();
  }

}
