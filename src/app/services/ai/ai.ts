import { Injectable, inject, signal } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../../environments/environment';
import { PeriodEntry, LogData } from '../log-data/log-data';
import { AuthState } from '../auth-state/auth-state';

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
const PERSONALIZATION_ERROR_CONTEXT = 'User data could not be loaded for this answer.'
const DAY_IN_MS = 24 * 60 * 60 * 1000

export type CycleSummary = {
  totalLogs: number,
  averageCycleLengthDays: number | null,
  recentIntensity: string[],
  topSymptoms: string[],
  hasEnoughData: boolean
}

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

function parseDateOrNull (value: string) {
  if (!value) {
    return null
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

export function buildCycleSummary (logs: PeriodEntry[]): CycleSummary {
  if (logs.length === 0) {
    return {
      totalLogs: 0,
      averageCycleLengthDays: null,
      recentIntensity: [],
      topSymptoms: [],
      hasEnoughData: false
    }
  }

  const entriesWithValidStart = logs
    .map((entry) => ({ ...entry, startDate: parseDateOrNull(entry.start) }))
    .filter((entry) => entry.startDate !== null)
    .sort((a, b) => (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0))

  const cycleLengths = entriesWithValidStart
    .slice(1)
    .map((entry, index) => {
      const previous = entriesWithValidStart[index].startDate
      const current = entry.startDate
      if (!previous || !current) {
        return null
      }

      return Math.round((current.getTime() - previous.getTime()) / DAY_IN_MS)
    })
    .filter((length): length is number => length !== null && length > 0 && length < 90)

  const averageCycleLengthDays = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length)
    : null

  const symptomFrequency = logs
    .flatMap((entry) => entry.symptoms || [])
    .reduce<Record<string, number>>((counts, symptom) => {
      counts[symptom] = (counts[symptom] || 0) + 1
      return counts
    }, {})

  const topSymptoms = Object.entries(symptomFrequency)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([symptom]) => symptom)

  const recentIntensity = logs
    .slice(0, 3)
    .map((entry) => entry.intensity)
    .filter(Boolean)

  return {
    totalLogs: logs.length,
    averageCycleLengthDays,
    recentIntensity,
    topSymptoms,
    hasEnoughData: logs.length >= 2
  }
}

export function buildAdviceContext (prompt: string, summary: CycleSummary) {
  const averageCycleLength = summary.averageCycleLengthDays === null
    ? 'Not enough data'
    : `${summary.averageCycleLengthDays} days`

  const topSymptoms = summary.topSymptoms.length === 0
    ? 'No symptom trend yet'
    : summary.topSymptoms.join(', ')

  const recentIntensity = summary.recentIntensity.length === 0
    ? 'No intensity trend yet'
    : summary.recentIntensity.join(', ')

  const dataConfidence = summary.hasEnoughData
    ? 'Use the summary to personalize recommendations.'
    : 'The dataset is limited. Give cautious advice and ask one clarifying question.'

  return [
    'Use the following private tracker summary for personalization when relevant:',
    `- Total logs: ${summary.totalLogs}`,
    `- Average cycle length: ${averageCycleLength}`,
    `- Recent intensity: ${recentIntensity}`,
    `- Top symptoms: ${topSymptoms}`,
    `- Data quality note: ${dataConfidence}`,
    '',
    `User question: ${prompt}`
  ].join('\n')
}

@Injectable({
  providedIn: 'root'
})
export class Ai {
  private logService = inject(LogData)
  private authState = inject(AuthState)
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
      const contextualPrompt = await this.buildContextualPrompt(normalizedPrompt)
      const result = await chat.sendMessage(contextualPrompt)
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

  private async buildContextualPrompt (prompt: string) {
    const uid = this.authState.uid()
    if (!uid) {
      return `${PERSONALIZATION_ERROR_CONTEXT}\nUser question: ${prompt}`
    }

    try {
      const recentLogs = await this.logService.getRecentLogs(uid, 12)
      const summary = buildCycleSummary(recentLogs)
      return buildAdviceContext(prompt, summary)
    } catch (error) {
      console.error('Unable to load user logs for AI context:', error)
      return `${PERSONALIZATION_ERROR_CONTEXT}\nUser question: ${prompt}`
    }
  }
}