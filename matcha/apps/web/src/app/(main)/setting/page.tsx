"use client";
import { Camera, Eye, EyeOff, Trash } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import z, { set } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { settingApi } from "@/services/setting.api";
import { toast } from "sonner";
import { ta } from "zod/locales";


export const userAccountUpdate = z.object({
    username: z.string().min(2).max(50),
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
})

export const userProfileUpdate = z.object({
    age: z.coerce.number().int().positive(),
    bio: z.string().max(2000),
    gender: z.enum(['male', 'female', 'other'])
})

export const userPasswordUpdate = z.object({
    currentPassword: z.string().min(8, { message: "Password must be at least 8 characters." })
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
            /[^A-Za-z0-9]/,
            "Password must contain at least one special character",
        ),
    newPassword: z.string().min(8, { message: "Password must be at least 8 characters." })
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
            /[^A-Za-z0-9]/,
            "Password must contain at least one special character",
        ),
    confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters." })
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
            /[^A-Za-z0-9]/,
            "Password must contain at least one special character",
        )
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});


export default function Settings() {

    const { user, age, bio, gender, setProfileDetails } = useAuthStore();
    const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
    const [accountForm, setAccountForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
    })

    const [profileForm, setProfileForm] = useState({
        age: age ?? user?.age ?? 18,
        bio: bio ?? user?.bio ?? '',
        gender: gender ?? user?.gender ?? 'other',
    })
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});



    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        user?.avatar || null,
    );
    const [previewMode, setPreviewMode] = useState(false);

    // const [tags, setTags] = useState([]);



    const { data: tagsData, isLoading: isTagsLoading, isError: isTagsError, error: tagsError } = useQuery({
        queryKey: ['user', user?.id, 'tags'],
        queryFn: async () => {
            console.log("Fetching tags...");
            return await settingApi.getTagsAggregated();
        },
    });

    const [tags, setTags] = useState<Array<string>>(Array.isArray(tagsData) ? tagsData : []);

    const [questions, setQuestions] = useState<Array<{ question: string; answer: string }>>([]);

    const { data: questionsData, isLoading: isQuestionsLoading } = useQuery({
        queryKey: ['profile-questions', user?.userId],
        queryFn: () => settingApi.getQuestions(user?.userId || ''),
        enabled: !!user?.userId,
    });


    useEffect(() => {
        if (Array.isArray(questionsData)) {
            setQuestions(
                questionsData.map((item: any) => ({
                    question: item.question ?? '',
                    answer: item.answer ?? '',
                })),
            );
        }
    }, [questionsData]);

    useEffect(() => {
        if (tagsData) {
            setTags(tagsData);
        }
    }, [tagsData]);

    useEffect(() => {
        setProfileForm((prev) => ({
            ...prev,
            age: age ?? user?.age ?? prev.age,
            bio: bio ?? user?.bio ?? prev.bio,
            gender: gender ?? user?.gender ?? prev.gender,
        }))
    }, [age, bio, gender, user?.age, user?.bio, user?.gender])


    const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAccountForm((prev) => ({ ...prev, [name]: value }));
    }

    const { mutate: updateAccount, isPending: isAccountUpdating } = useMutation({
        mutationFn: settingApi.updateAccount,
        onSuccess: () => {
            toast.success("Account updated!");
            user && useAuthStore.setState((state) => ({
                user: { ...state.user, ...accountForm }
            }))
        },
        onError: (result: any) => {
            toast.error("Failed to update account.");
            const errors: Record<string, string> = {};
            for (const field in result.details.fieldErrors) {
                errors[field] = result.details.fieldErrors[field];
            }
            return setAccountErrors(errors);
        }
    }
    )

    const handleAccountUpdate = () => {
        const result = userAccountUpdate.safeParse(accountForm);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((issue: any) => {
                errors[issue.path[0] as string] = issue.message;
            });
            return setAccountErrors(errors);
        }
        updateAccount(result.data);
    }

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfileForm((prev) => ({ ...prev, [name]: value }));
    }

    const handleProfileUpdate = () => {
        const result = userProfileUpdate.safeParse(profileForm);

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((issue: any) => {
                errors[issue.path[0] as string] = issue.message;
            });
            return setProfileErrors(errors);
        }
        updateProfile(result.data);
    }

    const { mutate: updateProfile, isPending: isProfileUpdating } = useMutation({
        mutationFn: settingApi.updateProfile,
        onSuccess: () => {
            toast.success("Profile updated!");
            setProfileDetails({
                age: Number(profileForm.age),
                bio: String(profileForm.bio),
                gender: profileForm.gender as 'male' | 'female' | 'other',
            })
        },
        onError: (result: any) => {
            toast.error("Failed to update profile.");
            const errors: Record<string, string> = {};
            for (const field in result.details.fieldErrors) {
                errors[field] = result.details.fieldErrors[field];
            }
            return setProfileErrors(errors);
        }
    }
    )



    const { mutate: updatePassword, isPending: isPasswordUpdating } = useMutation({
        mutationFn: settingApi.updatePassword,
        onSuccess: () => {
            toast.success("Password updated!");
        },
        onError: (result: any) => {
            toast.error("Failed to update password.");
            const errors: Record<string, string> = {};
            for (const field in result.details.fieldErrors) {
                errors[field] = result.details.fieldErrors[field];
            }
            return setPasswordErrors(errors);
        }
    }
    )

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    }

    const handlePasswordUpdate = () => {
        const result = userPasswordUpdate.safeParse(passwordForm);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach((issue: any) => {
                errors[issue.path[0] as string] = issue.message;
            });
            return setPasswordErrors(errors);
        }
        updatePassword(result.data);
    }


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File is too large (Max 5MB)");
                return;
            }

            const url = URL.createObjectURL(file);
            setPreviewMode(true);
            setPreviewUrl(url);
        }
    };

    const cancedlPreview = () => {
        setPreviewMode(false);
        setPreviewUrl(user?.avatar || null);
        fileInputRef.current!.value = "";
    }

    const handleAvatarUpdate = () => {
        if (fileInputRef.current?.files?.[0]) {
            const file = fileInputRef.current.files[0];
            const formData = new FormData();
            formData.append("avatar", file);
            updateAvatar(formData);
        }
    }

    const { mutate: updateAvatar, isPending: isAvatarUpdating } = useMutation({
        mutationFn: settingApi.updateAvatar,
        onSuccess: (result: any) => {
            toast.success("Avatar updated!");
            setPreviewMode(false);
            fileInputRef.current!.value = "";
            if (result.avatar.startsWith("/")) {
                result.avatar = `${process.env.NEXT_PUBLIC_API_URL}${result.avatar}`;
            }
            useAuthStore.setState((state) => ({
                user: { ...state.user, avatar: result.avatar || state.user?.avatar || null }
            }))
        },
        onError: (result: any) => {
            toast.error("Failed to update avatar.");
            setPreviewMode(false);
            fileInputRef.current!.value = "";
        }
    }
    )


    const handleTagsUpdate = () => {
        const selectedTagIds = tags.filter((tag: any) => tag.selected).map((tag: any) => tag.id);
        updateTags(selectedTagIds);
    }

    const { mutate: updateTags, isPending: isTagsUpdating } = useMutation({
        mutationFn: settingApi.updateTags,
        onSuccess: () => {
            toast.success("Tags updated!");
        },
        onError: (result: any) => {
            toast.error("Failed to update tags.");
        }
    }
    )

    const { mutate: updateQuestions, isPending: isQuestionsUpdating } = useMutation({
        mutationFn: settingApi.updateQuestions,
        onSuccess: () => {
            toast.success('Questions updated!');
        },
        onError: () => {
            toast.error('Failed to update questions.');
        },
    });

    const handleQuestionFieldChange = (index: number, key: 'question' | 'answer', value: string) => {
        setQuestions((prev) => prev.map((item, idx) => idx === index ? { ...item, [key]: value } : item));
    };

    const addQuestion = () => {
        if (questions.length >= 5) return;
        setQuestions((prev) => [...prev, { question: '', answer: '' }]);
    };

    const removeQuestion = (index: number) => {
        setQuestions((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleQuestionsUpdate = () => {
        const cleaned = questions
            .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
            .filter((item) => item.question.length > 0 && item.answer.length > 0)
            .slice(0, 5);

        updateQuestions(cleaned);
    };


    // const tags: string[] = [];

    return (
        <div className="min-h-screen bg-white mt-16 mb-16 lg:mt-0 lg:mb-0">
            <div className="flex items-center justify-between border-b px-4 py-4">
                <h1 className="text-xl font-semibold">Settings</h1>
            </div>

            <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-4">
                <Tabs defaultValue="account">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                        <TabsTrigger value="email">Email</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account">
                        <Card>
                            <CardHeader>
                                <CardTitle>Account</CardTitle>
                                <CardDescription>
                                    Make changes to your account here. Click save when you&apos;re
                                    done.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-name">First name</Label>
                                    <Input
                                        id="tabs-name"
                                        defaultValue={accountForm.firstName}
                                        name="firstName"
                                        onChange={handleAccountChange}
                                    />
                                    {accountErrors.firstName && (
                                        <span className="text-xs text-red-500">
                                            {accountErrors.firstName}
                                        </span>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-name">Last name</Label>
                                    <Input
                                        id="tabs-name"
                                        defaultValue={accountForm.lastName}
                                        name="lastName"
                                        onChange={handleAccountChange}
                                    />
                                    {accountErrors.lastName && (
                                        <span className="text-xs text-red-500">
                                            {accountErrors.lastName}
                                        </span>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-username">Username</Label>
                                    <Input
                                        id="tabs-username"
                                        defaultValue={accountForm.username}
                                        name="username"
                                        onChange={handleAccountChange}
                                    />
                                    {accountErrors.username && (
                                        <span className="text-xs text-red-500">
                                            {accountErrors.username}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleAccountUpdate}>Update</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                    <TabsContent value="password">
                        <Card>
                            <CardHeader>
                                <CardTitle>Password</CardTitle>
                                <CardDescription>
                                    Change your password here.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-current">Current password</Label>
                                    <div className="relative">
                                        <Input onChange={handlePasswordChange} id="tabs-current" name="currentPassword" type={showPassword ? "text" : "password"} />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-new">New password</Label>
                                    <div className="relative">
                                        <Input onChange={handlePasswordChange} id="tabs-new" name="newPassword" type={showNewPassword ? "text" : "password"} />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                                        >
                                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-new-confirm">Confirm new password</Label>
                                    <div className="relative">

                                        <Input onChange={handlePasswordChange} id="tabs-new-confirm" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handlePasswordUpdate}>Update</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>


                    <TabsContent value="email">
                        <Card>
                            <CardHeader>
                                <CardTitle>Email</CardTitle>
                                <CardDescription>
                                    Change your email here.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-demo-new">New Email</Label>
                                    <Input id="tabs-demo-new" type="password" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button>Update</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>


                    <TabsContent value="profile">

                        <Card>
                            <CardHeader>
                                <CardTitle>Profile</CardTitle>
                                <CardDescription>
                                    Change your Profile here.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-6">
                                <div className="flex items-center gap-6">
                                    <Avatar className="w-24 h-24">
                                        <AvatarImage src={`${previewUrl}`} />
                                        <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <input
                                            type="file"
                                            name="avatar"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            // onClick={handleAvatarChange}
                                            className="gap-2"
                                        >
                                            <Camera className="w-4 h-4" />
                                            Change Avatar
                                        </Button>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            JPG, PNG or GIF. Max size 5MB.
                                        </p>

                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button disabled={!previewMode} onClick={handleAvatarUpdate}>Update</Button>
                                    {
                                        previewMode && (
                                            <Button onClick={cancedlPreview} variant="destructive">
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        )}
                                </div>


                                <div className="grid w-full gap-3">
                                    <Label htmlFor="message-2">Enter your age</Label>
                                    <Input onChange={handleProfileChange} defaultValue={user.age} name="age" id="age" type="number" placeholder="Enter your age" min={18} max={120} />
                                    {
                                        profileErrors.age && (
                                            <span className="text-xs text-red-500">
                                                {profileErrors.age}
                                            </span>
                                        )
                                    }
                                </div>
                                <div className="grid w-full gap-3">

                                    <Select value={profileForm.gender} onValueChange={(value) => setProfileForm({ ...profileForm, gender: value })}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select your gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Gender</SelectLabel>
                                                <SelectItem value="male">male</SelectItem>
                                                <SelectItem value="female">female</SelectItem>
                                                <SelectItem value="other">other</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid w-full gap-3">
                                    <Label htmlFor="message-2">Your Bio</Label>
                                    <Textarea onChange={handleProfileChange} name="bio" defaultValue={profileForm.bio} placeholder="Type your Bio here." id="message-2" />
                                </div>
                                <div>
                                    <Button onClick={handleProfileUpdate}>Update</Button>
                                </div>


                                <div className="grid gap-3">
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-2">

                                        {isTagsLoading ? (
                                            <p>Loading tags...</p>
                                        ) : isTagsError ? (
                                            <p>Error loading tags: {tagsError instanceof Error ? tagsError.message : 'Unknown error'}</p>
                                        ) : tags.length > 0 ? (
                                            tags.map((tag: any) => (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => { setTags((prev) => prev.map((t: any) => t.id === tag.id ? { ...t, selected: !t.selected } : t)) }}
                                                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${tag.selected
                                                        ? 'bg-blue-500 text-white border-blue-500'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {tag.name}
                                                </button>
                                            ))
                                        ) : (<p>No tags found.</p>
                                        )}
                                    </div>

                                </div>

                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between">
                                        <Label>About Me Q&A (max 5)</Label>
                                        <Button type="button" variant="outline" onClick={addQuestion} disabled={questions.length >= 5}>
                                            Add question
                                        </Button>
                                    </div>

                                    {isQuestionsLoading ? (
                                        <p className="text-sm text-gray-500">Loading questions...</p>
                                    ) : questions.length === 0 ? (
                                        <p className="text-sm text-gray-500">No questions yet. Add up to 5.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {questions.map((item, index) => (
                                                <Card key={`question-${index}`} className="p-3">
                                                    <div className="grid gap-2">
                                                        <Input
                                                            value={item.question}
                                                            onChange={(event) => handleQuestionFieldChange(index, 'question', event.target.value)}
                                                            placeholder={`Question ${index + 1}`}
                                                            maxLength={200}
                                                        />
                                                        <Textarea
                                                            value={item.answer}
                                                            onChange={(event) => handleQuestionFieldChange(index, 'answer', event.target.value)}
                                                            placeholder="Your answer"
                                                            maxLength={1000}
                                                        />
                                                        <div className="flex justify-end">
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => removeQuestion(index)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <div className="flex gap-2">
                                    <Button onClick={handleTagsUpdate} disabled={isTagsUpdating}>
                                        {isTagsUpdating ? 'Updating tags...' : 'Update tags'}
                                    </Button>
                                    <Button onClick={handleQuestionsUpdate} disabled={isQuestionsUpdating}>
                                        {isQuestionsUpdating ? 'Updating questions...' : 'Update questions'}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </TabsContent>


                </Tabs>
            </div>
        </div>

    )
}