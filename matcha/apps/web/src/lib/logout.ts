import { authService } from '@/services/auth.api'
import { useAuthStore } from '@/store/useAuthStore'
import { useRealtimeStore } from '@/store/useRealtimeStore'
import { disconnectActiveRealtimeSocket } from '@/lib/realtimeSocket'

export const performLogout = async () => {
  try {
    await authService.logout()
  } catch (error) {
    // Continue local cleanup even if the backend logout call fails.
    console.error('Logout API call failed:', error)
  }

  disconnectActiveRealtimeSocket()
  useAuthStore.getState().logout()
  useRealtimeStore.getState().resetRealtimeState()

  if (typeof window !== 'undefined') {
    localStorage.clear()
  }
}
