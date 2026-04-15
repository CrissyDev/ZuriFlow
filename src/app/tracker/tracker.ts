import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat } from '../chat/chat';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, Chat],
  templateUrl: './tracker.html',
  styleUrl: './tracker.css'
})
export class Tracker {
  showForm = signal(false)
  isChatOpen = signal(false)
  intensity = signal('Normal')
  selectedSymptoms = signal<string[]>([])
  logs = signal<any[]>([])

  symptomsList = ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Back pain', 'Breast tenderness', 'Mood changes', 'Acne']

  toggleSymptom (name: string) {
    this.selectedSymptoms.update((s) =>
      s.includes(name) ? s.filter(x => x !== name) : [...s, name]
    )
  }

  saveEntry (start: string, end: string, notes: string) {
    if (!start) return alert('Start date is required')

    const newEntry = {
      start, end, notes,
      intensity: this.intensity(),
      symptoms: this.selectedSymptoms()
    }

    this.logs.update(prev => [newEntry, ...prev])
    this.showForm.set(false)
    alert('Period logged successfully!')
  }

  openChat () {
    this.isChatOpen.set(true)
  }

  closeChat () {
    this.isChatOpen.set(false)
  }
}