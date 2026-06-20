import { useState, useEffect, useCallback } from 'react'
import { getFirebaseAuth } from '../services/firebase'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signingIn' }
  | { status: 'signedIn'; uid: string; displayName: string | null }
  | { status: 'error'; message: string }

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    async function setup() {
      const auth = await getFirebaseAuth()
      if (!auth) {
        setAuthState({ status: 'signedOut' })
        return
      }

      const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth')

      // リダイレクト復帰時の結果を処理（エラーは無視してサインアウト扱い）
      await getRedirectResult(auth).catch(() => null)

      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setAuthState({ status: 'signedIn', uid: user.uid, displayName: user.displayName })
        } else {
          setAuthState({ status: 'signedOut' })
        }
      })
    }

    setup().catch(() => setAuthState({ status: 'signedOut' }))

    return () => {
      unsubscribe?.()
    }
  }, [])

  const signIn = useCallback(async () => {
    setAuthState({ status: 'signingIn' })
    try {
      const auth = await getFirebaseAuth()
      if (!auth) {
        setAuthState({ status: 'error', message: 'Firebase が設定されていません' })
        return
      }
      const { signInWithRedirect, GoogleAuthProvider } = await import('firebase/auth')
      await signInWithRedirect(auth, new GoogleAuthProvider())
    } catch {
      setAuthState({ status: 'error', message: 'サインインに失敗しました' })
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const auth = await getFirebaseAuth()
      if (!auth) return
      const { signOut: firebaseSignOut } = await import('firebase/auth')
      await firebaseSignOut(auth)
    } catch {
      // サインアウト失敗は致命的でないので無視
    }
  }, [])

  return { authState, signIn, signOut }
}
