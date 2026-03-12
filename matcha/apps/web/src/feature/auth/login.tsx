"use client"
import { Button } from "@/components/ui/button"
import { z } from "zod"
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
import { useRouter } from "next/dist/client/components/navigation"



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

export default function LoginForm() {


    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);
    const router = useRouter();


    const { mutate, isPending } = useMutation({
        mutationFn: authService.login,
        onSuccess: (result: any) => {
            setAuth(result.user, result.accessToken);
            router.push("/home");
        },
        onError: (err: any) => {

            if (err.details?.fieldErrors) {
                console.log("Validation errors:", err.details.fieldErrors);
                setFormErrors(err.details.fieldErrors);
                console.log(err.details.fieldErrors);
            } else {
                // toast.error("An error occurred while updating the profile.");
                console.error(err);
            }
        },
    });

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
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <Card>
                    <CardHeader>
                        <CardTitle>Sign in</CardTitle>
                        <CardDescription>
                            Enter your information below to sign in to your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                            Don't have an account? <a href="#">Sign up</a>
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
