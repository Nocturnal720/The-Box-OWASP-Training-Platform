const BASE_URL = "http://localhost:5000";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: localStorage.getItem("token"),
});

export const loginUser = async (username, password) => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  // 🔥 STORE TOKEN HERE
  if (data.success) {
    localStorage.setItem("token", data.token);
  }

  return data;
};

export const getBalance = async (userId) => {
  const res = await fetch(`${BASE_URL}/balance/${userId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getTransactions = async (userId) => {
  const res = await fetch(`${BASE_URL}/transactions/${userId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const addTransaction = async (data) => {
  await fetch(`${BASE_URL}/transaction`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const transferMoney = async (data) => {
  await fetch(`${BASE_URL}/transfer`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
};

export const getAccountDetails = async (userId) => {
  const res = await fetch(`${BASE_URL}/account/${userId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};

export const getActivity = async (userId) => {
  const res = await fetch(`${BASE_URL}/activity/${userId}`, {
    headers: getAuthHeaders(),
  });
  return res.json();
};