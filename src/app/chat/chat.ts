import { Component, inject, output } from '@angular/core';
import { Ai } from '../services/ai/ai';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.html',
  styleUrl: './chat.css'
})
export class Chat {
  aiService = inject(Ai);
  close = output<void>();

  sendMessage(text: string) {
    if (text) {
      this.aiService.askGemini(text);
    }
  }

  closeChat() {
    this.close.emit();
  }
}