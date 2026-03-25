import { apiService } from './api.interact';

export const profileApi  = {

    getProfiles: async (page: any) => {
        return apiService.getCall("/auth/register", {page});
    },
    likeProfile : async (payload: any) => {
        return apiService.postCall("/auth/login", payload);
    },
    skipProfile : async (payload: any) => {
        return apiService.postCall("/auth/login", payload);
    },
    reportProfile : async (payload: any) => {
        return apiService.postCall("/auth/login", payload);
    },


}