import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExameditmodalComponent } from './exameditmodal.component';

describe('ExameditmodalComponent', () => {
  let component: ExameditmodalComponent;
  let fixture: ComponentFixture<ExameditmodalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExameditmodalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExameditmodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
