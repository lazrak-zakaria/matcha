import { apiService } from './api.interact';

const profileApiPrefix = '/profile';

export const profileApi  = {

    getTags: async (userId: string) => {
        return apiService.getCall(`${profileApiPrefix}/${userId}/tags`);
    },
    getImages: async (userId: string) => {
        return apiService.getCall(`${profileApiPrefix}/${userId}/images`);
    },
    updateImages: async (userId: string, payload: any) => {
        return apiService.patchCall(`${profileApiPrefix}/${userId}/images`, payload);
    },
    updatePreferences: async (payload: any) => {
        return apiService.patchCall(`${profileApiPrefix}/preferences`, payload);
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