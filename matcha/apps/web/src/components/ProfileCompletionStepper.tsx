'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/useAuthStore'
import { profileApi } from '@/services/profile.api'
import { settingApi } from '@/services/setting.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Circle, Upload } from 'lucide-react'
import { toast } from 'sonner'

type CompletionStep = {
  key: 'avatar' | 'tags' | 'gender' | 'age' | 'bio'
  label: string
  done: boolean
}

export default function ProfileCompletionStepper() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user, isHydrated, setProfileDetails } = useAuthStore()
  const userId = user?.userId ?? user?.id
  const [selectedTags, setSelectedTags] = useState<any[]>([])
  const [selectedGender, setSelectedGender] = useState<string>('other')
  const [ageValue, setAgeValue] = useState<string>('')
  const [bioValue, setBioValue] = useState<string>('')
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  const { data: selfProfile, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['completion-stepper', 'profile', userId],
    queryFn: () => profileApi.getProfileById(userId || ''),
    enabled: Boolean(userId),
  })

  const { data: userTags, isLoading: isUserTagsLoading, refetch: refetchUserTags } = useQuery({
    queryKey: ['completion-stepper', 'user-tags', userId],
    queryFn: () => profileApi.getTags(String(userId || '')),
    enabled: Boolean(userId),
  })

  const { data: allTags, isLoading: isAllTagsLoading, refetch: refetchAllTags } = useQuery({
    queryKey: ['completion-stepper', 'all-tags'],
    queryFn: () => settingApi.getTagsAggregated(),
    enabled: Boolean(userId),
  })

  const { data: images, isLoading: isImagesLoading, refetch: refetchImages } = useQuery({
    queryKey: ['completion-stepper', 'images', userId],
    queryFn: () => profileApi.getImages(String(userId || '')),
    enabled: Boolean(userId),
  })

  const isLoading = !isHydrated || Boolean(userId) && (isProfileLoading || isUserTagsLoading || isAllTagsLoading || isImagesLoading)

  useEffect(() => {
    if (!selfProfile) return
    if (selfProfile.gender) setSelectedGender(String(selfProfile.gender))
    if (selfProfile.age) setAgeValue(String(selfProfile.age))
    else setAgeValue('')
    if (typeof selfProfile.bio === 'string') setBioValue(selfProfile.bio)
  }, [selfProfile])

  useEffect(() => {
    if (!Array.isArray(allTags)) return
    const preselected = allTags
      .filter((tag: any) => tag?.selected)
      .map((tag: any) => ({ id: tag.id, selected: true }))
    setSelectedTags(preselected)
  }, [allTags])

  const hasAvatar = useMemo(() => {
    if (user?.avatar) return true
    return Array.isArray(images) && images.some((img: any) => img?.isAvatar)
  }, [images, user?.avatar])

  const hasTags = Array.isArray(userTags) && userTags.length > 0
  const hasGender = Boolean(selfProfile?.gender)
  const hasAge = Number(selfProfile?.age ?? 0) > 0
  const hasBio = Boolean(String(selfProfile?.bio ?? '').trim())

  const steps: CompletionStep[] = [
    { key: 'avatar', label: 'Add profile avatar', done: hasAvatar },
    { key: 'tags', label: 'Choose at least one tag', done: hasTags },
    { key: 'age', label: 'Set your age', done: hasAge },
    { key: 'gender', label: 'Set your gender', done: hasGender },
    { key: 'bio', label: 'Write your bio', done: hasBio },
  ]

  const firstUncompletedStep = steps.find((step) => !step.done)
  const isComplete = !firstUncompletedStep
  const completedCount = steps.filter((step) => step.done).length
  const activeStep = firstUncompletedStep?.key

  const syncAfterUpdate = async () => {
    await Promise.all([refetchProfile(), refetchUserTags(), refetchAllTags(), refetchImages()])
  }

  const { mutate: updateAvatar, isPending: isUpdatingAvatar } = useMutation({
    mutationFn: settingApi.updateAvatar,
    onSuccess: async (result: any) => {
      if (result?.avatar) {
        useAuthStore.setState((state) => ({
          user: {
            ...state.user,
            avatar: result.avatar.startsWith('/')
              ? `${process.env.NEXT_PUBLIC_API_URL}${result.avatar}`
              : result.avatar,
          },
        }))
      }
      toast.success('Avatar updated')
      await syncAfterUpdate()
    },
    onError: () => {
      toast.error('Failed to update avatar')
    },
  })

  const { mutate: updateTags, isPending: isUpdatingTags } = useMutation({
    mutationFn: settingApi.updateTags,
    onSuccess: async () => {
      toast.success('Tags updated')
      await syncAfterUpdate()
    },
    onError: () => {
      toast.error('Failed to update tags')
    },
  })

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: settingApi.updateProfile,
    onSuccess: async (payload: any) => {
      setProfileDetails({
        age: payload.age,
        gender: payload.gender,
        bio: payload.bio,
      })
      toast.success('Profile updated')
      await syncAfterUpdate()
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  const handleAvatarSave = () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      toast.error('Please choose an image first')
      return
    }
    const formData = new FormData()
    formData.append('avatar', file)
    updateAvatar(formData)
  }

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  const handleTagsSave = () => {
    const selected = selectedTags.filter((tag: any) => tag.selected).map((tag: any) => tag.id)
    if (selected.length === 0) {
      toast.error('Select at least one tag')
      return
    }
    updateTags(selected)
  }

  const getProfilePayload = (overrides?: Partial<{ age: number; gender: string; bio: string }>) => {
    const age = overrides?.age ?? Number(selfProfile?.age ?? ageValue ?? 0)
    const gender = overrides?.gender ?? String(selfProfile?.gender ?? selectedGender ?? 'other')
    const bio = overrides?.bio ?? String(selfProfile?.bio ?? bioValue ?? '')
    return { age, gender, bio }
  }

  const handleGenderSave = () => {
    updateProfile(getProfilePayload({ gender: selectedGender }))
  }

  const handleAgeSave = () => {
    const age = Number(ageValue)
    if (!Number.isFinite(age) || age <= 0) {
      toast.error('Please enter a valid age')
      return
    }
    updateProfile(getProfilePayload({ age }))
  }

  const handleBioSave = () => {
    const bio = String(bioValue ?? '').trim()
    if (!bio) {
      toast.error('Bio cannot be empty')
      return
    }
    updateProfile(getProfilePayload({ bio }))
  }

  if (!userId || isLoading || isComplete) return null

  const progress = Math.round((completedCount / steps.length) * 100)
  const tagsList = Array.isArray(allTags) ? allTags : []

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[1px]">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold">Complete your profile</h2>
          <p className="mt-1 text-sm text-gray-600">
            Finish each step in order before using the app.
          </p>

          <div className="mt-4 h-2 w-full rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-500">{completedCount}/{steps.length} completed</p>

          <div className="mt-4 space-y-2">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{index + 1}.</span>
                  <span className="text-sm text-gray-800">{step.label}</span>
                </div>
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border bg-gray-50 p-4">
            {activeStep === 'avatar' && (
              <div className="space-y-3">
                <Label>Add your avatar</Label>
                {(avatarPreviewUrl || user?.avatar) && (
                  <div className="flex items-center gap-3">
                    <img
                      src={avatarPreviewUrl || user?.avatar || ''}
                      alt="Avatar preview"
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                    <p className="text-xs text-gray-600">
                      This is your avatar preview.
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Choose image
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                </div>
                <p className="text-xs text-gray-600">
                  You can add more pictures later from the Edit Photos page.
                </p>
                <Button onClick={handleAvatarSave} disabled={isUpdatingAvatar}>
                  {isUpdatingAvatar ? 'Saving...' : 'Save avatar'}
                </Button>
              </div>
            )}

            {activeStep === 'tags' && (
              <div className="space-y-3">
                <Label>Select your tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tagsList.map((tag: any) => {
                    const selected = selectedTags.some((item: any) => item.id === tag.id ? item.selected : false)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setSelectedTags((prev) => {
                            const exists = prev.find((item: any) => item.id === tag.id)
                            if (exists) {
                              return prev.map((item: any) => item.id === tag.id ? { ...item, selected: !item.selected } : item)
                            }
                            return [...prev, { id: tag.id, selected: true }]
                          })
                        }}
                        className={`px-3 py-1 text-sm rounded-full border ${selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
                <Button onClick={handleTagsSave} disabled={isUpdatingTags}>
                  {isUpdatingTags ? 'Saving...' : 'Save tags'}
                </Button>
              </div>
            )}

            {activeStep === 'gender' && (
              <div className="space-y-3">
                <Label>Set your gender</Label>
                <Select value={selectedGender} onValueChange={setSelectedGender}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                  <SelectContent className="z-[120]">
                    <SelectGroup>
                      <SelectLabel>Gender</SelectLabel>
                      <SelectItem value="male">male</SelectItem>
                      <SelectItem value="female">female</SelectItem>
                      <SelectItem value="other">other</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button onClick={handleGenderSave} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? 'Saving...' : 'Save gender'}
                </Button>
              </div>
            )}

            {activeStep === 'age' && (
              <div className="space-y-3">
                <Label>Set your age</Label>
                <Input type="number" min={1} max={120} value={ageValue} onChange={(event) => setAgeValue(event.target.value)} />
                <Button onClick={handleAgeSave} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? 'Saving...' : 'Save age'}
                </Button>
              </div>
            )}

            {activeStep === 'bio' && (
              <div className="space-y-3">
                <Label>Write your bio</Label>
                <Textarea value={bioValue} onChange={(event) => setBioValue(event.target.value)} placeholder="Tell people about yourself" />
                <Button onClick={handleBioSave} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? 'Saving...' : 'Save bio'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}