# TUMHackathon

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Gemini Setup

This app calls Gemini directly from the Angular client.

Set your key in:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Example:

```ts
export const environment = {
  production: false,
  geminiApiKey: 'YOUR_API_KEY_HERE'
}
```

## Verify the AI Agent Works

After adding your Gemini key, use this flow to confirm the assistant is working:

1. Start the app:

```bash
npm start
```

2. Open `http://localhost:4200/`
3. Click **Chat with AI Agent**
4. Send these test prompts:
   - Period-specific: `My period is 10 days late. What should I track this week?`
   - Off-topic: `Who is the president of Kenya?`
   - Urgent symptom: `I have severe pain, very heavy bleeding, and dizziness right now.`

Expected behavior:
- Period-specific prompt -> period/cycle guidance
- Off-topic prompt -> gentle redirect back to period/cycle topics
- Urgent symptom prompt -> empathetic but firm urgent-care guidance

If you see `Sorry, I couldn't respond right now. Please try again.`:
- confirm the Gemini API key is valid
- restart `npm start`
- check browser console for Gemini API errors (quota, model availability, invalid key)

## Agent Guardrail Snippets

The assistant is intentionally constrained to period and menstrual-health topics.

### 1) System guardrail prompt

```ts
export const PERIOD_GUARDRAIL_PROMPT = `
You are Zuri, a menstrual health and period tracking assistant.
Only support period tracking, menstrual symptoms, cycle irregularities, and PCOS education.
If off-topic, softly redirect back to period/cycle questions.
For severe symptoms, respond with empathetic but firm urgent-care guidance.
Do not provide diagnosis claims or medication dosage instructions.
`.trim()
```

### 2) Off-topic soft redirect

```ts
export function isOffTopicPrompt (text: string) {
  const normalized = text.toLowerCase()
  return OFF_TOPIC_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

if (isOffTopicPrompt(normalizedPrompt)) {
  this.messages.update((current) => [
    ...current,
    {
      role: 'assistant',
      text: 'I can best help with period and cycle health. I can help with missed periods, cramps, flow changes, or PCOS questions.'
    }
  ])
  return
}
```

### 3) Urgent symptom escalation

```ts
export function isUrgentPrompt (text: string) {
  const normalized = text.toLowerCase()
  return URGENT_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

const hasUrgentLanguage = /urgent|emergency|immediately|seek care|doctor/i.test(cleanText)
if (isUrgentPrompt(prompt) && !hasUrgentLanguage) {
  return `I am sorry you are going through this. Because your symptoms may be serious, please seek urgent in-person medical care now. ${cleanText}`
}
```

### 4) Model configuration

```ts
private model = this.genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: PERIOD_GUARDRAIL_PROMPT
})
```

## Tracker Data Shape Snippet

This is the shape currently used by the tracker log entries:

```ts
const newEntry = {
  start,
  end,
  notes,
  intensity: this.intensity(),
  symptoms: this.selectedSymptoms()
}
```
