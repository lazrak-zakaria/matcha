"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, ChevronLeft, ChevronRight, Flag, Heart, MapPin, MessageCircle, ShieldX, Star, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import chatApi from "@/services/chat.api";
import { interactionService } from "@/services/interactions.api";
import { profileApi } from "@/services/profile.api";
import { toast } from "sonner";

type UserProfile = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  city?: string | null;
  age?: number | null;
  bio?: string | null;
  gender?: string | null;
  fameRating?: number;
  isOnline?: boolean;
  lastSeen?: string;
};

type UserImage = {
  url: string;
  isAvatar?: boolean;
};

type UserTag = {
  id: number;
  name: string;
};

type UserQuestion = {
  id: number;
  question: string;
  answer: string;
  displayOrder: number;
};

export default function UserProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const userId = params?.id;
  const numericUserId = Number(userId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile", userId],
    queryFn: () => profileApi.getProfileById(userId ?? ""),
    enabled: !!userId,
  });

  const { data: images, isLoading: imagesLoading } = useQuery<UserImage[]>({
    queryKey: ["user-profile-images", userId],
    queryFn: () => profileApi.getImages(userId ?? ""),
    enabled: !!userId,
  });

  const { data: tags, isLoading: tagsLoading } = useQuery<UserTag[]>({
    queryKey: ["user-profile-tags", userId],
    queryFn: () => profileApi.getTags(userId ?? ""),
    enabled: !!userId,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<UserQuestion[]>({
    queryKey: ["user-profile-questions", userId],
    queryFn: () => profileApi.getQuestions(userId ?? ""),
    enabled: !!userId,
  });

  const { data: relationship, isLoading: relationshipLoading } = useQuery({
    queryKey: ["user-relationship", numericUserId],
    queryFn: () => interactionService.getRelationshipStatus(numericUserId),
    enabled: Number.isFinite(numericUserId),
  });

  const refreshRelationship = () => {
    queryClient.invalidateQueries({ queryKey: ["user-relationship", numericUserId] });
    queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
  };

  const likeMutation = useMutation({
    mutationFn: () => interactionService.likeUser(numericUserId),
    onSuccess: refreshRelationship,
  });

  const removeLikeMutation = useMutation({
    mutationFn: () => interactionService.removeLike(numericUserId),
    onSuccess: refreshRelationship,
  });

  const blockMutation = useMutation({
    mutationFn: () => interactionService.blockUser(numericUserId),
    onSuccess: refreshRelationship,
  });

  const unblockMutation = useMutation({
    mutationFn: () => interactionService.unblockUser(numericUserId),
    onSuccess: refreshRelationship,
  });

  const reportMutation = useMutation({
    mutationFn: () => interactionService.reportUser(numericUserId, "fake_user"),
    onSuccess: () => {
      toast.success("Thanks, your report has been submitted.");
      setShowReportDialog(false);
    },
    onError: () => {
      toast.error("Unable to submit report right now.");
    },
  });

  const messageMutation = useMutation({
    mutationFn: async () => {
      const response = await chatApi.getOrCreateConversation(numericUserId);
      return response.conversationId;
    },
    onSuccess: (conversationId) => {
      router.push(`/chat?conversationId=${conversationId}`);
    },
  });

  const avatarSrc = useMemo(() => {
    const avatar = images?.find((item) => item.isAvatar)?.url ?? images?.[0]?.url;
    if (!avatar) return "";
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
    return `${process.env.NEXT_PUBLIC_API_URL}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
  }, [images]);

  const imageSources = useMemo(() => {
    return (images ?? []).map((img) => {
      if (img.url.startsWith("http://") || img.url.startsWith("https://")) return img.url;
      return `${process.env.NEXT_PUBLIC_API_URL}${img.url.startsWith("/") ? img.url : `/${img.url}`}`;
    });
  }, [images]);

  const openImageModal = (index: number) => {
    setModalImageIndex(index);
    setShowImageModal(true);
  };

  const closeImageModal = () => setShowImageModal(false);

  const goToPrevImage = () => {
    setModalImageIndex((prev) => (prev === 0 ? imageSources.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    setModalImageIndex((prev) => (prev === imageSources.length - 1 ? 0 : prev + 1));
  };

  const onlineText = profile?.isOnline
    ? 'Online now'
    : profile?.lastSeen
      ? `Last seen ${new Date(profile.lastSeen).toLocaleString()}`
      : 'Offline';

  const fallbackQuestions = [
    { q: 'Who am I?', a: `${profile?.firstName ?? ''} ${profile?.lastName ?? ''} (@${profile?.username ?? ''})`.trim() },
    { q: 'What is my age?', a: profile?.age ? `${profile.age} years old` : 'Not shared yet' },
    { q: 'How do I identify?', a: profile?.gender ?? 'Not shared yet' },
    { q: 'What am I into?', a: (tags ?? []).length > 0 ? (tags ?? []).map((tag) => `#${tag.name}`).join(', ') : 'No interests shared yet' },
    { q: 'What should you know first?', a: profile?.bio?.trim() || 'No bio available yet' },
  ];

  const aboutQuestions = (questions ?? []).length > 0
    ? (questions ?? []).map((item) => ({ q: item.question, a: item.answer }))
    : fallbackQuestions;

  const isLoading = profileLoading || imagesLoading || relationshipLoading || tagsLoading || questionsLoading;

  if (!userId) {
    return <div className="p-6">Invalid user id.</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading user profile...</div>;
  }

  if (!profile) {
    return <div className="p-6">User not found.</div>;
  }

  return (
    <div className="container bg-white min-h-screen mt-16 mb-16 lg:mt-0 lg:mb-0 max-w-screen p-4">
      <div className="flex items-center justify-between border-b pb-3">
        <Button variant="ghost" className="px-2" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Badge variant="outline" className="text-xs">
          {onlineText}
        </Badge>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:justify-around">
        <div className="w-full lg:max-w-md">
          <div className="mb-4 flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarSrc} alt={profile.username} />
              <AvatarFallback>
                {(profile.firstName?.[0] ?? "") + (profile.lastName?.[0] ?? "") || profile.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}{profile.age ? `, ${profile.age}` : ''}
              </h1>
              <p className="text-sm text-gray-600">@{profile.username}</p>
              {profile.city ? (
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{profile.city}</span>
                </div>
              ) : null}
              <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                Fame {profile.fameRating ?? 0}/5
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {relationship?.likesMe ? <Badge className="bg-pink-100 text-pink-700">Liked you</Badge> : null}
                {relationship?.isMatched ? <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge> : null}
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {relationship?.isMatched && !relationship?.iBlocked && !relationship?.blockedMe ? (
              <Button
                onClick={() => messageMutation.mutate()}
                disabled={messageMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Button>
            ) : null}

            {!relationship?.iBlocked && !relationship?.blockedMe ? (
              relationship?.iLike ? (
                <Button variant="outline" onClick={() => removeLikeMutation.mutate()} disabled={removeLikeMutation.isPending}>
                  <Heart className="mr-2 h-4 w-4" />
                  Remove Like
                </Button>
              ) : (
                <Button onClick={() => likeMutation.mutate()} disabled={likeMutation.isPending} className="bg-pink-600 hover:bg-pink-700">
                  <Heart className="mr-2 h-4 w-4" />
                  Like
                </Button>
              )
            ) : null}

            {relationship?.iBlocked ? (
              <Button variant="outline" onClick={() => unblockMutation.mutate()} disabled={unblockMutation.isPending}>
                <ShieldX className="mr-2 h-4 w-4" />
                Unblock
              </Button>
            ) : (
              <Button variant="destructive" onClick={() => blockMutation.mutate()} disabled={blockMutation.isPending || Boolean(relationship?.blockedMe)}>
                <Ban className="mr-2 h-4 w-4" />
                Block
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setShowReportDialog(true)}
              disabled={reportMutation.isPending}
            >
              <Flag className="mr-2 h-4 w-4" />
              Report
            </Button>
          </div>

          {relationship?.blockedMe ? (
            <p className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              You cannot interact with this user.
            </p>
          ) : null}

          {relationship?.iBlocked ? (
            <p className="mb-4 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              You blocked this user. Notifications and messages are stopped.
            </p>
          ) : null}

          <div className="mb-6">
            <h3 className="mb-3 font-semibold">Photos</h3>
            {imageSources.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {imageSources.map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                      index === 0 ? 'col-span-2 row-span-2' : ''
                    } ${activeImageIndex === index ? 'ring-2 ring-pink-500' : ''}`}
                    onClick={() => {
                      setActiveImageIndex(index);
                      openImageModal(index);
                    }}
                  >
                    <img
                      src={image}
                      alt={`${profile.username} photo ${index + 1}`}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No photos available.</p>
            )}
          </div>
        </div>

        <div className="w-full lg:max-w-md space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold">Tags</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(tags ?? []).length > 0 ? (
                (tags ?? []).map((tag) => (
                  <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">No tags available.</p>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold">About Me Q&A</h3>
            <div className="mt-3 space-y-3">
              {aboutQuestions.map((item) => (
                <div key={item.q} className="rounded-md border bg-gray-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.q}</p>
                  <p className="mt-1 text-sm text-gray-800 break-words">{item.a}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {showImageModal && imageSources.length > 0 ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={closeImageModal}>
          <button
            onClick={closeImageModal}
            className="absolute right-4 top-4 text-white hover:text-gray-300"
            aria-label="Close image modal"
          >
            <X className="h-8 w-8" />
          </button>

          <button
            onClick={(event) => {
              event.stopPropagation();
              goToPrevImage();
            }}
            className="absolute left-4 text-white hover:text-gray-300"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <button
            onClick={(event) => {
              event.stopPropagation();
              goToNextImage();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          <div className="relative flex h-full w-full max-h-full max-w-4xl items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <img
              src={imageSources[modalImageIndex]}
              alt={`${profile.username} enlarged photo ${modalImageIndex + 1}`}
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}

      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report as fake user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will report this account for possible impersonation or fake identity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reportMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending}>
              {reportMutation.isPending ? "Reporting..." : "Yes, report"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
