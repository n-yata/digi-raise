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
      const { signInWithPopup, signInWithRedirect, GoogleAuthProvider } = await import('firebase/auth')
      const provider = new GoogleAuthProvider()
      try {
        // ポップアップ優先（ページリロードなし）
        await signInWithPopup(auth, provider)
      } catch (popupErr) {
        const code = (popupErr as { code?: string }).code
        // 連続クリックで先行ポップアップが破棄された場合は静かに終了
        if (code === 'auth/cancelled-popup-request') return
        // ポップアップ不可環境の場合はリダイレクトにフォールバック
        const shouldFallback = code === 'auth/popup-blocked'
          || code === 'auth/popup-closed-by-user'
          || code === 'auth/operation-not-supported-in-this-environment'
        if (shouldFallback) {
          await signInWithRedirect(auth, provider)
        } else {
          throw popupErr
        }
      }
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
