import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortenedTextComponent } from './shortened-text.component';

describe('ShortenedTextComponent', () => {
  let component: ShortenedTextComponent;
  let fixture: ComponentFixture<ShortenedTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShortenedTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShortenedTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
