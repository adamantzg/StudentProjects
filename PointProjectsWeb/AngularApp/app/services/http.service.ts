import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { BlockUIService } from './block-ui.service';
import { Observable } from 'rxjs';
// import 'rxjs/add/operator/map';
import { tap, catchError } from 'rxjs/operators';


@Injectable()
export class HttpService {

    constructor(private http: HttpClient, private blockUIService: BlockUIService) {
    }

    public post<T>(url: string, object?: any): Observable<T> {

        this.blockUIService.startBlock();

        /*if (typeof (Storage) !== 'undefined') {

            let token = localStorage.getItem("CodeProject.Angular4.Token");
            headers.append('Authorization', token);
        }*/


        return this.http.post<T>(url, object, {headers: this.BuildHeaders()}).pipe(
          tap(
            obj => this.blockUIService.stopBlock(),
            obj => this.blockUIService.stopBlock()
          )
        );

    }

    public delete(url: string) {
        this.blockUIService.startBlock();
        return this.http.delete(url, {headers: this.BuildHeaders()}).pipe(
            tap(
              obj => this.blockUIService.stopBlock(),
              obj => this.blockUIService.stopBlock()
            )
          );
    }


    public postNoBlock<T>(url: string, object: any): Observable<T> {

      return this.http.post<T>(url, object, {headers: this.BuildHeaders()});
    }

    public get<T>(url: string, options?: any): Observable<any> {
      // let opt: any;
      /*if (options && options.params) {
        opt = { params: null };
        opt.params = new HttpParams();
        for (const key in options.params) {
          if (options.params.hasOwnProperty(key)) {
            opt.params.append(key, options.params[key]);
          }
        }
      }*/

      this.blockUIService.startBlock();

      if (options == null) {
          options = {};
      }


      options.headers = this.BuildHeaders();

      return this.http.get<T>(url, options).pipe(
        tap(
          obj => this.blockUIService.stopBlock(),
          obj => this.blockUIService.stopBlock()
        ));
    }


    private handleError(error: any, blockUIService: BlockUIService, blocking: Boolean) {

        const body = error.json();

        if (blocking) {
            blockUIService.blockUIEvent.emit({
                value: false
            });
        }

        return Observable.throw(body);

    }

    private parseResponse(response: Response, blockUIService: BlockUIService, blocking: Boolean) {

        const authorizationToken = response.headers.get('Authorization');
        if (authorizationToken != null) {

            if (typeof (Storage) !== 'undefined') {
                localStorage.setItem('pointprojects_token', authorizationToken);
            }
        }

        if (blocking) {
            blockUIService.blockUIEvent.emit({
                value: false
            });
        }

        const body = response.json();

        return body;
    }

    private BuildHeaders(): HttpHeaders {
      let headers = new HttpHeaders();
      headers = headers.append('Content-Type', 'application/json; charset=utf-8');
      headers = headers.append('Accept', 'q=0.8;application/json;q=0.9');

      if (typeof (Storage) !== 'undefined') {

          const token = localStorage.getItem('pprojects_user_token');
          if (token != null) {
            headers = headers.append('Authorization', token);
          }

      }
      return headers;
    }


}
