"use client"


import React, { use, useEffect, useState } from 'react';
import { Settings, Edit3, Heart, Eye, MessageCircle, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/services/profile.api';

type ProfileListItem = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
};

const ProfilePage = () => {
    const { user } = useAuthStore();
    const userId = user?.userId;
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const router = useRouter();
    // const [tags, setTags] = useState<string[]>(user?.tags || []);
      const { data: dataImages, isLoading: loadingImages } = useQuery({
        queryKey: ['profile', 'images', userId],
        queryFn: () => profileApi.getImages(userId || ""),
        enabled: !!userId,
      });


    const { data: tagsData, isLoading: tagsLoading } = useQuery({
        queryKey: ['profile', 'tags'],
        queryFn: () => profileApi.getTags(user?.userId || ""),
        enabled: !!user,
    });

    const { data: lastLikesData } = useQuery<ProfileListItem[]>({
        queryKey: ['profile', 'lastLikes', userId],
        queryFn: () => profileApi.getLastLikes(),
        enabled: !!userId,
    });

    const { data: lastViewsData } = useQuery<ProfileListItem[]>({
        queryKey: ['profile', 'lastViews', userId],
        queryFn: () => profileApi.getLastViews(),
        enabled: !!userId,
    });

    const { data: lastMatchesData } = useQuery<ProfileListItem[]>({
        queryKey: ['profile', 'lastMatches', userId],
        queryFn: () => profileApi.getLastMatches(),
        enabled: !!userId,
    });



      const [images, setImages] = useState<string[]>([]);
    
      useEffect(() => {
        if (!Array.isArray(dataImages)) {
          return;
        }
    
        setImages(
          dataImages.map((img: any) => (
             img.url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${img.url}` : img.url
          ))
        );
      }, [dataImages]);

    const tags = tagsData || [];
    const lastLikes = lastLikesData || [];
    const lastViews = lastViewsData || [];
    const lastMatches = lastMatchesData || [];

    const getImageSrc = (image?: string | null) => {
        if (!image) return '';
        return image.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL}${image}` : image;
    };

    const userProfile = {
        name: `${user.firstName} ${user.lastName}`,
        age: user.age,
        // location: user.location,
        bio: user.bio,
        images: images,
        avatar: getImageSrc(user.avatar),
        tags: tags
    };

    const openImageModal = (index: number) => {
        setModalImageIndex(index);
        setShowImageModal(true);
    };

    const closeImageModal = () => {
        setShowImageModal(false);
    };

    const goToPrevImage = () => {
        setModalImageIndex((prev) => (prev === 0 ? userProfile.images.length - 1 : prev - 1));
    };

    const goToNextImage = () => {
        setModalImageIndex((prev) => (prev === userProfile.images.length - 1 ? 0 : prev + 1));
    };

    const renderList = (
        items: ProfileListItem[],
        emptyMessage: string,
        actionLabel: string,
        ActionIcon: React.ElementType,
    ) => {
        if (items.length === 0) {
            return <p className="text-sm text-gray-500">{emptyMessage}</p>;
        }

        return (
            <div className="space-y-3">
                {items.map((item) => {
                    const avatarSrc = getImageSrc(item.avatar);
                    const initials = `${item.firstName?.[0] || ''}${item.lastName?.[0] || ''}`;

                    return (
                        <Card
                            key={item.id}
                            className="p-3 cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => router.push(`/user/${item.id}`)}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={avatarSrc} alt={`${item.firstName} ${item.lastName}`} />
                                    <AvatarFallback>{initials || item.username?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h4 className="font-medium">{item.firstName} {item.lastName}</h4>
                                    <p className="text-sm text-gray-500">@{item.username}</p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/user/${item.id}`);
                                    }}
                                >
                                    <ActionIcon className="w-4 h-4 mr-1" />
                                    {actionLabel}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            closeImageModal();
        } else if (e.key === 'ArrowLeft') {
            goToPrevImage();
        } else if (e.key === 'ArrowRight') {
            goToNextImage();
        }
    };

    return (
        <div className="container bg-white min-h-screen mt-15 lg:mt-0 max-w-screen">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-semibold">Profile</h1>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="p-2" onClick={() => {router.push("/edit");}}>
                        <Edit3 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-2" onClick={() => {router.push("/setting");}}>
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content - Side by side layout on desktop, stacked on mobile */}
            <div className="flex justify-around flex-col lg:flex-row gap-6 p-4">
                {/* Left Side - Profile Section */}
                <div className="flex-1 lg:max-w-md w-full">
                    <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-20 h-20">
                            <AvatarImage src={userProfile.avatar} alt={userProfile.name} />
                            <AvatarFallback>{user.firstName.charAt(0)}{user.lastName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">{userProfile.name}, {userProfile.age}</h2>
                            <div className="flex items-center text-gray-600 text-sm mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                {/* {userProfile.location} */}
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed">{userProfile.bio}</p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {userProfile.tags.map((tag : any, index : any) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                                {tag.name}
                            </Badge>
                        ))}
                    </div>

                    {/* Photo Grid */}
                    <div className="mb-6">
                        <h3 className="font-semibold mb-3">Photos</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {userProfile.images.map((image, index) => (
                                <div
                                    key={index}
                                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${index === 0 ? 'col-span-2 row-span-2' : ''
                                        } ${activeImageIndex === index ? 'ring-2 ring-pink-500' : ''}`}
                                    onClick={() => {
                                        setActiveImageIndex(index);
                                        openImageModal(index);
                                    }}
                                >
                                    <img
                                        src={image}
                                        alt={`Photo ${index + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side - Tabs Section */}
                <div className="flex-1 lg:max-w-md w-full">
                    <Tabs defaultValue="matches" className="w-full">
                        <TabsList className="w-full mb-4">
                            <TabsTrigger value="matches">Last Matches</TabsTrigger>
                            <TabsTrigger value="views">Views</TabsTrigger>
                            <TabsTrigger value="likes">Likes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="matches">
                            {renderList(lastMatches, 'No recent matches yet.', 'Message', MessageCircle)}
                        </TabsContent>

                        <TabsContent value="views">
                            {renderList(lastViews, 'No recent views yet.', 'View', Eye)}
                        </TabsContent>

                        <TabsContent value="likes">
                            {renderList(lastLikes, 'No recent likes yet.', 'Like back', Heart)}
                        </TabsContent>
                    </Tabs>
                </div>

            </div>
            {/* Image Modal */}
            {showImageModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={closeImageModal}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeImageModal}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {/* Previous Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrevImage();
                        }}
                        className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </button>

                    {/* Next Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNextImage();
                        }}
                        className="absolute right-16 text-white hover:text-gray-300 transition-colors z-10"
                    >
                        <ChevronRight className="w-8 h-8" />
                    </button>

                    {/* Image Container */}
                    <div
                        className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={userProfile.images[modalImageIndex].replace('w=400&h=500', 'w=800&h=1000')}
                            alt={`Photo ${modalImageIndex + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg"
                        />
                    </div>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                        {modalImageIndex + 1} / {userProfile.images.length}
                    </div>

                    {/* Thumbnail Navigation */}
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {userProfile.images.map((image, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setModalImageIndex(index);
                                }}
                                className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${index === modalImageIndex ? 'border-white' : 'border-transparent opacity-70'
                                    }`}
                            >
                                <img
                                    src={image}
                                    alt={`Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;