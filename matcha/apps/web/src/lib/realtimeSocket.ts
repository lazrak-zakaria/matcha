import type { Socket } from 'socket.io-client'

let activeSocket: Socket | null = null

export const setActiveRealtimeSocket = (socket: Socket | null) => {
  activeSocket = socket
}

export const disconnectActiveRealtimeSocket = () => {
  if (!activeSocket) return
  activeSocket.disconnect()
  activeSocket = null
}
