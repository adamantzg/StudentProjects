import { Component, OnInit } from '@angular/core';
import { User } from './domainclasses';
import { AccountService } from './services/account.service';
import { UserService } from './services/user.service';
import { Router } from '@angular/router';
import { BlockUIService } from './services/block-ui.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [AccountService, UserService]
})
export class AppComponent implements OnInit {
  title = 'app';
  user: User;
  blockUI = 0;

  constructor(private accountService: AccountService,
    private userService: UserService,
    private router: Router,
    private blockUIService: BlockUIService) {

  }

  ngOnInit() {
    this.user = this.userService.loadUser();
    /*this.userService.getCurrentUser().subscribe(u => {
      if (u != null) {
        this.user = u;
      } else {
        this.router.navigate(['/login']);
      }
    });*/
    this.blockUIService.blockUIEvent.subscribe(event => this.blockUnBlockUI(event));
    this.userService.userSetEvent.subscribe(u => {
      this.user = u;
    });
  }

  logout() {
    this.accountService.logout();
    this.router.navigate(['login']);
  }

  private blockUnBlockUI(event) {
    if (event) {
      this.blockUI++;
    } else {
      this.blockUI--;
    }

  }
}
