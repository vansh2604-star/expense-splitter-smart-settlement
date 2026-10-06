import api from "./axios";

export interface CreateGroupData {
  name: string;
  description?: string;
}

export const getMyGroups = async () => {
  const response = await api.get("/groups");

  return response.data;
};

export const createGroup = async (data: CreateGroupData) => {
  const response = await api.post("/groups", data);

  return response.data;
};

export const addGroupMember = async (
  groupId: string,
  email: string
) => {
  const response = await api.post(`/groups/${groupId}/members`, {
    email,
  });

  return response.data;
};

export const getGroupDetails = async (groupId: string) => {
  const response = await api.get(`/groups/${groupId}`);

  return response.data;
};


