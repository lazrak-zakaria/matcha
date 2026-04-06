import { apiService } from './api.interact';

const profileApiPrefix = '/profile';

export const profileApi  = {
    getProfileById: async (userId: string | number) => {
        return apiService.getCall(`${profileApiPrefix}/${userId}`);
    },

    getTags: async (userId: string) => {
        return apiService.getCall(`${profileApiPrefix}/${userId}/tags`);
    },
    getImages: async (userId: string) => {
        return apiService.getCall(`${profileApiPrefix}/${userId}/images`);
    },
    getQuestions: async (userId: string | number) => {
        return apiService.getCall(`${profileApiPrefix}/${userId}/questions`);
    },
    updateImages: async (userId: string, payload: any) => {
        return apiService.patchCall(`${profileApiPrefix}/${userId}/images`, payload);
    },
    updatePreferences: async (payload: any) => {
        return apiService.patchCall(`${profileApiPrefix}/preferences`, payload);
    },
    updateLocation: async (payload: { latitude: number; longitude: number; city?: string }) => {
        return apiService.patchCall(`${profileApiPrefix}/location`, payload);
    },
    getPreferenceTagsAggregated: async () => {
        return apiService.getCall(`${profileApiPrefix}/preferences/tags`);
    },
    getSearchPreferences: async () => {
        return apiService.getCall(`${profileApiPrefix}/preferences`);
    },
    getLastLikes: async () => {
        return apiService.getCall(`${profileApiPrefix}/likes`);
    },
    getLastViews: async () => {
        return apiService.getCall(`${profileApiPrefix}/views`);
    },
    getLastMatches: async () => {
        return apiService.getCall(`${profileApiPrefix}/matches`);
    }

}