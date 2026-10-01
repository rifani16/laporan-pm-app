const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const fetchAllData = async () => {
  const res = await fetch(`${API_BASE}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Gagal fetch data");
  return json.data;
};

export const editMaster = async (idPm, updatedFields) => {
  const payload = {
    action: "EDIT_MASTER",
    data: { "ID PM": idPm, ...updatedFields },
  };
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
};

export const deleteMaster = async (idPm) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "HAPUS_MASTER", data: { "ID PM": idPm } }),
  });
  return await res.json();
};

export const addMaster = async (payload) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "TAMBAH_MASTER", data: payload }),
  });
  return await res.json();
};

export const addSalur = async (payload) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "TAMBAH_SALUR", data: payload }),
  });
  return await res.json();
};

export const editSalur = async (payload) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "EDIT_SALUR", data: payload }),
  });
  return await res.json();
};

export const deleteSalur = async (idSalur) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "HAPUS_PM_PROGRAM", data: { "ID SALUR": idSalur } }),
  });
  return await res.json();
};

export const addProgram = async (name) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "TAMBAH_PROGRAM", data: { name } }),
  });
  return await res.json();
};

export const editProgram = async (oldName, newName) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "EDIT_PROGRAM", data: { oldName, newName } }),
  });
  return await res.json();
};

export const deleteProgram = async (name) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "HAPUS_PROGRAM", data: { name } }),
  });
  return await res.json();
};

export const loginUser = async (username, password) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "LOGIN",
      data: { username, password }
    }),
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || json.message || "Login gagal");
  }
  return json.user || (json.data && json.data.user);
};

export const changePassword = async (username, oldPassword, newPassword) => {
  const res = await fetch(`${API_BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "CHANGE_PASSWORD",
      data: { username, oldPassword, newPassword }
    }),
  });
  return await res.json();
};
