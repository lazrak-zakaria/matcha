



import { skip } from 'node:test';
import { apiService } from './api.interact';

export const interactionService  = {

    skipUser: async (userId: number) => {
        return apiService.postCall(`/interactions/skip/${userId}`, {});
    },
    likeUser: async (userId: number) => {
        console.log("Liking user with ID:", userId);
        return apiService.postCall(`/interactions/like/${userId}`, {});
    },
    reportUser: async (userId: number) => {
        return apiService.postCall(`/interactions/report/${userId}`, {});
    }


}