import { axiosInstance } from "../axiosinstance";

export const SendMessage = async (data, signal) =>
  (await axiosInstance.post("/", data, { signal })).data;

export const Getconversation = async () =>
  (await axiosInstance.get("/")).data;

export const GetconversationId = async (id) =>
  (await axiosInstance.get(`/${id}`)).data;

export const DeleteConversation = async (id) =>
  (await axiosInstance.delete(`/${id}`)).data;