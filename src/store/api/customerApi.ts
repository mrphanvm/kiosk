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
    checkin: builder.mutation<any, any>({
      query: (formData) => ({
        url: "/api/v1/integration/customers/kiot-registration",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response: any) => response,
    }),
  }),
});

export const { useFaceVerifyMutation, useCheckinMutation } = customerApi;
