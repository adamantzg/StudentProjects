import { Component, OnInit } from '@angular/core';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { Registration, LoginData, PasswordChange } from '../../../modelclasses';
import { AccountService } from '../../../services/account.service';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../../services/user.service';
import { CommonService } from '../../../services/common.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  errorMessage: string;
  errorMessageReg: string;
  registrationButtonText = 'Pošalji kod';
  registration: Registration = new Registration();
  verified = false;
  loginData: LoginData = new LoginData();


  constructor(
    private accountService: AccountService,
    private userService: UserService,
    private commonService: CommonService,
    private router: Router
  ) { }

  register() {
    if (!this.verified) {
      this.accountService.register(this.registration.registrationCode).subscribe(u => {
        if (u === null) {
          this.errorMessageReg = 'Neispravan registracijski kod';
        } else {
          this.registration.id = u.id;
          this.registration.username = u.username;
          this.verified = true;
          this.registrationButtonText = 'Završi registraciju';
        }

      },
      (err: HttpErrorResponse)  => {
        this.errorMessageReg = this.commonService.getError(err);
      }
    );
    } else {
        const data: PasswordChange = {
            id: null,
            code : this.registration.registrationCode,
            password : this.registration.password,
            password2: this.registration.password2
        };
        this.userService.updatePassword(data).subscribe(d => {
          this.accountService.login(this.registration.username, this.registration.password).subscribe(u => {
            this.router.navigate(['/']);
          },
          (err: HttpErrorResponse)  => {
            this.errorMessageReg = this.commonService.getError(err);
          }

        );
      },
      err => this.errorMessageReg = this.commonService.getError(err));
    }

  }

  login() {
    this.accountService.login(this.loginData.username, this.loginData.password).subscribe(u => {
      if (u != null) {
        this.router.navigate(['/']);
      } else {
        this.errorMessage = 'Neispravno korisničko ime ili lozinka';
      }

    },
    (err: HttpErrorResponse)  => {
      this.errorMessage = this.commonService.getError(err);
    });
  }

  ngOnInit() {
  }

}
