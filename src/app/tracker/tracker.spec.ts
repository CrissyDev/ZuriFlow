import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { Tracker } from './tracker';
import { LogData } from '../services/log-data/log-data';
import { AuthState } from '../services/auth-state/auth-state';
import { Ai } from '../services/ai/ai';

describe('Tracker', () => {
  let component: Tracker;
  let fixture: ComponentFixture<Tracker>;
  const logDataMock = {
    getLogs: () => of([]),
    savePeriodEntry: async () => {}
  }
  const authStateMock = {
    isLoading: signal(false),
    isAuthenticated: signal(false),
    uid: signal<string | null>(null),
    authState$: of(null),
    ensureSignedIn: async () => 'uid',
    signOutUser: async () => {}
  }
  const aiMock = {
    messages: signal([] as Array<{ role: 'user' | 'assistant', text: string }>),
    isLoading: signal(false),
    askGemini: () => Promise.resolve(),
    clearMessages: () => {}
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tracker],
      providers: [
        { provide: LogData, useValue: logDataMock },
        { provide: AuthState, useValue: authStateMock },
        { provide: Ai, useValue: aiMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tracker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
