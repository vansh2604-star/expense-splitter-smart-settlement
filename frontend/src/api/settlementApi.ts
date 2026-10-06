import api from "./axios";

export const getGroupSettlements = async (groupId: string) => {
  const response = await api.get(`/groups/${groupId}/settlements`);
  return response.data;
};

export const recordSettlementPayment = async (
  groupId: string,
  toUserId: string,
  amount: number
) => {
  const response = await api.post(`/groups/${groupId}/settlements/pay`, {
    toUserId,
    amount,
  });
  return response.data;
};

export const getSettlementHistory = async (groupId: string) => {
  const response = await api.get(`/groups/${groupId}/settlements/history`);
  return response.data;
};
