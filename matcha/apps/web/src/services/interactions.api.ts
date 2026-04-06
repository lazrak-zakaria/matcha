



import { apiService } from './api.interact';

export interface RelationshipStatus {
    iLike: boolean
    likesMe: boolean
    isMatched: boolean
    iBlocked: boolean
    blockedMe: boolean
    conversationId: number | null
}

export const interactionService  = {
    getRelationshipStatus: async (userId: number): Promise<RelationshipStatus> => {
        return apiService.getCall(`/interactions/status/${userId}`)
    },

    viewUser: async (userId: number) => {
        return apiService.postCall(`/interactions/view/${userId}`, {});
    },

    skipUser: async (userId: number) => {
        return apiService.postCall(`/interactions/skip/${userId}`, {});
    },
    likeUser: async (userId: number) => {
        console.log("Liking user with ID:", userId);
        return apiService.postCall(`/interactions/like/${userId}`, {});
    },
    unlikeUser: async (userId: number) => {
        return apiService.postCall(`/interactions/unlike/${userId}`, {});
    },
    removeLike: async (userId: number) => {
        return apiService.postCall(`/interactions/remove-like/${userId}`, {});
    },
    blockUser: async (userId: number) => {
        return apiService.postCall(`/interactions/block/${userId}`, {});
    },
    unblockUser: async (userId: number) => {
        return apiService.postCall(`/interactions/unblock/${userId}`, {});
    },
    reportUser: async (userId: number, reason?: string) => {
        return apiService.postCall(`/interactions/report/${userId}`, { reason });
    }


}