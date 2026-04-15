import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';

import { Chat } from './chat';
import { Ai } from '../services/ai/ai';

describe('Chat', () => {
  let component: Chat
  let fixture: ComponentFixture<Chat>
  const aiServiceMock = {
    messages: signal([] as Array<{ role: 'user' | 'assistant', text: string }>),
    isLoading: signal(false),
    askGemini: vi.fn(),
    clearMessages: vi.fn()
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [{ provide: Ai, useValue: aiServiceMock }]
    }).compileComponents()

    fixture = TestBed.createComponent(Chat)
    component = fixture.componentInstance
    await fixture.whenStable()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should send messages to Ai service', () => {
    component.sendMessage('Need cycle advice')

    expect(aiServiceMock.askGemini).toHaveBeenCalledWith('Need cycle advice')
  })
})
