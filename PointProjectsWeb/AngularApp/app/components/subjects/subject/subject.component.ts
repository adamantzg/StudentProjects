import { Component, OnInit, Input } from '@angular/core';
import { Subject, Course } from '../../../domainclasses';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrls: ['./subject.component.css']
})
export class SubjectComponent implements OnInit {

  constructor(private userService: UserService) { }

  private subject: Subject = new Subject();

  @Input()
  courses: Course[] = [];

  @Input()
  set Subject(value: Subject) {
    this.subject = value;

  }

  get Subject() {
    return this.subject;
  }


  ngOnInit() {

  }

}
