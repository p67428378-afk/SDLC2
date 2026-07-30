import api from "./api";

export const paymentService = {
  getPaymentSources: async (mortgageAccountId) => {
    const response = await api.get(
      `/api/v1/payments/sources/${mortgageAccountId}`,
    );
    return response.data;
  },

  executePayment: async (paymentData, idempotencyKey) => {
    const response = await api.post("/api/v1/payments/mortgage", paymentData, {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });
    return response.data;
  },

  getPaymentHistory: async () => {
    const response = await api.get("/api/v1/payments");
    return response.data;
  },

  getScheduledPayments: async () => {
    const response = await api.get("/api/v1/payments/scheduled");
    return response.data;
  },

  schedulePayment: async (scheduledData) => {
    const response = await api.post(
      "/api/v1/payments/scheduled",
      scheduledData,
    );
    return response.data;
  },

  cancelScheduledPayment: async (paymentId) => {
    const response = await api.delete(
      `/api/v1/payments/scheduled/${paymentId}`,
    );
    return response.data;
  },
};

export default paymentService;
