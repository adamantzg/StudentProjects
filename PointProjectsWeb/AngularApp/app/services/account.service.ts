import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Settings } from '../settings';
import { Observable } from 'rxjs';
import { User } from '../domainclasses';
import { format } from 'util';
import { UserService } from './user.service';
import { tap } from 'rxjs/operators';
import { HttpService } from './http.service';
import { escape } from 'querystring';

@Injectable()
export class AccountService {

  static user: User;

  constructor(private http: HttpClient,
    private userService: UserService,
    private httpService: HttpService ) { }

  api = Settings.apiRoot;

  logout() {
    this.userService.clearUser();
  }

  register(code: string): Observable<User> {
    return this.httpService.post<User>(this.api + 'register?registrationCode=' + code, null);
  }

  login(username: string, password: string): Observable<User> {

    return this.httpService.post<User>(this.api + `login?username=${username}&password=${encodeURIComponent(password)}`, null).
      pipe(
        tap((u: any) => {
          if (u != null) {
            this.userService.saveUser(u);
          }
        })
      );
  }

  sendRecoveryLink (email: string) {
    return this.httpService.post(this.api + 'recoveryLink?email=' + email, null);
  }

  checkRecoveryCode (code: string): Observable<User> {
    return this.httpService.post<User>(this.api + 'checkRecoveryCode', {data: code});
  }



}
