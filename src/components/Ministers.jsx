import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Ministers() {
  const [ministers, setMinisters] = useState([])
    const [loading, setLoading] = useState(true)
      const [error, setError] = useState('')

        useEffect(() => {
            loadMinisters()
              }, [])

                async function loadMinisters() {
                    const { data, error } = await supabase
                          .from('minister_profiles')
                                .select('*')
                                      .order('id', { ascending: true })

                                          if (error) setError(error.message)
                                              else setMinisters(data || [])

                                                  setLoading(false)
                                                    }

                                                      return (
                                                          <div>
                                                                <h2>🙌 Ministers Database</h2>

                                                                      {loading && <p>Loading ministers...</p>}
                                                                            {error && <p style={{ color: '#ff8888' }}>Error: {error}</p>}

                                                                                  {!loading && !error && (
                                                                                          <p style={{ color: '#98FB98' }}>Ministers loaded: {ministers.length}</p>
                                                                                                )}

                                                                                                      {ministers.slice(0, 30).map((m) => (
                                                                                                              <div
                                                                                                                        key={m.id}
                                                                                                                                  style={{
                                                                                                                                              background: '#0D1B2A',
                                                                                                                                                          border: '1px solid #C9A84C33',
                                                                                                                                                                      borderRadius: 12,
                                                                                                                                                                                  padding: 14,
                                                                                                                                                                                              marginBottom: 10,
                                                                                                                                                                                                        }}
                                                                                                                                                                                                                >
                                                                                                                                                                                                                          <strong>{m.name || m.minister_name}</strong>
                                                                                                                                                                                                                                    <p style={{ margin: '6px 0', color: '#F5EDD699' }}>
                                                                                                                                                                                                                                                {m.ministry || m.ministry_name || 'Ministry not added'}
                                                                                                                                                                                                                                                          </p>
                                                                                                                                                                                                                                                                    <small>{m.country || 'Country not added'}</small>
                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                  ))}
                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                        )
                                                                                                                                                                                                                                                                                        }