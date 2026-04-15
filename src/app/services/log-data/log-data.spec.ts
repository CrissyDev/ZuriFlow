import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogData } from './log-data';

describe('LogData', () => {
  let component: LogData;
  let fixture: ComponentFixture<LogData>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogData],
    }).compileComponents();

    fixture = TestBed.createComponent(LogData);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
