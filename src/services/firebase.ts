import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

function getConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if (!apiKey) return null
  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
  }
}

let authInstance: Auth | null = null
let dbInstance: Firestore | null = null

export async function getFirebaseAuth(): Promise<Auth | null> {
  const config = getConfig()
  if (!config) return null
  if (authInstance) return authInstance

  const { initializeApp, getApps, getApp } = await import('firebase/app')
  const { getAuth } = await import('firebase/auth')

  const app = getApps().length > 0 ? getApp() : initializeApp(config)
  authInstance = getAuth(app)
  return authInstance
}

export async function getFirestoreDb(): Promise<Firestore | null> {
  const config = getConfig()
  if (!config) return null
  if (dbInstance) return dbInstance

  const { initializeApp, getApps, getApp } = await import('firebase/app')
  const { getFirestore } = await import('firebase/firestore')

  const app = getApps().length > 0 ? getApp() : initializeApp(config)
  dbInstance = getFirestore(app)
  return dbInstance
}
