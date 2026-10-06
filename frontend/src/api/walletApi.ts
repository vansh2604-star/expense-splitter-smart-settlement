import api from "./axios";

export const getWalletTransactions = async () => {
  const response = await api.get("/wallet/transactions");
  return response.data;
};

export const topupWallet = async (amount: number) => {
  const response = await api.post("/wallet/topup", { amount });
  return response.data;
};
