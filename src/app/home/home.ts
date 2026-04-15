import { Component, signal } from '@angular/core';
import { HowItWorks } from '../how-it-works/how-it-works';
import { FinalCta } from '../final-cta/final-cta';
import { Chat } from '../chat/chat';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HowItWorks, 
    FinalCta, 
    Chat
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  isChatOpen = signal(false)

  openChat () {
    this.isChatOpen.set(true)
  }

  closeChat () {
    this.isChatOpen.set(false)
  }
}