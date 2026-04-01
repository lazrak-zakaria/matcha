


"use client";



import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Upload, Star } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { profileApi } from '@/services/profile.api';
import { toast } from 'sonner';

// { id: '1', url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face', isAvatar: true },
// 

type ImageType = {
  id: number | string;
  url: string;
  file?: File;
  isAvatar: boolean;
  isExisting: boolean;
};


export default function ImageSettings() {
  // const [images, setImages] = useState<ProfileImage[]>([]);
  const { user } = useAuthStore();
  const userId = user?.userId;

  const { data: dataImages, isLoading: loadingImages } = useQuery({
    queryKey: ['profile', 'images', userId],
    queryFn: () => profileApi.getImages(userId || ""),
    enabled: !!userId,
  });
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

  const [images, setImages] = useState<ImageType[]>([]);

  useEffect(() => {
    if (!Array.isArray(dataImages)) {
      return;
    }

    setImages(
      dataImages.map((img: any) => ({
        id: img.id,
        url: img.url.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${img.url}` : img.url,
        isAvatar: img.isAvatar,
        isExisting: true,
      }))
    );
  }, [dataImages]);

  const isImagesLoading = !userId || loadingImages;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.slice(0, 5 - images.length).map((file, i) => ({
      id: Date.now() + i + '',
      file,
      url: URL.createObjectURL(file),
      isAvatar: false,
      isExisting: false
    }));
    setImages([...images, ...newImages]);
  };

  const removeImage = (id: any) => {
    const filtered = images.filter(img => img.id !== id);
    if (images.find(img => img.id === id)?.isAvatar && filtered.length > 0) {
      filtered[0].isAvatar = true;
    }
    if (images.find(img => img.id === id)?.isExisting) {
      setRemovedImageIds([...removedImageIds, id]);
    }
    setImages(filtered);
  };

  const setProfile = (id: number | string) => {
    images.forEach(img => {
      if (img.id === id) {
        img.isAvatar = true;
      } else {
        img.isAvatar = false;
      }
    });
    setImages([...images]);
  };



  const { mutate, isPending } = useMutation({
    mutationFn: (formData: FormData) => profileApi.updateImages(user?.userId || "", formData),
    onSuccess: (result: any) => {
      toast("Images updated successfully.");
      setRemovedImageIds([]);
      user && useAuthStore.setState((state) => ({


        user: { ...state.user, avatar: result.avatar.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${result.avatar}` : result.avatarr  }
      }))
    },
    onError: (err: any) => {
      console.error("Error updating images:", err);
      toast("Failed to update images. Please try again.");
    },
  });

  const handleImageUpdate = () => {

    const formData = new FormData();

    images.forEach((img) => {
      if (!img.isExisting && img.file) {
        formData.append("images", img.file);
      }
    });


    const avatar = images.find(img => img.isAvatar);
    if (avatar && avatar.isExisting) {
      formData.append("avatarId", avatar.id.toString());
      console.log(`formData.get("avatarId"): ${formData.get("avatarId")}`);
    }
    else if (avatar) {
      formData.append("avatarIndex", images.findIndex(img => img.isAvatar).toString());
      console.log(`formData.get("avatarIndex"): ${formData.get("avatarIndex")}`);
    }


    const existingIds = images
      .filter(img => img.isExisting)
      .map(img => img.id);

    formData.append("existingImages", JSON.stringify(existingIds));

    mutate(formData);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Your Photos</h2>
      {
        isImagesLoading ? (
          <div>Loading images...</div>
        ) : (
          images.length === 0) ? (
          <div>No images uploaded yet.</div>
        ) : (

          <div className="grid grid-cols-2 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url}
                  className="w-full aspect-square object-cover rounded-lg"
                />

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center gap-2 transition-opacity">
                  {!image.isAvatar && (
                    <Button size="sm" onClick={() => setProfile(image.id)}>
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => removeImage(image.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {image.isAvatar && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Profile
                  </div>
                )}
              </div>
            ))}

            {images.length < 5 && (
              <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex items-center justify-center cursor-pointer hover:border-gray-400">
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Photo</span>
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )
      }

      <Button className="w-full mt-6" onClick={handleImageUpdate}>Save Changes</Button>
    </div>
  )
}

// export default ImageSettings;