


import { get } from 'http';
import { apiService } from './api.interact';

const profileApiPrefix = '/profile';

export const settingApi  = {
    updateAccount : async (payload: any) => {
        return apiService.patchCall(`${profileApiPrefix}/account`, payload);
    },
    updateProfile : async (payload: any) => {
        return apiService.patchCall(`${profileApiPrefix}/profile`, payload);
    },
    updatePassword : async (payload: any) => {
        return apiService.patchCall(`${profileApiPrefix}/password`, payload);
    },
    updateAvatar : async (payload: any) => {
        return apiService.patchCall(`${profileApiPrefix}/avatar`, payload);
    },
    updateTags : async (tagIds: number[]) => {
        return apiService.patchCall(`${profileApiPrefix}/tags`, { tagIds });
    },
    getTagsAggregated : async () => {
        return apiService.getCall(`${profileApiPrefix}/tags`);
    }
}