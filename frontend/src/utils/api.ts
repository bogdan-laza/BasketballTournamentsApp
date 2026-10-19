import axios from "axios";

const api = axios.create({
    baseURL: 'http://localhost:5265/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token && token !== "undefined" && token !== "null") {
            if (config.headers.set) {
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token!);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,

    async (error) => {
        const originalRequest = error.config;

        const isAuthEndpoint =
            originalRequest?.url?.includes('login') ||
            originalRequest?.url?.includes('Auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        if (originalRequest.headers.set) {
                            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
                        } else {
                            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        }
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken || refreshToken === "undefined" || refreshToken === "null") {
                isRefreshing = false;
                return Promise.reject(error);
            }

            try {
                const refreshResponse = await axios.post('http://localhost:5265/api/Auth/refresh', {
                    refreshToken: refreshToken
                });

                const newAccessToken = refreshResponse.data.AccessToken;
                    
                const newRefreshToken = refreshResponse.data.RefreshToken;

                if (!newAccessToken) {
                    throw new Error("No access token returned from refresh response.");
                }

                localStorage.setItem("token", newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem("refreshToken", newRefreshToken);
                }

                if (originalRequest.headers.set) {
                    originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
                } else {
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                }

                processQueue(null, newAccessToken);

                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                console.error("Session expired. Please log in again.");
                
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");

                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;