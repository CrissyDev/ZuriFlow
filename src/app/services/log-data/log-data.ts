import { Injectable } from '@angular/core';
import {
  Timestamp,
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { firebaseDb } from '../firebase-client';

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
  private getUserLogCollection(uid: string) {
    return collection(firebaseDb, `users/${uid}/period-logs`);
  }

  async savePeriodEntry(uid: string, entry: PeriodEntry): Promise<void> {
    try {
      await addDoc(this.getUserLogCollection(uid), {
        ...entry,
        timestamp: Timestamp.now() 
      });
    } catch (error: any) {
      console.error("Error saving log:", error);
      throw error;
    }
  }

  getLogs(uid: string): Observable<PeriodEntry[]> {
    const q = query(this.getUserLogCollection(uid), orderBy('timestamp', 'desc'));
    return new Observable<PeriodEntry[]>((subscriber) => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<PeriodEntry, 'id'>)
        }))
        subscriber.next(entries)
      }, (error) => {
        subscriber.error(error)
      })

      return () => unsubscribe()
    })
  }

  async getRecentLogs(uid: string, maxLogs = 12): Promise<PeriodEntry[]> {
    const q = query(this.getUserLogCollection(uid), orderBy('timestamp', 'desc'), limit(maxLogs));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<PeriodEntry, 'id'>)
    }));
  }
}