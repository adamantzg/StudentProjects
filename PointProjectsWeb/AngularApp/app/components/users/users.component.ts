import { Component, OnInit } from '@angular/core';
import { User, Group, Course, UserGroup } from '../../domainclasses';
import { UserService } from '../../services/user.service';
import { HttpErrorResponse } from '@angular/common/http/src/response';
import { CommonService } from '../../services/common.service';
import { forEach } from '@angular/router/src/utils/collection';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { UserComponent } from './user/user.component';
import { UsermodalComponent } from './user/usermodal.component';
import { Settings } from '../../settings';
import { MessageboxService } from '../common/messagebox/messagebox.service';
import { MessageBoxType, MessageBoxCommand, MessageBoxCommandValue } from '../common/ModalDialog';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {

  constructor(private userService: UserService,
    private commonService: CommonService,
    private modalService: BsModalService,
    private messageBoxService: MessageboxService) { }

  users: User[] = [];
  group: Group = new Group();
  groups: Group[] = [];
  courses: Course[];
  errorMessage: string;
  successMessage: string;
  all: boolean;
  dateFormat = Settings.dateFormatnoTime;
  dateFormatTime = Settings.dateFormatwTime;

  ngOnInit() {
    if (this.userService.User != null) {
      this.userService.getGroups(this.userService.User.id).subscribe(data => {
        this.groups = data;
        this.courses = this.userService.User.administeredCourses;
        this.prepareUserCourses(data);
        if (data.length > 0) {
          this.group = data[0];
        }
      },
      (err: HttpErrorResponse)  => {
        this.errorMessage = this.commonService.getError(err);
      }
    );
    }

  }

  prepareUserCourses(groups: Group[]) {
    groups.forEach(g => {
      g.users.forEach(u => {
        this.prepareCourse(u);
      });
    });
  }


  prepareCourse(u: User)  {
      if (this.userService.User.administeredCourses != null) {
          u.coursesDict = {};
          this.userService.User.administeredCourses.forEach(c => {
              u.coursesDict[c.id] = u.enrolledCourses.find(ec => ec.id === c.id) != null;
          });
      }
  }

  checkAll() {
    this.group.users.forEach(u => u.selected = this.all);
  }

  updateUserCourse(u: User, c: Course) {
    this.userService.updateUserCourse(u.id, c.id, !u.coursesDict[c.id]).subscribe();
  }

  editUser(u: User) {
    const modal = this.modalService.show(UsermodalComponent);
    modal.content.title = 'Uredi korisnika';
    modal.content.User = u;
    modal.content.onOk.subscribe(user => {
      Object.assign(u, user);
    });
  }

  newUser() {
    const u = new User();
    const ug = new UserGroup();
    ug.groupId = this.group.id;
    u.groups = [ug];
    const modal = this.modalService.show(UsermodalComponent);
    modal.content.title = 'Kreiraj novog korisnika';
    modal.content.User = u;
    modal.content.onOk.subscribe(user => {
      this.prepareCourse(user);
      this.group.users.push(user);
      user.courses = [];
    });
  }

  deleteUser(u: User) {
    this.messageBoxService.openDialog('Obrisati korisnika?', MessageBoxType.Yesno).subscribe( (c: MessageBoxCommand) => {
      if (c.value === MessageBoxCommandValue.Ok) {
        this.userService.deleteUser(u.id).subscribe( d => {
          const index = this.group.users.findIndex(us => us.id === u.id);
          if (index >= 0) {
            this.group.users.splice(index, 1);
          }
        },
        err => this.errorMessage = this.commonService.getError(err));
      }
    });
  }

  sendCode(u: User) {
    this._sendCodes([u]);
  }

  sendCodes() {
    this._sendCodes(this.usersSelected());
  }

  private _sendCodes(users: User[]) {
    this.userService.sendCodes(users.map(u => u.id)).subscribe( (data: any) => {
      this.successMessage = data.message;
      users.forEach( u => u.dateCodeSent = new Date(data.dateSent));
    },
    (err: HttpErrorResponse)  => {
      this.errorMessage = this.commonService.getError(err);
    }
  );
  }

  usersSelected(): User[] {
    return this.group.users.filter(u => u.selected);
  }

}
