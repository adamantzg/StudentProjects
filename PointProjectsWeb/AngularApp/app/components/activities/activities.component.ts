import { Component, OnInit, Input } from '@angular/core';
import { RequestLog, User, CommentFile, ProjectRequest } from '../../domainclasses';
import { RequestService } from '../../services/request.service';
import { UserService } from '../../services/user.service';
import { Settings } from '../../settings';

@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css']
})
export class ActivitiesComponent implements OnInit {

  constructor(private requestService: RequestService,
  private userService: UserService) { }

  @Input()
  activities: RequestLog[] = [];
  @Input()
  user: User;
  dateFormat = Settings.dateFormatwTime;
  ngOnInit() {
  }

  getFileUrl(f: CommentFile) {
    let url = this.requestService.getFileUrl(f);
    url += '&Authorization=' + encodeURIComponent(this.userService.getUserToken());
    return url;
  }

  getSubjectText(r: ProjectRequest) {
    if (r.subject != null) {
      return r.subject.name;
    }
    return r.subjectText;
  }

}
