import { Profile } from "@/types/profile";

export  const profiles: Profile[] = [
    {
      id: 1,
      name: "Emma Thompson",
      age: 26,
      location: "New York, NY",
      distance: "2 miles away",
      fameRating: 4.8,
      bio: "Adventure seeker, coffee enthusiast, and dog lover. Looking for someone to explore the city with and share good laughs.",
      photos: [
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1506863530036-1efeddceb993?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop"
      ],
      tags: ["Travel", "Photography", "Hiking", "Coffee", "Dogs"],
      occupation: "Graphic Designer",
      education: "NYU"
    },
    {
      id: 2,
      name: "Marcus Johnson",
      age: 29,
      location: "Brooklyn, NY",
      distance: "5 miles away",
      fameRating: 4.2,
      bio: "Musician by night, software engineer by day. Love live music, good food, and meaningful conversations.",
      photos: [
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=400&h=500&fit=crop"
      ],
      tags: ["Music", "Coding", "Food", "Books", "Guitar"],
      occupation: "Software Engineer",
      education: "Columbia University"
    },
    {
      id: 3,
      name: "Sophia Chen",
      age: 24,
      location: "Manhattan, NY",
      distance: "3 miles away",
      fameRating: 4.6,
      bio: "Yoga instructor and wellness coach. Passionate about mindfulness, healthy living, and making genuine connections.",
      photos: [
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop",
        "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=500&fit=crop"
      ],
      tags: ["Yoga", "Wellness", "Meditation", "Fitness", "Nature"],
      occupation: "Yoga Instructor",
      education: "FIT"
    }
  ];
