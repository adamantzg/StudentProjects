import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Exam, Course } from '../../domainclasses';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { enGbLocale } from 'ngx-bootstrap';

@Component({
  selector: 'app-examedit',
  templateUrl: './examedit.component.html',
  styleUrls: ['./examedit.component.css']
})
export class ExameditComponent implements OnInit, OnChanges {


  constructor() { }

  @Input()
  exam: Exam = new Exam();
  @Input()
  courses: Course[] = [];

  examTime: Date;
  bsConfig: BsDatepickerConfig;

  ngOnInit() {

  }

  ngOnChanges(changes: SimpleChanges): void {

  }

}
