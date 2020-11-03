import { TestBed, inject } from '@angular/core/testing';

import { BlockUIService } from './block-ui.service';

describe('BlockUiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BlockUIService]
    });
  });

  it('should be created', inject([BlockUIService], (service: BlockUIService) => {
    expect(service).toBeTruthy();
  }));
});
