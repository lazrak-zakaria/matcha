"use client"
import { useState } from 'react'
import { Loader, MapPin } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { detectUserLocation, getCityFromCoordinates } from '@/lib/geolocation'
import { profileApi } from '@/services/profile.api'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface LocationPermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LocationPermissionDialog({
  open,
  onOpenChange,
}: LocationPermissionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { setLocation, setCity, setLocationPermissionAsked } = useAuthStore()

  const handleAllow = async () => {
    setIsLoading(true)
    try {
      const coords = await detectUserLocation()
      if (coords) {
        const city = await getCityFromCoordinates(coords.latitude, coords.longitude)

        setLocation(coords)
        await profileApi.updateLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          city: city ?? undefined,
        })

        if (city) {
          setCity(city)
        }
      } else {
        toast.error('Location was not available. Please allow browser location access and try again.')
      }
    } catch (error) {
      console.error('Error detecting location:', error)
      toast.error('Failed to save location. Please try again.')
    } finally {
      setIsLoading(false)
      setLocationPermissionAsked(true)
      onOpenChange(false)
    }
  }

  const handleDeny = () => {
    setLocationPermissionAsked(true)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin size={24} className="text-blue-600" />
            </div>
            <DialogTitle>Share Your Location?</DialogTitle>
          </div>
          <DialogDescription>
            We'd like to know your city to help personalize your experience and show relevant matches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              We store your city and coordinates to suggest people near you.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleDeny}
            disabled={isLoading}
          >
            Not Now
          </Button>
          <Button
            onClick={handleAllow}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading && <Loader size={16} className="animate-spin" />}
            {isLoading ? 'Detecting...' : 'Allow Location'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
