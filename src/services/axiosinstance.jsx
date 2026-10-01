import axios from "axios";
import { getClientId } from "../utils/clientId";

export const axiosInstance = axios.create({
    baseURL : import.meta.env.VITE_API_URL
});

axiosInstance.interceptors.request.use((config) => {
    config.headers["x-client-id"] = getClientId();
    return config;
})