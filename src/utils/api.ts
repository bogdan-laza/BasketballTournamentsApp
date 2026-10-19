import axios from "axios"

const api=axios.create({
    baseURL:'http://localhost:5265/api',
    headers:{
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config)=>{
        const token=localStorage.getItem("token");
        if(token){
            config.headers['Authorization']=`Bearer ${token}`;
        }
        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        const isAuthEndpoint = originalRequest?.url?.includes('login') || 
                               originalRequest?.url?.includes('Auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");

                if (!refreshToken) {
                    return Promise.reject(error);
                }

                const refreshResponse = await axios.post('http://localhost:5265/api/Auth/refresh', {
                    refreshToken: refreshToken
                });

                const newAccessToken = refreshResponse.data.accessToken;
                const newRefreshToken = refreshResponse.data.refreshToken;

                localStorage.setItem("token", newAccessToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error("Session expired. Please log in again.");
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");

                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


export default api;