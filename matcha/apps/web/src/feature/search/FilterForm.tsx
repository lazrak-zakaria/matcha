"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { profileApi } from "@/services/profile.api";
import { Filters } from "@/types/profile";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type AggregatedTag = {
        id: number;
        name: string;
        selected: boolean;
};

export default function FilterForm({
    onChange,
}: {
    onChange: (f: Filters) => void;
}) {
    const [local, setLocal] = useState<Filters>({
        ageRange: [18, 60],
        fameRange: [0, 5],
        maxDistance: 100,
        tags: [],
    });
    const hasInitializedTags = useRef(false);

    const toggleTag = (tag: string) =>
        setLocal((p) => ({
            ...p,
            tags: p.tags.includes(tag) ? p.tags.filter((t) => t !== tag) : [...p.tags, tag],
        }));


    const {data: dataPreferences, isLoading: loadingPreferences} = useQuery({
        queryKey: ['searchPreferences'],
        queryFn: profileApi.getSearchPreferences,
    });

    const { data: tagsData, isLoading: loadingTags } = useQuery<AggregatedTag[]>({
        queryKey: ['searchPreferenceTags'],
        queryFn: profileApi.getPreferenceTagsAggregated,
    });

    useEffect(() => {
        if (!dataPreferences) {
            return;
        }

        setLocal((prev) => ({
            ...prev,
            ageRange: [dataPreferences.minAge ?? prev.ageRange[0], dataPreferences.maxAge ?? prev.ageRange[1]],
            fameRange: [Math.round(dataPreferences.minFameRating ?? prev.fameRange[0]), Math.round(dataPreferences.maxFameRating ?? prev.fameRange[1])],
            maxDistance: dataPreferences.locationRadiusKm ?? prev.maxDistance,
        }));
    }, [dataPreferences]);

    useEffect(() => {
        if (!Array.isArray(tagsData) || hasInitializedTags.current) {
            return;
        }

        hasInitializedTags.current = true;
        setLocal((prev) => ({
            ...prev,
            tags: tagsData.filter((tag) => tag.selected).map((tag) => tag.name),
        }));
    }, [tagsData]);


    const {mutate : applyFilters , isPending : isApplyingFilters } = useMutation({
        mutationFn: profileApi.updatePreferences,
        onSuccess: () => {
            onChange(local);
            toast("Filters updated successfully.");
        },
        onError: (err : any) => {
            console.error("Failed to update preferences:", err);
            toast("Failed to update filters. Please try again.");
        }
    })

    const handleSubmit = () => {
        const selectedTagIds = (tagsData ?? [])
            .filter((tag) => local.tags.includes(tag.name))
            .map((tag) => tag.id);
        
        const data = {
            minAge: local.ageRange[0],
            maxAge: local.ageRange[1],
            minFameRating: local.fameRange[0],
            maxFameRating: local.fameRange[1],
            locationRadiusKm: local.maxDistance,
            tagIds: selectedTagIds,
        }
        console.log("Submitting filters:", data);
        applyFilters(data);
    }

    if (loadingPreferences || loadingTags) {
        return <div>Loading...</div>;
    }

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
                    Fame Rating — {local.fameRange[0]} to {local.fameRange[1]}
                </Label>
                <Slider
                    min={0} max={5} step={1}
                    value={local.fameRange}
                    onValueChange={(v) =>
                        setLocal((p) => ({
                            ...p,
                            fameRange: [Math.round(v[0]), Math.round(v[1])],
                        }))
                    }
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
                    {(tagsData ?? []).map((tag) => (
                        <Badge
                            key={tag.id}
                            onClick={() => toggleTag(tag.name)}
                            className={`cursor-pointer select-none transition-colors ${local.tags.includes(tag.name)
                                ? 'bg-pink-500 hover:bg-pink-600 text-white'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                }`}
                        >
                            {tag.name}
                        </Badge>
                    ))}
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                disabled={isApplyingFilters}
                className="w-full rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 border-0 mt-2"
            >
                Apply Filters
            </Button>
        </div>
    );
}