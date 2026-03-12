
export interface ValidationErrorResponse {
  message: string;
  details: {
    formErrors: string[];
    fieldErrors: Record<string, string>;
  };
}
