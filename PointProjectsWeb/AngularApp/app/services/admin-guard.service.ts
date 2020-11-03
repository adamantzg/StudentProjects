import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { RouterStateSnapshot, Router, CanActivate } from '@angular/router';


@Injectable()
export class AdminGuard implements CanActivate {

  constructor(private userService: UserService, private router: Router) {

  }

  canActivate() {
    if (this.userService.User != null && this.userService.User.isAdmin) {
      return true;
    }
    this.router.navigate(['/login']);
    return false;
  }
}
