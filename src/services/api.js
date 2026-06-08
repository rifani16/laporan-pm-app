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