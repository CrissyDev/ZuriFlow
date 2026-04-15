import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chat } from '../chat/chat';
import { LogData, PeriodEntry } from '../services/log-data/log-data';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, Chat],
  templateUrl: './tracker.html',
  styleUrl: './tracker.css'
})
export class Tracker implements OnInit {
  private logService = inject(LogData);
  showForm = signal(false);
  isChatOpen = signal(false);
  intensity = signal('Normal');
  selectedSymptoms = signal<string[]>([]);
  logs = signal<PeriodEntry[]>([]);

  symptomsList = [
    'Cramps',
    'Bloating',
    'Headache',
    'Fatigue',
    'Back pain',
    'Breast tenderness',
    'Mood changes',
    'Acne'
  ];

  ngOnInit() {
    this.logService.getLogs().subscribe({
      next: (data: PeriodEntry[]) => {
        this.logs.set(data);
      },
      error: (err: unknown) => {
        console.error("Firebase sync error:", err);
      }
    });
  }

  toggleSymptom(name: string) {
    this.selectedSymptoms.update((s) =>
      s.includes(name)
        ? s.filter(x => x !== name)
        : [...s, name]
    );
  }

  async saveEntry(start: string, end: string, notes: string) {
    if (!start) {
      alert('Start date is required');
      return;
    }

    const newEntry: PeriodEntry = {
      start,
      end,
      notes,
      intensity: this.intensity(),
      symptoms: this.selectedSymptoms()
    };

    try {
      await this.logService.savePeriodEntry(newEntry);
      this.resetForm();
      alert('Period logged and synced with Zuri AI!');
    } catch (error: unknown) {
      console.error("Firebase Save Error:", error);
      alert('Failed to save log. Please check your connection.');
    }
  }

  private resetForm() {
    this.showForm.set(false);
    this.selectedSymptoms.set([]);
    this.intensity.set('Normal');
  }

  openChat() {
    this.isChatOpen.set(true);
  }

  closeChat() {
    this.isChatOpen.set(false);
  }
}