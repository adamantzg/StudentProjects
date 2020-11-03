import { Injectable, EventEmitter } from '@angular/core';

@Injectable()
export class BlockUIService {

    public blockUIEvent: EventEmitter<any>;

    constructor() {
        this.blockUIEvent = new EventEmitter();
    }

    public startBlock() {
        // settimeout - hack to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout((() => this.blockUIEvent.emit(true)), 0);
    }

    public stopBlock() {
      setTimeout((() => this.blockUIEvent.emit(false)), 0);
    }
}
