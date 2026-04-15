import { Component, inject, output } from '@angular/core';
import { Ai } from '../services/ai/ai';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat {
  aiService = inject(Ai)
  close = output<void>()

  sendMessage (text: string, input?: HTMLInputElement) {
    const normalizedText = text.trim()
    if (!normalizedText) {
      return
    }

    this.aiService.askGemini(normalizedText)
    if (input) {
      input.value = ''
    }
  }

  closeChat () {
    this.close.emit()
  }

  startNewChat () {
    if (this.aiService.isLoading()) {
      return
    }

    this.aiService.clearMessages()
  }

  isAssistantMessage (role: string) {
    return role === 'assistant'
  }

  formatMessageText (text: string, role: string) {
    const normalizedText = text.replace(/\r\n/g, '\n').trim()
    if (!this.isAssistantMessage(role)) {
      return normalizedText
    }

    return normalizedText
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/([.!?])\s+(?=\d+\.\s)/g, '$1\n\n')
      .replace(/\s*(\d+\.\s+)/g, '\n$1')
      .replace(/\s*(-\s+)/g, '\n$1')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }
}