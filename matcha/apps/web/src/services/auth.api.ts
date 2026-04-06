import { apiService } from './api.interact';

export const authService  = {

    register: async (payload: any) => {
        return apiService.postCall("/auth/register", payload);
    }
    ,
    login : async (payload: any) => {
        return apiService.postCall("/auth/login", payload);
    },

    logout: async () => {
        return apiService.postCall("/auth/logout", {});
    }

}