export interface Profile {
  id: number;
  name: string;
  age: number;
  location: string;
  distance: string;
  fameRating: number;
  bio: string;
  photos: string[];
  tags: string[];
  occupation: string;
  education: string;
}

export interface DragOffset {
  x: number;
  y: number;
}

export interface DragStart {
  x: number;
  y: number;
}

export interface Filters {
  ageRange: [number, number];
  fameRange: [number, number];
  maxDistance: number;
  tags: string[];
}
