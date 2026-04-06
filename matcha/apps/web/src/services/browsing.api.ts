


import { apiService } from './api.interact';

export const browsingService  = {

    getProfiles: async (params: any) => {
        return apiService.getCall("/users", params);
    }
    ,

    searchUsersByName: async (name: string, sortBy: 'fame' | 'age' | 'location' = 'fame') => {
        return apiService.getCall(`/users/search?name=${encodeURIComponent(name)}&sortBy=${sortBy}`);
    }


}