

export const formatZodError = (validationResult: any) => {
    const errors: Record<string, string> = {};
    validationResult.error.issues.forEach((issue: any) => {
        errors[issue.path[0] as string] = issue.message;
    });
    return errors;
}