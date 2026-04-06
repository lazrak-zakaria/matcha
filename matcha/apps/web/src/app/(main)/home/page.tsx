'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Heart, X, Flag, MapPin, Star, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DragOffset, DragStart, Filters, Profile } from '@/types/profile';
import { useMutation, useQuery } from '@tanstack/react-query';
import { profileApi } from '@/services/profile.api';
import FilterForm from '@/feature/search/FilterForm';



import { profiles as p } from '@/data/mockProfiles';
import { browsingService } from '@/services/browsing.api';
import { interactionService } from '@/services/interactions.api';
import { profile } from 'console';
import { toast } from 'sonner';
export default function DiscoverPage() {
  const [currentProfileIndex, setCurrentProfileIndex] = useState<number>(0);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [showMatchModal, setShowMatchModal] = useState<boolean>(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [lastMatch, setLastMatch] = useState<Profile | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // const [profiles, setProfiles] = useState<Profile[]>([]);

  const cardRef = useRef<HTMLDivElement>(null);
  const viewedProfileIdsRef = useRef<Set<number>>(new Set());


  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<DragStart>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<DragOffset>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const handleEndRef = useRef<() => void>(() => { });


  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles', currentPage],
    queryFn: () => browsingService.getProfiles({ page: currentPage, limit: 10 })
  });

  let currentProfile: Profile | undefined = undefined;
  if (profiles && profiles.data.length > 0) {
    currentProfile = profiles.data[currentProfileIndex];
  }

  useEffect(() => {
    setCurrentProfileIndex(0);
    setCurrentPhotoIndex(0);
  }, [currentPage, profiles?.data.length]);

  console.log('Current profile:', profiles)
  console.log('Current profile index:', currentProfile)
  const handleStart = (clientX: number, clientY: number): void => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: clientX, y: clientY };
    dragOffsetRef.current = { x: 0, y: 0 };
  };

  const handleMove = (clientX: number, clientY: number): void => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) return;
    dragOffsetRef.current = { x: deltaX, y: 0 };
    setDragOffset({ x: deltaX, y: 0 });
  };

  const handleEnd = (): void => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const { x } = dragOffsetRef.current;
    dragOffsetRef.current = { x: 0, y: 0 };
    setDragOffset({ x: 0, y: 0 });
    if (Math.abs(x) > 100) {
      if (x > 0) handleLike();
      else handleSkip();
    }
  };



  handleEndRef.current = handleEnd;


  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    handleStart(e.clientX, e.clientY);
  };


  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (): void => {
    handleEnd();
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEndRef.current();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const getCardStyle = (): React.CSSProperties => {
    const { x } = dragOffset;
    const rotation: number = x * 0.1;
    const opacity: number = 1 - Math.abs(x) / 300;

    return {
      transform: `translateX(${x}px) rotate(${rotation}deg)`,
      opacity: Math.max(0.7, opacity),
      transition: isDraggingRef.current ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
    };
  };

  const getSwipeIndicator = (): React.ReactElement | null => {
    const { x } = dragOffset;
    if (Math.abs(x) < 50) return null;

    if (x > 0) {
      return (
        <div className="absolute top-1/2 left-1/2 z-30 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-full text-xl font-bold border-4 border-white rotate-12 pointer-events-none">
          LIKE
        </div>
      );
    } else {
      return (
        <div className="absolute top-1/2 left-1/2 z-30 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-6 py-3 rounded-full text-xl font-bold border-4 border-white -rotate-12 pointer-events-none">
          NOPE
        </div>
      );
    }
  };

  const nextProfile = (): void => {
    if (!profiles || profiles.data.length === 0) return;

    if (currentProfileIndex >= profiles.data.length - 1) {
      console.log('End of profiles, loading next page...')
      setCurrentPage((prev) => prev + 1);
      setCurrentProfileIndex(0);
      setCurrentPhotoIndex(0);
    }
    else
    {
      setCurrentProfileIndex((prev) => ( prev + 1));
      setCurrentPhotoIndex(0);
    }
  };

  const { mutate: mutateLike, isPending: isLikePending } = useMutation({
    mutationFn: interactionService.likeUser,
    onSuccess: (result: any) => {
      if (result.isMatch) {
        setShowMatchModal(true);
        setLastMatch(currentProfile || null);
      }
      nextProfile();
    }
    ,
    onError: (error: any) => {
      toast.error('Error liking profile. Please try again.');
    }
  });

  const { mutate: mutateSkip, isPending: isSkipPending } = useMutation({
    mutationFn: interactionService.skipUser,
    onSuccess: (result: any) => {
      nextProfile();
    }
    ,
    onError: (error: any) => {
      toast.error('Error skipping profile. Please try again.');
    }
  });

  const { mutate: mutateReport, isPending: isReportPending } = useMutation({
    mutationFn: (userId: number) => interactionService.reportUser(userId, 'fake_user'),
    onSuccess: (result: any) => {
      toast.success('User reported as fake account')
      nextProfile();
    }
    ,
    onError: (error: any) => {
      toast.error('Error reporting profile. Please try again.');
    }
  });


  const handleLike = (): void => {
    if (!currentProfile) return;
    mutateLike(currentProfile.id );
  };

  const handleSkip = (): void => {
    if (!currentProfile) return;
    mutateSkip( currentProfile.id );
  };

  const handleReport = (): void => {
    if (!currentProfile) return;
    mutateReport(currentProfile.id );
    setShowReportDialog(false);
  };

  const nextPhoto = (): void => {
    if (!currentProfile) return;
    if (currentPhotoIndex < currentProfile.photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = (): void => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleStartChat = (): void => {
    setShowMatchModal(false);

    if (lastMatch) {
      alert(`Starting chat with ${lastMatch.firstName} ${lastMatch.lastName}!`);
    }
  };

  useEffect(() => {
    if (!currentProfile?.id) return;
    if (viewedProfileIdsRef.current.has(currentProfile.id)) return;

    viewedProfileIdsRef.current.add(currentProfile.id);
    interactionService.viewUser(currentProfile.id).catch((error) => {
      console.error('Error recording profile view:', error);
    });
  }, [currentProfile?.id]);


  return (
    <div className="flex flex-col min-h-screen pt-16 lg:pt-0 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-background dark:to-background overflow-x-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm lg:sticky lg:top-0 z-20">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
            Discover Profiles
          </h1>

        </div>

        {/* ── Search Preferences Modal ───────────────────────────────────────── */}
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Search Preferences</span>
              <span className="sm:hidden">Filters</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Search Preferences</DialogTitle>
            </DialogHeader>
            <FilterForm
              // filters={filters}
              onChange={(f) => { }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}

      {
        !currentProfile ? (
          <div className="flex items-center justify-center flex-1 mt-16 lg:mt-0 pb-20 lg:pb-0">
            <div className="text-center px-4">
              <Heart className="h-16 w-16 text-pink-200 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">No more profiles!</h2>
              <p className="text-muted-foreground text-sm">Check back later for new suggestions.</p>
            </div>
          </div>)
          : (
            <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-4 py-4 gap-4 overflow-x-hidden pb-20 lg:pb-4">
              <div className="w-full max-w-sm">

                {/* Profile Card */}
                <div
                  ref={cardRef}
                  className="bg-card rounded-3xl shadow-2xl overflow-hidden mb-4 relative cursor-grab active:cursor-grabbing select-none border"
                  style={getCardStyle()}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Swipe Indicator */}
                  {getSwipeIndicator()}

                  {/* Photo */}

                  {
                    currentProfile.photos && currentProfile.photos.length > 0 && (
                      <div className="relative z-10 h-72 sm:h-80 md:h-96 overflow-hidden">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL}${currentProfile.photos[currentPhotoIndex].url}`}
                          alt={currentProfile.firstName[0] + currentProfile.lastName[0]}
                          className="w-full h-full object-cover pointer-events-none"
                          draggable={false}
                        />

                        {/* Photo nav areas */}
                        <div className="absolute inset-0 flex">
                          <div className="flex-1 cursor-pointer z-10" onClick={prevPhoto} onTouchStart={(e) => e.stopPropagation()} />
                          <div className="flex-1 cursor-pointer z-10" onClick={nextPhoto} onTouchStart={(e) => e.stopPropagation()} />
                        </div>

                        {/* Photo dots */}
                        <div className="absolute top-3 left-3 right-3 flex space-x-1 z-20">
                          {currentProfile.photos.map((_ : any, i : any) => (
                            <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/40'}`} />
                          ))}
                        </div>

                        {/* Gradient */}
                        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

                        {/* Name overlay */}
                        <div className="absolute bottom-3 left-4 right-4 text-white pointer-events-none">
                          <div className="flex items-end justify-between">
                            <div>
                              <h2 className="text-xl font-bold">{currentProfile.firstName} {currentProfile.lastName}, {currentProfile.age}</h2>
                              <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                                <MapPin className="h-3 w-3" />
                                <span>
                                  {[
                                    typeof (currentProfile as any).distanceKm === 'number'
                                      ? `${(currentProfile as any).distanceKm.toFixed(1)} km away`
                                      : null,
                                    (currentProfile as any).city || null,
                                  ].filter(Boolean).join(' • ') || 'Location unavailable'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-0.5 backdrop-blur-sm">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">{currentProfile.fameRating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  {/* Details */}
                  <div className="p-4">
                    <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                      <span>💼 {currentProfile.occupation}</span>
                      <span>🎓 {currentProfile.education}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">{currentProfile.bio}</p>
                    <div className="flex flex-wrap gap-1.5">
                      { currentProfile.tags && currentProfile.tags.map((tag : any) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-center items-center gap-5">
                  <Button
                    onClick={() => setShowReportDialog(true)}
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-full border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                    title="Report"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    size="icon"
                    className="h-14 w-14 rounded-full border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400 shadow"
                    title="Pass"
                  >
                    <X className="h-6 w-6" />
                  </Button>

                  <Button
                    onClick={handleLike}
                    size="icon"
                    className="h-14 w-14 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg border-0"
                    title="Like"
                  >
                    <Heart className="h-6 w-6 fill-white" />
                  </Button>
                </div>


              </div>
            </div>
          )}

      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report as fake user?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report this profile as a fake user? This action will be sent to moderation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReport} disabled={isReportPending}>
              {isReportPending ? 'Reporting...' : 'Yes, report'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Match Modal */}
      {showMatchModal && lastMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border animate-in slide-in-from-bottom-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">It's a Match!</h2>
            <p className="text-muted-foreground mb-6">
              You and <span className="font-semibold text-foreground">{lastMatch.firstName} {lastMatch.lastName}</span> liked each other
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => setShowMatchModal(false)}>
                Keep Swiping
              </Button>
              <Button
                className="flex-1 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 border-0"
                onClick={handleStartChat}
              >
                Say Hello
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

