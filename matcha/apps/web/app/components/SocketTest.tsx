'use client'

import { useEffect, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

export default function SocketTest() {
  const [status, setStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected')
  const [notifications, setNotifications] = useState<string[]>([])
  const [token, setToken] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)

  const connect = () => {
    if (!token) return alert('Enter a token first')

    const s = io('http://localhost:3002', {
      extraHeaders: {
        authorization: `Bearer ${token}`,
      },
    })



    s.on('connect', () => setStatus('connected'))
    s.on('connect_error', (err) => {
    setStatus('disconnected')

      setStatus('error')
      setNotifications((prev) => [`connect_error: ${err.message}`, ...prev])
    })
    s.on('notification', (data) => {
        console.log('Received notification:', data)
      setNotifications((prev) => [JSON.stringify(data), ...prev])
    })
    s.on('disconnect', () => setStatus('disconnected'))

    setSocket(s)
  }

  const disconnect = () => {
    socket?.disconnect()
    setSocket(null)
    setStatus('disconnected')
  }

  useEffect(() => () => { socket?.disconnect() }, [socket])

  const statusColor = { connected: 'green', disconnected: 'gray', error: 'red' }[status]

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h2>Socket Test</h2>

      <div style={{ marginBottom: '1rem' }}>
        <span style={{ color: statusColor }}>● {status}</span>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Paste JWT token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ flex: 1, padding: '0.4rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
        />
        {status === 'disconnected' || status === 'error'
          ? <button onClick={connect}>Connect</button>
          : <button onClick={disconnect}>Disconnect</button>
        }
      </div>

      <h3>Notifications</h3>
      {notifications.length === 0
        ? <p style={{ color: 'gray' }}>None yet...</p>
        : <ul>
            {notifications.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
      }
    </div>
  )
}
