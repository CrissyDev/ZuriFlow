import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

/** Strong typing for your data */
export interface PeriodEntry {
  start: string;
  end: string;
  intensity: string;
  symptoms: string[];
  notes?: string;
  id?: string;
  timestamp?: Timestamp;
}

@Injectable({
  providedIn: 'root'
})
export class LogData {
  private firestore = inject(Firestore);
  private logCollection = collection(this.firestore, 'period-logs');

  /** SAVE to Firebase */
  async savePeriodEntry(entry: PeriodEntry): Promise<void> {
    try {
      await addDoc(this.logCollection, {
        ...entry,
        timestamp: Timestamp.now() // ✅ better than new Date()
      });
    } catch (error) {
      console.error("Error saving log to Firebase:", error);
      throw error;
    }
  }

  /** GET from Firebase */
  getLogs(): Observable<PeriodEntry[]> {
    const q = query(this.logCollection, orderBy('timestamp', 'desc'));

    return collectionData(q, { idField: 'id' }) as Observable<PeriodEntry[]>;
  }
}