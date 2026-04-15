import { TestBed } from '@angular/core/testing';

import { Ai, applyResponseGuardrail, isOffTopicPrompt, isPeriodDomainPrompt, isUrgentPrompt } from './ai';

describe('Ai', () => {
  let service: Ai;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [Ai]
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
})
