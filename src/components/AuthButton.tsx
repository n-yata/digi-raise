import type { AuthState } from '../hooks/useAuth'
import type { SyncStatus } from '../hooks/useCloudSave'

interface AuthButtonProps {
  authState: AuthState
  syncStatus: SyncStatus
  lastSyncedAt: number | null
  onSignIn: () => void
  onSignOut: () => void
}

function formatSyncTime(ts: number): string {
  const d = new Date(ts)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export default function AuthButton({ authState, syncStatus, lastSyncedAt, onSignIn, onSignOut }: AuthButtonProps) {
  if (authState.status === 'loading') return null

  if (authState.status === 'signedOut' || authState.status === 'error') {
    return (
      <button
        onClick={onSignIn}
        className="font-pixel transition-all active:scale-95"
        style={{
          fontSize: '0.5rem',
          padding: '4px 8px',
          background: '#16213e',
          border: '1px solid #4285f466',
          color: '#4285f4',
          borderRadius: 6,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        G サインイン
      </button>
    )
  }

  if (authState.status === 'signingIn') {
    return (
      <span className="font-pixel" style={{ fontSize: '0.5rem', color: '#64748b' }}>
        認証中...
      </span>
    )
  }

  // signedIn
  const syncLabel =
    syncStatus.state === 'syncing' ? '同期中...' :
    syncStatus.state === 'error' ? '同期エラー' :
    lastSyncedAt ? `同期済 ${formatSyncTime(lastSyncedAt)}` :
    'クラウド同期'

  const syncColor =
    syncStatus.state === 'error' ? '#f87171' :
    syncStatus.state === 'synced' ? '#4ade80' :
    '#64748b'

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-end">
        <span className="font-pixel" style={{ fontSize: '0.45rem', color: '#94a3b8' }}>
          {authState.displayName ?? 'ユーザー'}
        </span>
        <span className="font-pixel" style={{ fontSize: '0.4rem', color: syncColor }}>
          {syncLabel}
        </span>
      </div>
      <button
        onClick={onSignOut}
        className="font-pixel transition-all active:scale-95"
        style={{
          fontSize: '0.45rem',
          padding: '3px 6px',
          background: 'transparent',
          border: '1px solid #33415566',
          color: '#64748b',
          borderRadius: 4,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        出る
      </button>
    </div>
  )
}
