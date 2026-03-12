'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Heart, X, Flag, MapPin, Star, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DragOffset, DragStart, Filters, Profile } from '@/types/profile';
import { useMutation } from '@tanstack/react-query';


const ALL_TAGS = [
  'Travel', 'Photography', 'Hiking', 'Coffee', 'Dogs',
  'Music', 'Coding', 'Food', 'Books', 'Guitar',
  'Yoga', 'Wellness', 'Meditation', 'Fitness', 'Nature',
  'Art', 'Movies', 'Gaming', 'Cooking', 'Sports',
];

export default function DiscoverPage () {
  const [currentProfileIndex, setCurrentProfileIndex] = useState<number>(0);
  const [matches, setMatches] = useState<Profile[]>([]);
  const [showMatchModal, setShowMatchModal] = useState<boolean>(false);
  const [lastMatch, setLastMatch] = useState<Profile | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    ageRange: [18, 60],
    fameRange: [0, 5],
    maxDistance: 100,
    tags: [],
  });
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const cardRef = useRef<HTMLDivElement>(null);


  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  const currentProfile: Profile | undefined = profiles[currentProfileIndex];
  const [currentPage, setCurrentPage] = useState<number>(1);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<DragStart>({ x: 0, y: 0 });
  const dragOffsetRef = useRef<DragOffset>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<DragOffset>({ x: 0, y: 0 });
  const handleEndRef = useRef<() => void>(() => {});

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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-6 py-3 rounded-full text-xl font-bold border-4 border-white rotate-12">
          LIKE
        </div>
      );
    } else {
      return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-6 py-3 rounded-full text-xl font-bold border-4 border-white -rotate-12">
          NOPE
        </div>
      );
    }
  };

  const nextProfile = (): void => {
    // Functional update avoids stale currentProfileIndex in closures
    setCurrentProfileIndex((prev) => (prev < profiles.length - 1 ? prev + 1 : 0));
    setCurrentPhotoIndex(0);
  };

    const { mutate : mutateLike, isLikePending } = useMutation({
      
    });

  const handleLike = (): void => {
    if (!currentProfile) return;
    const isMatch: boolean = Math.random() > 0.5;
    if (isMatch) {
      setLastMatch(currentProfile);
      setMatches((prev) => [...prev, currentProfile!]);
      setShowMatchModal(true);
    }
    nextProfile();
  };

  const handleSkip = (): void => {
    nextProfile();
  };

  const handleReport = (): void => {
    if (!currentProfile) return;
    alert(`Reported ${currentProfile.name}. Thank you for helping keep our community safe.`);
    nextProfile();
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
    // In a real app, this would navigate to the chat
    if (lastMatch) {
      alert(`Starting chat with ${lastMatch.name}!`);
    }
  };

  if (!currentProfile) {
    return (
      <div className="flex items-center justify-center flex-1 mt-16 lg:mt-0 pb-20 lg:pb-0">
        <div className="text-center px-4">
          <Heart className="h-16 w-16 text-pink-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No more profiles!</h2>
          <p className="text-muted-foreground text-sm">Check back later for new suggestions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pt-16 lg:pt-0 bg-gradient-to-br from-pink-50/50 to-purple-50/50 dark:from-background dark:to-background overflow-x-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur-sm lg:sticky lg:top-0 z-20">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
            Discover Profiles
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} today
          </p>
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
              filters={filters}
              onChange={(f) => { setFilters(f); setFilterOpen(false); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
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
            <div className="relative h-72 sm:h-80 md:h-96 overflow-hidden">
              <img
                src={currentProfile.photos[currentPhotoIndex]}
                alt={currentProfile.name}
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
                {currentProfile.photos.map((_, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i === currentPhotoIndex ? 'bg-white' : 'bg-white/40'}`} />
                ))}
              </div>

              {/* Gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

              {/* Name overlay */}
              <div className="absolute bottom-3 left-4 right-4 text-white pointer-events-none">
                <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{currentProfile.name}, {currentProfile.age}</h2>
                    <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span>{currentProfile.distance}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-0.5 backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium">{currentProfile.fameRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-4">
              <div className="flex gap-3 text-xs text-muted-foreground mb-3">
                <span>💼 {currentProfile.occupation}</span>
                <span>🎓 {currentProfile.education}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">{currentProfile.bio}</p>
              <div className="flex flex-wrap gap-1.5">
                {currentProfile.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center items-center gap-5">
            <Button
              onClick={handleReport}
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

          {/* Match count — mobile only */}
          <p className="text-center text-xs text-muted-foreground mt-3 sm:hidden">
            {matches.length} {matches.length === 1 ? 'match' : 'matches'} today
          </p>
        </div>
      </div>

      {/* Match Modal */}
      {showMatchModal && lastMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border animate-in slide-in-from-bottom-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">It's a Match!</h2>
            <p className="text-muted-foreground mb-6">
              You and <span className="font-semibold text-foreground">{lastMatch.name}</span> liked each other
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



// ─── Filter Form ─────────────────────────────────────────────────────────────

function FilterForm({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const [local, setLocal] = useState<Filters>(filters);

  const toggleTag = (tag: string) =>
    setLocal((p) => ({
      ...p,
      tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag],
    }));

  return (
    <div className="space-y-5 py-2">

      {/* Age */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Age Range</Label>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Min age</Label>
            <Input
              type="number" min={18} max={local.ageRange[1]}
              value={local.ageRange[0]}
              onChange={(e) => setLocal((p) => ({ ...p, ageRange: [+e.target.value, p.ageRange[1]] }))}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Max age</Label>
            <Input
              type="number" min={local.ageRange[0]} max={99}
              value={local.ageRange[1]}
              onChange={(e) => setLocal((p) => ({ ...p, ageRange: [p.ageRange[0], +e.target.value] }))}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Fame rating */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">
          Fame Rating — {local.fameRange[0].toFixed(1)} to {local.fameRange[1].toFixed(1)}
        </Label>
        <Slider
          min={0} max={5} step={0.1}
          value={local.fameRange}
          onValueChange={(v) => setLocal((p) => ({ ...p, fameRange: v as [number, number] }))}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span><span>5</span>
        </div>
      </div>

      <Separator />

      {/* Distance */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">
          Max Distance — {local.maxDistance} km
        </Label>
        <Slider
          min={5} max={500} step={5}
          value={[local.maxDistance]}
          onValueChange={(v) => setLocal((p) => ({ ...p, maxDistance: v[0] }))}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5 km</span><span>500 km</span>
        </div>
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Interests</Label>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => (
            <Badge
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`cursor-pointer select-none transition-colors ${
                local.tags.includes(tag)
                  ? 'bg-pink-500 hover:bg-pink-600 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onChange(local)}
        className="w-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 border-0 mt-2"
      >
        Apply Filters
      </Button>
    </div>
  );
}