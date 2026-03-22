import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    headers: {
        "Content-Type": "application/json"
    }
});


api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
                return Promise.reject(error);
            }

            try {
                const res = await axios.post(
                    "http://localhost:3000/api/auth/refresh",
                    { refreshToken }
                );

                const { accessToken, refreshToken: newRefresh } = res.data;

                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", newRefresh);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return api(originalRequest);
            } catch (e) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
            }
        }

        return Promise.reject(error);
    }
);

export default api;