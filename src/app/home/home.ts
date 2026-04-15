import { Component, signal } from '@angular/core';
import { Chat } from '../chat/chat';

@Component({
  selector: 'app-home',
  imports: [Chat],
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