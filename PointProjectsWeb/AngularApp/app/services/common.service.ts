import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import * as moment from 'moment';

@Injectable()
export class CommonService {

  constructor() { }

  getError(err: HttpErrorResponse): string {
    if (err.error instanceof Error) {
      return err.error.message;
    }

    if (typeof(err.error) === 'string') {
      return err.error;
    }


    return err.message;
  }

  deepClone(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  formatDateTime(d: Date) {
    return moment(d).format('DD.MM.YYYY HH:mm');
  }

}
