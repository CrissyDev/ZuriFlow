import { Injectable, signal } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Ai {
  // Pulling the key from environment instead of hardcoding
  private genAI = new GoogleGenerativeAI(environment.geminiApiKey);
  private model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  messages = signal<{role: string, text: string}[]>([]);
  isLoading = signal(false);

  async askGemini(prompt: string) {
    if (!prompt.trim()) return;

    // Add user message to UI
    this.messages.update(m => [...m, { role: 'user', text: prompt }]);
    this.isLoading.set(true);

    try {
      const chat = this.model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: "You are Zuri, an empathetic AI assistant for the Zuri Flow period tracker app. You specialize in PCOS and menstrual health. Always be professional, supportive, and provide evidence-based info. Remind users you are not a doctor if they ask for medical diagnosis." }],
          },
          {
            role: "model",
            parts: [{ text: "Hello! I am Zuri. I'm here to provide information and support regarding your cycle and PCOS health. How can I help you today?" }],
          },
        ],
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      
      this.messages.update(m => [...m, { role: 'model', text: response.text() }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      this.messages.update(m => [...m, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      this.isLoading.set(false);
    }
  }
}