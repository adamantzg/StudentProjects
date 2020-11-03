import { Component, OnInit, Injectable, EventEmitter } from '@angular/core';
import { SubjectService } from '../../../services/subject.service';
import { Subject, Course } from '../../../domainclasses';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonService } from '../../../services/common.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-subjectmodal',
  templateUrl: './Subjectmodal.component.html',
  styleUrls: ['./Subjectmodal.component.css']
})
export class SubjectmodalComponent implements OnInit {

  constructor(private subjectService: SubjectService,
    private bsRefModal: BsModalRef,
    private commonService: CommonService,
  private userService: UserService) { }

  private subject: Subject = new Subject();
  title: string;
  errorMessage: string;
  courses: Course[] = [];

  public onOk: EventEmitter<any> = new EventEmitter();
  public onCancel: EventEmitter<any> = new EventEmitter();

  ngOnInit() {
    this.courses = this.userService.User.administeredCourses;

  }

  get Subject() {
    return this.subject;
  }


  set Subject(value: Subject) {
    this.subject = Object.assign({}, value);
    this.courses.forEach(c => c.selected = this.subject.courses.find(sc => sc.id === c.id) != null);
  }

  ok() {
    this.subject.courses = this.courses.filter(c => c.selected);
    this.subjectService.updateSubject(this.subject).subscribe(s => {
      this.onOk.emit(s);
      this.bsRefModal.hide();
      },
      (err: HttpErrorResponse)  => {
        this.errorMessage = this.commonService.getError(err);
      }
    );
  }

  cancel() {
    this.onCancel.emit();
    this.bsRefModal.hide();
  }
}
