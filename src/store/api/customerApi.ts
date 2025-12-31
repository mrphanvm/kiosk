import { api } from "./base";

export const customerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    faceVerify: builder.mutation<any, any>({
      query: (body) => ({
        url: "/api/v1/face/verify",
        method: "POST",
        body,
      }),
      transformResponse: (response: any) => response,
    }),
  }),
});

export const { useFaceVerifyMutation } = customerApi;
