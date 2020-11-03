import { Component, OnInit } from '@angular/core';
import { User } from '../../../domainclasses';
import { UserService } from '../../../services/user.service';
import { CommonService } from '../../../services/common.service';
import { PasswordChange } from '../../../modelclasses';

@Component({
  selector: 'app-userdata',
  templateUrl: './userdata.component.html',
  styleUrls: ['./userdata.component.css']
})
export class UserDataComponent implements OnInit {

  constructor(
    private userService: UserService,
    private commonService: CommonService
  ) { }

  user: User = new User();
  passwordChange: PasswordChange = new PasswordChange();
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.user = this.userService.User;
    this.passwordChange.password = '';
    this.passwordChange.password2 = '';
  }

  save() {
    this.userService.updateUser(this.user).subscribe(d => {
      this.userService.saveUser(this.user);
      // const passChange: PasswordChange = {code: '', id: null, password: this.user.password, password2: this.user.password2};
      if (this.passwordChange.password.length > 0) {
        this.userService.updatePassword(this.passwordChange).subscribe( p => this.successMessage = 'Podaci uspješno spremljeni',
        err => this.errorMessage = this.commonService.getError(err));
      } else {
        this.successMessage = 'Podaci uspješno spremljeni';
      }

    },
    err => this.errorMessage = this.commonService.getError(err));
  }

}
