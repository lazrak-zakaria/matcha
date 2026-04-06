/**
 * Convert coordinates to city name using reverse geocoding
 * Uses Nominatim (OpenStreetMap) API
 */
export async function getCityFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    )

    if (!response.ok) {
      console.error('Reverse geocoding failed:', response.statusText)
      return null
    }

    const data = await response.json()
    
    // Try to get city name from various address components
    const address = data.address || {}
    const city = 
      address.city || 
      address.town || 
      address.village || 
      address.county ||
      (data.name ? data.name : null)

    return city || null
  } catch (error) {
    console.error('Error getting city from coordinates:', error)
    return null
  }
}

/**
 * Request user's geolocation permission
 */
export function detectUserLocation(): Promise<{
  latitude: number
  longitude: number
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser')
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        console.error('Geolocation error:', error)
        resolve(null)
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  })
}
