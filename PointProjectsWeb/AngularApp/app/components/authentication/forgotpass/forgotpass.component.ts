import { Component, OnInit } from '@angular/core';
import { Recovery } from './recovery';
import { AccountService } from '../../../services/account.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonService } from '../../../services/common.service';

@Component({
  selector: 'app-forgotpass',
  templateUrl: './forgotpass.component.html',
  styleUrls: ['./forgotpass.component.css']
})
export class ForgotpassComponent implements OnInit {

  constructor(private accountService: AccountService, private commonService: CommonService) { }

  recovery: Recovery = new Recovery();
  successMessage: string;
  errorMessage: string;

  ngOnInit() {
  }

  sendRecoveryLink() {
    this.accountService.sendRecoveryLink(this.recovery.email).subscribe(
      m => this.successMessage = m.toString(),
      (err: HttpErrorResponse)  => {
        this.errorMessage = this.commonService.getError(err);
      });
  }


}
