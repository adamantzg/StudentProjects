import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestEditmodalComponent } from './request-editmodal.component';

describe('RequestEditmodalComponent', () => {
  let component: RequestEditmodalComponent;
  let fixture: ComponentFixture<RequestEditmodalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestEditmodalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestEditmodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
