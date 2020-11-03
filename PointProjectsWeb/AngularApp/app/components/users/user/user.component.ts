import { Component, OnInit, Input, EventEmitter } from '@angular/core';
import { User } from '../../../domainclasses';
import { UserService } from '../../../services/user.service';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonService } from '../../../services/common.service';
import { ActivatedRoute } from '@angular/router';
import { PasswordChange } from '../../../modelclasses';


@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  constructor(private userService: UserService,
    private commonService: CommonService,
    private route: ActivatedRoute) { }

  title: string;
  @Input()
  showPassword = false;
  @Input()
  passwordChange = new PasswordChange();

  @Input()
  User: User = new User();

  errorMessage: string;
  userNameError: string;
  userNameSuccess: string;
  loggedInUser: User = new User();

  ngOnInit() {
    this.loggedInUser = this.userService.User;

  }

  get IsAdmin() {
    if (this.loggedInUser == null) {
      return false;
    }
    return this.loggedInUser.isAdmin;
  }

  generateCode() {
    this.userService.generateCode().subscribe( data => this.User.registrationCode = data);
  }

  checkUsername() {
    this.userNameSuccess = null;
    this.userNameError = null;
    this.userService.checkUsername(this.User.id, this.User.username).subscribe(s => this.userNameSuccess = s.toString(),
    (err: HttpErrorResponse)  => {
      this.userNameError = this.commonService.getError(err);
    });
  }


}
