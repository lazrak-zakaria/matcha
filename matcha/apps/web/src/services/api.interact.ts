import api from "@/lib/api";
import axios from "axios";


export const apiService = { 
    getCall: async (endpoint: string, params?: any) => {
        try {
            const response = await api.get(endpoint, { params });
            return response.data;
        } catch (error) {
            console.error("API GET call error:", error);
            if (axios.isAxiosError(error)) {
                throw error.response?.data ?? new Error("Failed to get data");
            }
            throw new Error("Unexpected error occurred");
        }
    },
    postCall: async (endpoint: string, payload: any) => {
        try {
            const response = await api.post(endpoint, payload);
            console.log("API POST call response:", response);
            return response.data;
        } catch (error) {
            console.error("API POST call error:", error);
            if (axios.isAxiosError(error)) {
                throw error.response?.data ?? new Error("Failed to post data");
            }
            throw new Error("Unexpected error occurred");
        }
    },
    patchCall: async (endpoint: string, payload: any) => {
        try {
            const response = await api.patch(endpoint, payload);
            console.log("API PATCH call response:", response);
            return response.data;
        } catch (error) {
            console.error("API PATCH call error:", error);
            if (axios.isAxiosError(error)) {
                throw error.response?.data ?? new Error("Failed to patch data");
            }
            throw new Error("Unexpected error occurred");
        }
    }
}