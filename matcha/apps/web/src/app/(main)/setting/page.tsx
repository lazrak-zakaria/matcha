"use client";
import { AppWindowIcon, CodeIcon } from "lucide-react"
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

export default function Settings() {


    const tags: string[] = [];

    const availableTags : string[]  = [
    "Work", "Personal", "Banking", "Social Media", "Email", 
    "Shopping", "Gaming", "Development", "Admin", "Backup"
  ]
    return (
        <div className="flex items-center justify-center">

            <div className="flex w-full max-w-sm flex-col gap-6">
                <Tabs defaultValue="account">
                    <TabsList>
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
                                    <Label htmlFor="tabs-demo-name">First name</Label>
                                    <Input id="tabs-demo-name" defaultValue="Pedro Duarte" />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-demo-name">Last name</Label>
                                    <Input id="tabs-demo-name" defaultValue="Pedro Duarte" />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-demo-username">Username</Label>
                                    <Input id="tabs-demo-username" defaultValue="@peduarte" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button>Update</Button>
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
                                    <Label htmlFor="tabs-demo-current">Current password</Label>
                                    <Input id="tabs-demo-current" type="password" />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="tabs-demo-new">New password</Label>
                                    <Input id="tabs-demo-new" type="password" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button>Update</Button>
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
                                <div className="grid w-full gap-3">
                                    <Label htmlFor="message-2">Enter your age</Label>
                                    <Input id="age" type="number" placeholder="Enter your age" min={18} max={120} />
                                </div>
                                <div className="grid w-full gap-3">

                                    <Select>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select your gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Gender</SelectLabel>
                                                <SelectItem value="male">Gay</SelectItem>
                                                <SelectItem value="femal">Lesbien</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid w-full gap-3">
                                    <Label htmlFor="message-2">Your Bio</Label>
                                    <Textarea placeholder="Type your Bio here." id="message-2" />
                                </div>



                                <div className="grid gap-3">
                                    <Label>Tags</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableTags.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                // onClick={() => handleTagToggle(tag)}
                                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${tags.includes(tag)
                                                        ? 'bg-blue-500 text-white border-blue-500'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    {tags.length > 0 && (
                                        <div className="text-sm text-gray-600">
                                            Selected: {tags.join(', ')}
                                        </div>
                                    )}
                                </div>

                            </CardContent>
                            <CardFooter>
                                <Button>Update</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>


                </Tabs>
            </div>
        </div>

    )
}