import { Component, OnInit } from '@angular/core';
import { Recovery } from '../forgotpass/recovery';
import { ActivatedRoute, ActivatedRouteSnapshot, Router} from '@angular/router';
import { UserService } from '../../../services/user.service';
import { PasswordChange } from '../../../modelclasses';
import { AccountService } from '../../../services/account.service';
import { User } from '../../../domainclasses';
import { HttpErrorResponse } from '@angular/common/http/src/response';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-passrecovery',
  templateUrl: './passrecovery.component.html',
  styleUrls: ['./passrecovery.component.css']
})
export class PassrecoveryComponent implements OnInit {

  constructor(private route: ActivatedRoute,
    private userService: UserService,
    private accountService: AccountService,
    private commonService: CommonService,
    private router: Router) { }

  passChange: PasswordChange = new PasswordChange();
  successMessage: string;
  errorMessage: string;
  user: User;

  ngOnInit() {
    const data = this.route.snapshot.params.data;
    if (data != null) {
      this.passChange.id = data;
      this.accountService.checkRecoveryCode(data.toString()).subscribe(u => this.user = u,
        (err: HttpErrorResponse)  => {
          this.errorMessage = this.commonService.getError(err);
        });
    }
  }

  setPassword() {
    if (this.passChange.password !== this.passChange.password2) {
      this.errorMessage = 'Lozinke se razlikuju';
    } else {
        this.userService.updatePassword(this.passChange).subscribe( o => {
          this.accountService.login(this.user.username, this.passChange.password).subscribe(u => {
            if (u !== null) {
              this.router.navigate(['/']);
            } else {
              this.errorMessage = 'Nepredviđena pogreška. Obratite se administratoru.';
            }

          },
          err => this.errorMessage = this.commonService.getError(err));
        },
        err => this.errorMessage = this.commonService.getError(err));
    }
  }

}
