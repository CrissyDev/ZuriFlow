import { Component, signal, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Chat } from '../chat/chat';
import { LogData, PeriodEntry } from '../services/log-data/log-data';
import { AuthState } from '../services/auth-state/auth-state';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, Chat],
  templateUrl: './tracker.html',
  styleUrl: './tracker.css'
})
export class Tracker implements OnInit, OnDestroy {
  private logService = inject(LogData);
  authState = inject(AuthState);
  private authSubscription?: Subscription;
  private logsSubscription?: Subscription;
  showForm = signal(false);
  isChatOpen = signal(false);
  intensity = signal('Normal');
  selectedSymptoms = signal<string[]>([]);
  logs = signal<PeriodEntry[]>([]);
  authNotice = signal('Sign in to save and sync your period history.');

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
    this.authSubscription = this.authState.authState$.subscribe({
      next: (user) => {
        this.logsSubscription?.unsubscribe();
        if (!user) {
          this.logs.set([]);
          this.authNotice.set('Sign in to save and sync your period history.');
          return;
        }

        this.authNotice.set(`Signed in. Your logs are private to user ${user.uid.slice(0, 6)}...`);
        this.logsSubscription = this.logService.getLogs(user.uid).subscribe({
          next: (data: PeriodEntry[]) => {
            this.logs.set(data);
          },
          error: (err: unknown) => {
            console.error('Firebase sync error:', err);
            this.authNotice.set('Could not sync logs right now. Try refreshing.');
          }
        });
      },
      error: (err: unknown) => {
        console.error('Auth stream error:', err);
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.logsSubscription?.unsubscribe();
  }

  async signIn() {
    try {
      await this.authState.ensureSignedIn();
    } catch (error: unknown) {
      console.error('Sign in failed:', error);
      alert('Sign in failed. Please try again.');
    }
  }

  async signOut() {
    try {
      await this.authState.signOutUser();
      this.showForm.set(false);
    } catch (error: unknown) {
      console.error('Sign out failed:', error);
      alert('Sign out failed. Please try again.');
    }
  }

  toggleSymptom(name: string) {
    this.selectedSymptoms.update((s) =>
      s.includes(name)
        ? s.filter(x => x !== name)
        : [...s, name]
    );
  }

  async saveEntry(start: string, end: string, notes: string) {
    const uid = this.authState.uid();
    if (!uid) {
      alert('Please sign in before saving a period log.');
      return;
    }

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
      await this.logService.savePeriodEntry(uid, newEntry);
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