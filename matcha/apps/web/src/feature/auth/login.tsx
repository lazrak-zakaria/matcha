"use client"
import { Button } from "@/components/ui/button"
import { set, z } from "zod"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { authService } from "@/services/auth.api"
import { registerSchema } from "./register"
import { formatZodError } from "@/lib/formatError"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { LocationPermissionDialog } from "@/components/LocationPermissionDialog"



export const loginSchema = z.object({
    email: z.email({ message: "Please enter a valid email address." }).max(255),
    password: z.string().min(8, { message: "Password must be at least 8 characters." })
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
            /[^A-Za-z0-9]/,
            "Password must contain at least one special character",
        ),
});
export type LoginInput = z.infer<typeof loginSchema>

export default function LoginForm({handlePageChange} : {handlePageChange: (page: 'login' | 'register') => void}) {

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showLocationDialog, setShowLocationDialog] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);
    const locationPermissionAsked = useAuthStore((state) => state.locationPermissionAsked);
    const userLocation = useAuthStore((state) => state.userLocation);
    const router = useRouter();

    const { mutate, isPending } = useMutation({
        mutationFn: authService.login,
        onSuccess: (result: any) => {
            if (result.user.avatar && result.user.avatar.startsWith("/")) {
                result.user.avatar = `${process.env.NEXT_PUBLIC_API_URL}${result.user.avatar}`;
            }

            setAuth(result.user, result.accessToken);
            toast("Logged in successfully.");
            
            // Prompt when we still do not have coordinates.
            const shouldAskForLocation = !locationPermissionAsked || !userLocation;
            if (shouldAskForLocation) {
                setShowLocationDialog(true);
            } else {
                router.push("/home");
            }
        },
        onError: (err: any) => {
            console.error("Login error:", err);
            if (err.details?.fieldErrors) {
                console.log("Validation errors:", err.details.fieldErrors);
                setFormErrors(err.details.fieldErrors);
                console.log(err.details.fieldErrors);
            } else {
                console.error(err);
                setFormErrors({ message: err.message || "An error occurred during login." });
            }
        },
    });

    const handleLocationDialogOpenChange = (open: boolean) => {
        setShowLocationDialog(open);
        if (!open) {
            router.push("/home");
        }
    };

    const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormErrors({});

        const formElement = event.currentTarget;
        const formData = new FormData(formElement);

        const inputData = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        };
        const validationResult = loginSchema.safeParse(inputData);
        if (!validationResult.success) {
            return setFormErrors(formatZodError(validationResult));
        }

        mutate(inputData);
    }


    return (
        <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-rose-100 p-6 md:p-10">
            <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_14%_16%,rgba(251,113,133,0.32),transparent_35%),radial-gradient(circle_at_86%_76%,rgba(244,114,182,0.24),transparent_38%),linear-gradient(150deg,#fff3f5,#fdf2f8_45%,#fff7f9)]" />
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(225,29,72,0.12)_1px,transparent_1px),linear-gradient(to_right,rgba(225,29,72,0.12)_1px,transparent_1px)] [background-size:40px_40px]" />

            <div className="relative z-10 w-full max-w-sm space-y-5">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">Welcome to Matcha</p>
                    <h1 className="mt-2 text-2xl font-bold text-rose-900">Find your next meaningful connection</h1>
                </div>

                <Card className="border-rose-200 bg-rose-50/90 shadow-xl shadow-rose-100">
                    <CardHeader>
                        <CardTitle>Sign in</CardTitle>
                        <CardDescription>
                            Enter your information below to sign in to your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {
                            formErrors.message && (
                            <p className="text-red-500 text-center ">{formErrors.message}</p>
                            )
                        } 
                            <form onSubmit={handleLogin}>
                            <FieldGroup className="gap-2">
                                <Field>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        name="email"
                                        required
                                    />
                                    {formErrors.email && (
                                        <span className="text-xs text-red-500">
                                            {formErrors.email}
                                        </span>
                                    )}
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <div className="relative">
                                        <Input id="password" type={showPassword ? "text" : "password"} name="password" required className="pr-10" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {formErrors.password && (
                                        <span className="text-xs text-red-500">
                                            {formErrors.password}
                                        </span>
                                    )}
                                    <FieldDescription>
                                        Must be at least 8 characters long.
                                    </FieldDescription>
                                </Field>

                                <FieldGroup>
                                    <Field>
                                        {isPending ? (
                                            <Button type="submit" disabled>
                                                Login
                                            </Button>
                                        ) : (
                                            <Button type="submit">Login</Button>
                                        )}
                                        <Button variant="outline" type="button">
                                            Sign in with Google
                                        </Button>
                                        <FieldDescription className="px-6 text-center">
                                            Don't have an account? <button
                                            type="button"
                                            onClick={() => handlePageChange("register")}
                                            className=" hover:underline font-medium"
                                        >
                                            Sign up
                                        </button>
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <LocationPermissionDialog 
                open={showLocationDialog}
                onOpenChange={handleLocationDialogOpenChange}
            />
        </div>
    )
}
