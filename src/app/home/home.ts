import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  isChatOpen = signal(false);

  toggleChat() {
    this.isChatOpen.update(val => !val);
  }
}