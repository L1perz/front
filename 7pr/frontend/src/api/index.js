import axios from "axios";

/* Настройка подключения к backend */
const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: {
        "Content-Type": "application/json"
    }
});

/* Автоматически добавляем JWT в каждый запрос */
apiClient.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;

});

/* Функции для работы с товарами */
export const api = {

    // Получить все товары
    getProducts: async () => {
        const res = await apiClient.get("/products");
        return res.data;
    },

    // Добавить товар
    createProduct: async (data) => {
        const res = await apiClient.post("/products", data);
        return res.data;
    },

    // Обновить товар
    updateProduct: async (id, data) => {
        const res = await apiClient.patch(`/products/${id}`, data);
        return res.data;
    },

    // Удалить товар
    deleteProduct: async (id) => {
        await apiClient.delete(`/products/${id}`);
    },
    getCurrentUser: async () => {

        const res = await apiClient.get("/auth/me");

        return res.data;

    }
};