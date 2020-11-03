import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangesubjectmodalComponent } from './changesubjectmodal.component';

describe('ChangesubjectmodalComponent', () => {
  let component: ChangesubjectmodalComponent;
  let fixture: ComponentFixture<ChangesubjectmodalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangesubjectmodalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangesubjectmodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
