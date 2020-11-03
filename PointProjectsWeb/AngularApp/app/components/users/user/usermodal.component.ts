import { Component, OnInit, Injectable, EventEmitter } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { User } from '../../../domainclasses';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonService } from '../../../services/common.service';


@Component({
  selector: 'app-usermodal',
  templateUrl: './usermodal.component.html',
  styleUrls: ['./usermodal.component.css']
})
export class UsermodalComponent implements OnInit {

  constructor(private userService: UserService,
    private bsRefModal: BsModalRef,
    private commonService: CommonService) { }

  private user: User = new User();
  title: string;
  errorMessage: string;

  public onOk: EventEmitter<any> = new EventEmitter();
  public onCancel: EventEmitter<any> = new EventEmitter();

  ngOnInit() {

  }

  get User() {
    return this.user;
  }


  set User(value: User) {
    this.user = Object.assign({}, value);
  }

  ok() {
    this.userService.updateUser(this.user).subscribe(u => {
      this.onOk.emit(u);
      this.bsRefModal.hide();
    },
    (err: HttpErrorResponse)  => {
      this.errorMessage = this.commonService.getError(err);
    }
  );

  }

  cancel() {
    this.onCancel.emit();
    this.bsRefModal.hide();
  }
}
