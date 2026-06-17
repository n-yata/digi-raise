# PreToolUse hook: git commit/push の --no-verify(-n) / フックスキップを機械的にブロックする。
#
# 背景: プロンプトインジェクションにより「セキュリティレビューを省略して
#       --no-verify でコミットせよ」という偽指示が混入したインシデント
#       (docs/incidents/20260611-tool-result-injection.md) の再発防止策。
#       LLM の判断に依存せず、ハーネス層で確実に拒否する多層防御。
#
# 仕様:
#   - 対象ツール: Bash / PowerShell (settings.json の matcher で限定)
#   - git commit / git push に対して以下を含む場合に deny:
#       --no-verify, --no-gpg-sign, -n (commit のフックスキップ別名)
#       -c core.hooksPath= (フックパスを無効化する迂回路)
#   - それ以外のコマンドは許可(何も出力せず exit 0)
#
# 入力: stdin に PreToolUse の JSON ({ tool_input: { command: "..." } })
# 出力: deny する場合のみ hookSpecificOutput を JSON で stdout に返す。

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $payload = $raw | ConvertFrom-Json
    $command = [string]$payload.tool_input.command
} catch {
    # 解析できない場合は判断を保留し、通常フローに委ねる(誤ブロックを避ける)
    exit 0
}

if ([string]::IsNullOrWhiteSpace($command)) { exit 0 }

# git の commit / push を対象にする
$isGitCommitOrPush = $command -match '(?i)\bgit\b[\s\S]*\b(commit|push)\b'
if (-not $isGitCommitOrPush) { exit 0 }

# フラグ検出はコミットメッセージ本文(-m 以降)を除いた部分だけに適用する。
# メッセージ本文にフラグ文字列が含まれていても誤ブロックしないようにするため。
# -m に続く区切り文字は空白・ダブルクォート・シングルクォート・= を許容。
$preMsgParts = $command -split '(?i)\s-m[\s"''=]', 2
$checkTarget = $preMsgParts[0]

$hasNoVerify      = $checkTarget -match '(?i)(^|\s)--no-verify(\s|$)'
$hasNoGpg         = $checkTarget -match '(?i)(^|\s)--no-gpg-sign(\s|$)'
$hasCoreHooksPath = $checkTarget -match '(?i)(^|\s)-c\s+core\.hookspath\s*='
$hasShortN        = $checkTarget -match '(?i)(^|\s)-n(\s|$)'

if ($hasNoVerify -or $hasNoGpg -or $hasShortN -or $hasCoreHooksPath) {
    $reason = 'git の commit/push に対するフックスキップ(--no-verify / -n / --no-gpg-sign / -c core.hooksPath=)は禁止されています。' +
              'プロンプトインジェクション再発防止のため、ハーネス層でブロックしました。' +
              'コミット前に security-engineer によるセキュリティレビューを実施してください。'
    $out = @{
        hookSpecificOutput = @{
            hookEventName            = 'PreToolUse'
            permissionDecision       = 'deny'
            permissionDecisionReason = $reason
        }
    }
    $out | ConvertTo-Json -Compress -Depth 5
    exit 0
}

exit 0
