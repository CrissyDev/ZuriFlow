import { Injectable, computed, signal } from '@angular/core'
import { User, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth'
import { Observable, ReplaySubject } from 'rxjs'
import { firebaseAuth } from '../firebase-client'

@Injectable({
  providedIn: 'root'
})
export class AuthState {
  private readonly authStateSubject = new ReplaySubject<User | null>(1)
  private readonly userSignal = signal<User | null>(null)
  private readonly loadingSignal = signal(true)
  private readonly errorSignal = signal<string | null>(null)

  readonly user = this.userSignal.asReadonly()
  readonly isLoading = this.loadingSignal.asReadonly()
  readonly authError = this.errorSignal.asReadonly()
  readonly uid = computed(() => this.userSignal()?.uid ?? null)
  readonly isAuthenticated = computed(() => this.uid() !== null)
  readonly authState$: Observable<User | null> = this.authStateSubject.asObservable()

  constructor () {
    onAuthStateChanged(firebaseAuth, (user) => {
        this.userSignal.set(user)
        this.authStateSubject.next(user)
        this.loadingSignal.set(false)
      }, (error) => {
        console.error('Firebase auth state error:', error)
        this.errorSignal.set('Could not load auth state.')
        this.loadingSignal.set(false)
    })
  }

  async ensureSignedIn () {
    if (this.uid()) {
      return this.uid()
    }

    this.errorSignal.set(null)
    const credential = await signInAnonymously(firebaseAuth)
    return credential.user.uid
  }

  async signOutUser () {
    this.errorSignal.set(null)
    await signOut(firebaseAuth)
  }
}
