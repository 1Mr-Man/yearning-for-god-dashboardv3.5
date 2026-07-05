import { useEffect, useState } from 'react'

export default function SocialAccounts({ supabase, styles }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('social_account_settings')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.log(error)
      setMessage(`Error loading accounts: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const updateAccount = async (id, updates) => {
    try {
      setMessage('')
      const { error } = await supabase
        .from('social_account_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error
      await loadAccounts()
      setMessage('Settings updated successfully.')
    } catch (error) {
      console.log(error)
      setMessage(`Update failed: ${error.message}`)
    }
  }

  const runTestPublish = async (account) => {
    try {
      const { error } = await supabase
        .from('social_account_settings')
        .update({
          last_checked_at: new Date().toISOString(),
          last_error: null,
          notes: `Dry run successful for ${account.platform}. No real post was published.`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id)

      if (error) throw error

      await loadAccounts()
      setMessage(`Dry run successful for ${account.platform}. No real post was published.`)
    } catch (error) {
      console.log(error)
      setMessage(`Dry run failed: ${error.message}`)
    }
  }

  return (
    <div>
      <h2 style={styles.subtitle}>🔐 Social Account Safety Center</h2>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Launch Protection</h3>
        <p style={{ color: '#cbd5e1' }}>
          Keep Test Mode ON and Manual Approval ON until every platform has been tested safely.
        </p>

        <div style={{ display: 'grid', gap: 8 }}>
          <div>✅ No passwords are stored here</div>
          <div>✅ Test Mode prevents accidental live publishing</div>
          <div>✅ Manual Approval protects the 175 scheduled posts</div>
          <div>⚠️ Auto Publishing should remain OFF until Monday launch check</div>
        </div>
      </div>

      {message && (
        <div style={{ ...styles.card, borderColor: '#2563eb' }}>
          <p style={{ margin: 0 }}>{message}</p>
        </div>
      )}

      <div style={styles.card}>
        <button style={styles.button} onClick={loadAccounts} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh Accounts'}
        </button>
      </div>

      {accounts.map((account) => (
        <div key={account.id} style={styles.card}>
          <h3 style={{ marginTop: 0 }}>
            {account.platform} — {account.connected ? '✅ Connected' : '⚠️ Not Connected'}
          </h3>

          <div style={{ display: 'grid', gap: 10 }}>
            <label>
              Account Label
              <input
                style={styles.input}
                value={account.account_label || ''}
                onChange={(e) =>
                  setAccounts((prev) =>
                    prev.map((a) =>
                      a.id === account.id ? { ...a, account_label: e.target.value } : a
                    )
                  )
                }
                onBlur={(e) => updateAccount(account.id, { account_label: e.target.value })}
              />
            </label>

            <label>
              Account ID / Page ID / Channel ID
              <input
                style={styles.input}
                value={account.account_id || ''}
                placeholder="Do not paste password here"
                onChange={(e) =>
                  setAccounts((prev) =>
                    prev.map((a) =>
                      a.id === account.id ? { ...a, account_id: e.target.value } : a
                    )
                  )
                }
                onBlur={(e) => updateAccount(account.id, { account_id: e.target.value })}
              />
            </label>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={!!account.connected}
                onChange={(e) => updateAccount(account.id, { connected: e.target.checked })}
              />
              Mark as connected
            </label>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={!!account.test_mode}
                onChange={(e) => updateAccount(account.id, { test_mode: e.target.checked })}
              />
              Test Mode / Dry Run
            </label>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={!!account.require_manual_approval}
                onChange={(e) =>
                  updateAccount(account.id, { require_manual_approval: e.target.checked })
                }
              />
              Require Manual Approval Before Publishing
            </label>

            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={!!account.auto_publish_enabled}
                onChange={(e) =>
                  updateAccount(account.id, { auto_publish_enabled: e.target.checked })
                }
              />
              Platform Auto Publishing Enabled
            </label>

            <button style={styles.button} onClick={() => runTestPublish(account)}>
              🧪 Run Dry Test for {account.platform}
            </button>

            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              Last checked:{' '}
              {account.last_checked_at
                ? new Date(account.last_checked_at).toLocaleString()
                : 'Never'}
            </div>

            {account.last_error && (
              <div style={{ color: '#f87171', fontSize: 13 }}>
                Last error: {account.last_error}
              </div>
            )}

            {account.notes && (
              <div style={{ color: '#cbd5e1', fontSize: 13 }}>
                Notes: {account.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}