import { TestBed, inject } from '@angular/core/testing';

import { MessageboxService } from './messagebox.service';

describe('MessageboxService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MessageboxService]
    });
  });

  it('should be created', inject([MessageboxService], (service: MessageboxService) => {
    expect(service).toBeTruthy();
  }));
});
