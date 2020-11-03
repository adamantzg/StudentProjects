import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectmodalComponent } from './subjectmodal.component';

describe('SubjectmodalComponent', () => {
  let component: SubjectmodalComponent;
  let fixture: ComponentFixture<SubjectmodalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SubjectmodalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubjectmodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
