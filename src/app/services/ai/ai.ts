import { Injectable, signal } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../../environments/environment';

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole,
  text: string
}

export const PERIOD_GUARDRAIL_PROMPT = `
You are Zuri, a menstrual health and period tracking assistant for Zuri Flow.

Scope rules:
- You only support period tracking, menstrual symptoms, cycle irregularities, PMS, spotting, cramps, fertility-window education, and PCOS education.
- If the user asks off-topic questions (politics, coding, finance, trivia, legal, unrelated health areas), give a short soft redirect:
  1) one brief acknowledgment
  2) a redirect to period/cycle health
  3) 2-3 example period questions they can ask.
- Do not provide diagnosis claims. Use educational language.
- Do not provide medication dosage instructions.
- If details are missing, ask up to 2 clarifying questions.

Emergency handling:
- If user mentions severe pain, very heavy bleeding, fainting/dizziness, pregnancy concern with severe pain, chest pain, trouble breathing, or self-harm thoughts:
  - respond with empathetic but firm urgency
  - advise urgent in-person medical care now
  - keep guidance practical and concise
  - avoid delay-focused home-only advice.

Response style:
- Keep answers structured and readable.
- Use short sections and bullet points when useful.
- End with a brief safety note when symptoms are severe or persistent.
`.trim()

const OFF_TOPIC_KEYWORDS = [
  'president', 'prime minister', 'election', 'capital of', 'football',
  'javascript', 'typescript', 'react', 'next.js', 'python', 'coding',
  'stock', 'bitcoin', 'crypto', 'lawsuit', 'contract', 'visa'
]

const PERIOD_DOMAIN_KEYWORDS = [
  'period', 'menstrual', 'cycle', 'pcos', 'spotting', 'ovulation',
  'cramp', 'bleeding', 'flow', 'pms', 'missed period', 'late period'
]

const URGENT_KEYWORDS = [
  'severe pain', 'very heavy bleeding', 'soaking', 'fainting',
  'dizziness', 'passed out', 'chest pain', 'trouble breathing',
  'suicidal', 'self-harm'
]

const GENERIC_ERROR_MESSAGE = "Sorry, I couldn't respond right now. Please try again."
const DOMAIN_REDIRECT_MESSAGE = 'I can best help with period and cycle health. I cannot help with unrelated topics, but I can help you track missed periods, cramps, flow changes, or PCOS questions.'

export function isPeriodDomainPrompt (text: string) {
  const normalized = text.toLowerCase()
  return PERIOD_DOMAIN_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

export function isOffTopicPrompt (text: string) {
  const normalized = text.toLowerCase()
  if (isPeriodDomainPrompt(normalized)) {
    return false
  }

  return OFF_TOPIC_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

export function isUrgentPrompt (text: string) {
  const normalized = text.toLowerCase()
  return URGENT_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

export function applyResponseGuardrail (responseText: string, prompt: string) {
  const cleanText = responseText.trim()
  if (!cleanText) {
    return GENERIC_ERROR_MESSAGE
  }

  if (isOffTopicPrompt(prompt)) {
    return DOMAIN_REDIRECT_MESSAGE
  }

  if (!isUrgentPrompt(prompt)) {
    return cleanText
  }

  const hasUrgentLanguage = /urgent|emergency|immediately|seek care|doctor/i.test(cleanText)
  if (hasUrgentLanguage) {
    return cleanText
  }

  return `I am sorry you are going through this. Because your symptoms may be serious, please seek urgent in-person medical care now. ${cleanText}`
}

@Injectable({
  providedIn: 'root'
})
export class Ai {
  private genAI = new GoogleGenerativeAI(environment.geminiApiKey)
  private model = this.genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: PERIOD_GUARDRAIL_PROMPT
  })

  messages = signal<ChatMessage[]>([])
  isLoading = signal(false)

  async askGemini (prompt: string) {
    const normalizedPrompt = prompt.trim()
    if (!normalizedPrompt || this.isLoading()) {
      return
    }

    this.messages.update((currentMessages) => [...currentMessages, { role: 'user', text: normalizedPrompt }])
    this.isLoading.set(true)

    if (isOffTopicPrompt(normalizedPrompt)) {
      this.messages.update((currentMessages) => [...currentMessages, { role: 'assistant', text: DOMAIN_REDIRECT_MESSAGE }])
      this.isLoading.set(false)
      return
    }

    try {
      const history = this.messages()
        .slice(0, -1)
        .map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: message.text }]
        }))

      const chat = this.model.startChat({
        history,
        generationConfig: {
          temperature: 0.4
        }
      })
      const result = await chat.sendMessage(normalizedPrompt)
      const response = await result.response
      const assistantText = applyResponseGuardrail(response.text(), normalizedPrompt)
      if (!assistantText || assistantText === GENERIC_ERROR_MESSAGE) throw new Error('Assistant returned an empty response')

      this.messages.update((currentMessages) => [...currentMessages, { role: 'assistant', text: assistantText }])
    } catch (error) {
      console.error('Assistant error:', error)
      this.messages.update((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: GENERIC_ERROR_MESSAGE }
      ])
    } finally {
      this.isLoading.set(false)
    }
  }

  clearMessages () {
    this.messages.set([])
  }
}