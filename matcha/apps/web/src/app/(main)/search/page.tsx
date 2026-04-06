"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { browsingService } from "@/services/browsing.api";

type SearchResultUser = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  isOnline: boolean;
  lastSeen?: string | null;
  likedYou: boolean;
  isConnected: boolean;
  age?: number | null;
  fameRating?: number | null;
  distanceKm?: number | null;
};

const resolveAvatar = (avatar?: string | null) => {
  if (!avatar) return "";
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) return avatar;
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
  return `${base}${avatar.startsWith("/") ? avatar : `/${avatar}`}`;
};

export default function SearchPage() {
  const router = useRouter();
  const [searchName, setSearchName] = useState("");
  const [debouncedName, setDebouncedName] = useState("");
  const [sortBy, setSortBy] = useState<'fame' | 'age' | 'location'>('fame');
  const [results, setResults] = useState<SearchResultUser[]>([]);

  const { mutate: searchUsers, isPending } = useMutation({
    mutationFn: ({ name, sort }: { name: string; sort: 'fame' | 'age' | 'location' }) =>
      browsingService.searchUsersByName(name, sort),
    onSuccess: (response: { data: SearchResultUser[] }) => {
      setResults(response.data ?? []);
    },
  });

  const canSearch = useMemo(() => searchName.trim().length > 0, [searchName]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedName(searchName.trim());
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchName]);

  useEffect(() => {
    if (!debouncedName) {
      setResults([]);
      return;
    }

    searchUsers({ name: debouncedName, sort: sortBy });
  }, [debouncedName, sortBy, searchUsers]);

  return (
    <div className="min-h-screen bg-white mt-16 mb-16 lg:mt-0 lg:mb-0 p-4 md:p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Search People</h1>
        <p className="text-sm text-gray-600">Find people by first name, last name, or username.</p>

        <div className="flex items-center gap-2">
          <Input
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
            placeholder="Type a name or username"
          />
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as 'fame' | 'age' | 'location')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort results" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fame">Sort by fame</SelectItem>
              <SelectItem value="age">Sort by age</SelectItem>
              <SelectItem value="location">Sort by location</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 pt-2">
          {!canSearch ? (
            <p className="text-sm text-gray-500"></p>
          ) : isPending ? (
            <p className="text-sm text-gray-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-gray-500">No users found yet. Search by name to see results.</p>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  router.push(`/user/${user.id}`);
                }}
                className="w-full rounded-lg border p-3 text-left transition hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={resolveAvatar(user.avatar)} alt={user.username} />
                    <AvatarFallback>
                      <UserRound className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium text-gray-900">
                        {user.firstName} {user.lastName} <span className="text-gray-500">@{user.username}</span>
                      </p>
                      <Badge variant="outline" className={user.isOnline ? "text-green-700 border-green-300" : "text-gray-600"}>
                        {user.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      {user.isOnline ? "Active now" : user.lastSeen ? `Last seen: ${new Date(user.lastSeen).toLocaleString()}` : "Last seen unavailable"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {typeof user.fameRating === 'number' ? <Badge variant="outline">Fame: {user.fameRating.toFixed(1)}/5</Badge> : null}
                      {typeof user.age === 'number' ? <Badge variant="outline">Age: {user.age}</Badge> : null}
                      {typeof user.distanceKm === 'number' ? <Badge variant="outline">{user.distanceKm.toFixed(1)} km</Badge> : null}
                      {user.likedYou ? <Badge className="bg-pink-100 text-pink-700">Liked you</Badge> : null}
                      {user.isConnected ? <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge> : null}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
