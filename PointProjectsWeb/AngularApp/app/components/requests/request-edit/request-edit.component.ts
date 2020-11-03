import { Component, OnInit, Input } from '@angular/core';
import { ProjectRequest, Subject, Course, RequestStatus, RequestComment, User } from '../../../domainclasses';
import { defineLocale } from 'ngx-bootstrap/chronos';
import { BsDatepickerConfig, BsLocaleService } from 'ngx-bootstrap/datepicker';
import { deLocale } from 'ngx-bootstrap/locale';

@Component({
  selector: 'app-request-edit',
  templateUrl: './request-edit.component.html',
  styleUrls: ['./request-edit.component.css']
})
export class RequestEditComponent implements OnInit {

  constructor(private bsLocaleService: BsLocaleService) {
    // defineLocale(enGbLocale.abbr, enGbLocale);
  this.bsConfig = new BsDatepickerConfig();
  defineLocale(deLocale.abbr, deLocale);
  this.bsLocaleService.use('de');
  // this.bsConfig.locale = enGbLocale.abbr;
  this.bsConfig.dateInputFormat = 'DD.MM.YYYY';
  }

  @Input()
  model: RequestEditModel = new RequestEditModel();
  bsConfig: BsDatepickerConfig;

  ngOnInit() {
  }

  getStatuses() {
    return this.model.statuses.filter(s => s.courses == null || s.courses.length === 0 ||
      s.courses.find(c => c.id === this.model.request.courseId) != null).sort((x, y) => x.seq > y.seq ? 1 : -1) ;
  }

}

export class RequestEditModel {
  request: ProjectRequest = new ProjectRequest();
  subjects: Subject[] = [];
  courses: Course[] = [];
  statuses: RequestStatus[] = [];
  comment: RequestComment = new RequestComment();
  user: User;

  constructor() {
    this.request = new ProjectRequest();
    this.comment = new RequestComment();
    this.user = new User();
  }

}


