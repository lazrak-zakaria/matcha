


import { apiService } from './api.interact';

export const browsingService  = {

    getProfiles: async (params: any) => {
        return apiService.getCall("/users", params);
    }
    ,


}