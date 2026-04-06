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
import { Eye, EyeOff} from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { authService } from "@/services/auth.api"
import { formatZodError } from "@/lib/formatError"
import Link from "next/link"



export const registerSchema = z.object({
    email: z.email({ message: "Please enter a valid email address." }).max(255),
    firstName: z.string().min(1, { message: "First name cannot be empty." }).max(100),
    lastName: z.string().min(1, { message: "Last name cannot be empty." }).max(100),
    username: z.string().min(3, { message: "Username must be at least 3 characters." }).max(50),
    password: z.string().min(8, { message: "Password must be at least 8 characters." })
        .regex(/[A-Za-z]/, "Password must contain at least one letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(
            /[^A-Za-z0-9]/,
            "Password must contain at least one special character",
        ),
    confirmPassword: z.string().min(8, { message: "Confirm password must be at least 8 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});


export type RegisterInput = z.infer<typeof registerSchema>
export default function SignupForm({handlePageChange} : {handlePageChange: (page: 'login' | 'register') => void}) {


    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);



    const { mutate, isPending } = useMutation({
        mutationFn: authService.register,
        onSuccess: (result: any) => {
            // toast.success("Profile updated!");
            handlePageChange("login");
        },
        onError: (err: any) => {

            if (err.details?.fieldErrors) {
                console.log("Validation errors:", err.details.fieldErrors);
                setFormErrors(err.details.fieldErrors);
                console.log(err.details.fieldErrors);
            } else {
                // toast.error("An error occurred while updating the profile.");
                setFormErrors({ message: err.message || "An error occurred during registration." });
            }
        },
    });








    const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setFormErrors({});

        const formElement = event.currentTarget;
        const formData = new FormData(formElement);

        const inputData = {
            email: formData.get("email") as string,
            firstName: formData.get("firstName") as string,
            lastName: formData.get("lastName") as string,
            username: formData.get("username") as string,
            password: formData.get("password") as string,
            confirmPassword: formData.get("confirmPassword") as string,
        };

        const validationResult = registerSchema.safeParse(inputData);

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
                        <CardTitle>Create an account</CardTitle>
                        <CardDescription>
                            Enter your information below to create your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {
                            formErrors.message && (
                            <p className="text-red-500 text-center ">{formErrors.message}</p>
                            )
                        }
                        <form onSubmit={handleRegister}>
                            <FieldGroup className="gap-2">
                                <Field>
                                    <FieldLabel htmlFor="username">UserName</FieldLabel>
                                    <Input id="username" type="text" placeholder="username" name="username" required />
                                    {formErrors.username && (
                                        <span className="text-xs text-red-500">
                                            {formErrors.username}
                                        </span>
                                    )}

                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="first-name">First Name</FieldLabel>
                                    <Input id="first-name" type="text" placeholder="first name" name="firstName" required />
                                    {formErrors.firstName && (
                                        <span className="text-xs text-red-500">
                                            {formErrors.firstName}
                                        </span>
                                    )}
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="last-name">Last Name</FieldLabel>
                                    <Input id="last-name" type="text" placeholder="last name" name="lastName" required />
                                    {formErrors.lastName && (
                                        <span className="text-xs text-red-500">
                                            {formErrors.lastName}
                                        </span>
                                    )}
                                </Field>
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
                                <Field>
                                    <FieldLabel htmlFor="confirm-password">
                                        Confirm Password
                                    </FieldLabel>
                                    <div className="relative">
                                        <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required className="pr-10" />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword((v) => !v)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {formErrors.confirmPassword && (
                                        <span className="text-xs text-red-500">
                                            {formErrors.confirmPassword}
                                        </span>
                                    )}
                                    <FieldDescription>Please confirm your password.</FieldDescription>
                                </Field>
                                <FieldGroup>
                                    <Field>
                                        {isPending ? (
                                            <Button type="submit" disabled>
                                                Creating Account...
                                            </Button>
                                        ) : (
                                            <Button type="submit">Create Account</Button>
                                        )}
                                        <Button variant="outline" type="button">
                                            Sign up with Google
                                        </Button>
                                        <FieldDescription className="px-6 text-center">
                                            Already have an account?   <button
                                            type="button"
                                            onClick={() => handlePageChange("login")}
                                            className=" hover:underline font-medium"
                                        >
                                            Sign in
                                        </button>

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
