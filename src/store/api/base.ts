import { Mutex } from "async-mutex";
import {
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import qs from "qs";
import { toast } from "react-toastify";

const mutex = new Mutex();

export const baseQuery = fetchBaseQuery({
  timeout: 80500,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token") || null;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  },
  baseUrl: import.meta.env.VITE_API_BASE_URL || "",
  paramsSerializer: (params) => qs.stringify(params),
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();
  const result = (await baseQuery(args, api, extraOptions)) as any;
  if (result.error && result.error?.status === 401) {
    localStorage.clear();
    window.location.replace("/signin");
  }
  if (result.error && result.error?.status === 400) {
    toast.error(result.error?.data?.error?.message || "Có lỗi xảy ra");
  }

  if (
    (result?.meta?.request.method === "POST" ||
      result?.meta?.request.method === "DELETE") &&
    (result?.meta?.response?.status === 201 ||
      result?.meta?.response?.status === 200)
  ) {
    toast.success("Thao tác thành công");
  }
  return result;
};

export const api = createApi({
  baseQuery: baseQueryWithReauth,
  refetchOnMountOrArgChange: true,
  reducerPath: "api",
  tagTypes: ["all", "Gate", "Device"],
  endpoints: () => ({}),
});
