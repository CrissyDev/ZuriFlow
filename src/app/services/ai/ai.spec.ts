import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import {
  Ai,
  applyResponseGuardrail,
  buildAdviceContext,
  buildCycleSummary,
  isOffTopicPrompt,
  isPeriodDomainPrompt,
  isUrgentPrompt
} from './ai';
import { LogData } from '../log-data/log-data';
import { AuthState } from '../auth-state/auth-state';

describe('Ai', () => {
  let service: Ai
  const logDataMock = {
    getRecentLogs: vi.fn().mockResolvedValue([])
  }
  const authStateMock = {
    uid: vi.fn<() => string | null>(() => null)
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    await TestBed.configureTestingModule({
      providers: [
        Ai,
        { provide: LogData, useValue: logDataMock },
        { provide: AuthState, useValue: authStateMock }
      ]
    }).compileComponents()
    service = TestBed.inject(Ai)
  })

  it('should create', () => {
    expect(service).toBeTruthy()
  })

  it('should detect period-domain prompts', () => {
    expect(isPeriodDomainPrompt('My period is 10 days late')).toBe(true)
    expect(isPeriodDomainPrompt('Who is the president of Kenya?')).toBe(false)
  })

  it('should detect off-topic prompts for soft redirect', () => {
    expect(isOffTopicPrompt('Who is the president of Kenya?')).toBe(true)
    expect(isOffTopicPrompt('How can I track missed periods?')).toBe(false)
  })

  it('should detect urgent symptom prompts', () => {
    expect(isUrgentPrompt('I have severe pain and dizziness')).toBe(true)
    expect(isUrgentPrompt('I have mild cramps before my period')).toBe(false)
  })

  it('should enforce off-topic soft redirect response', () => {
    const result = applyResponseGuardrail('William Ruto is the president.', 'Who is the president of Kenya?')
    expect(result).toContain('period and cycle health')
  })

  it('should enforce urgent escalation phrasing when missing', () => {
    const result = applyResponseGuardrail('You can rest and monitor symptoms.', 'I have severe pain and fainting')
    expect(result.toLowerCase()).toContain('urgent')
    expect(result.toLowerCase()).toContain('medical care')
  })

  it('should immediately soft-redirect off-topic prompt in service flow', async () => {
    await service.askGemini('Who is the president of Kenya?')
    const messages = service.messages()
    expect(messages.length).toBe(2)
    expect(messages[0].role).toBe('user')
    expect(messages[1].role).toBe('assistant')
    expect(messages[1].text).toContain('period and cycle health')
  })

  it('should build cycle summary from logs', () => {
    const summary = buildCycleSummary([
      { start: '2026-01-01', end: '2026-01-05', intensity: 'Normal', symptoms: ['Cramps', 'Fatigue'] },
      { start: '2026-01-30', end: '2026-02-02', intensity: 'Heavy', symptoms: ['Cramps'] },
      { start: '2026-02-28', end: '2026-03-03', intensity: 'Light', symptoms: ['Headache'] }
    ])

    expect(summary.averageCycleLengthDays).toBe(29)
    expect(summary.topSymptoms[0]).toBe('Cramps')
    expect(summary.hasEnoughData).toBe(true)
  })

  it('should include personalization context in prompt', () => {
    const adviceContext = buildAdviceContext('My period is late', {
      totalLogs: 3,
      averageCycleLengthDays: 31,
      recentIntensity: ['Heavy', 'Normal'],
      topSymptoms: ['Cramps', 'Bloating'],
      hasEnoughData: true
    })

    expect(adviceContext).toContain('Average cycle length: 31 days')
    expect(adviceContext).toContain('Top symptoms: Cramps, Bloating')
    expect(adviceContext).toContain('User question: My period is late')
  })

  it('should use user log summary before asking the model', async () => {
    authStateMock.uid.mockReturnValue('user-1')
    logDataMock.getRecentLogs.mockResolvedValue([
      { start: '2026-01-01', end: '2026-01-04', intensity: 'Normal', symptoms: ['Cramps'] },
      { start: '2026-01-30', end: '2026-02-02', intensity: 'Heavy', symptoms: ['Cramps', 'Fatigue'] }
    ])

    const sendMessageMock = vi.fn().mockResolvedValue({
      response: Promise.resolve({
        text: () => 'Here is your personalized advice.'
      })
    })

    ;(service as any).model = {
      startChat: () => ({
        sendMessage: sendMessageMock
      })
    }

    await service.askGemini('My cycle has been painful')

    expect(logDataMock.getRecentLogs).toHaveBeenCalledWith('user-1', 12)
    expect(sendMessageMock).toHaveBeenCalledTimes(1)
    expect(sendMessageMock.mock.calls[0][0]).toContain('Use the following private tracker summary')
    expect(sendMessageMock.mock.calls[0][0]).toContain('User question: My cycle has been painful')
  })
})
