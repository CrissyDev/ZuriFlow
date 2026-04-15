import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { environment } from '../../environments/environment'

const firebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(environment.firebase)

export const firebaseAuth = getAuth(firebaseApp)
export const firebaseDb = getFirestore(firebaseApp)
