import api from "./axios";

export interface CreateExpenseData {
  description: string;
  amount: number;
  participantIds: string[];
}

export const createExpense = async (groupId: string, data: CreateExpenseData) => {
  const response = await api.post(`/groups/${groupId}/expenses`, data);
  return response.data;
};
