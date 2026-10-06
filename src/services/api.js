const API_BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "pm_auth_token";

export const SESSION_EXPIRED_EVENT = "pm-session-expired";

export const getSessionToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

// Cache data dibuat per sesi; hapus agar data user/daerah lain tidak terbawa.
export const DATA_CACHE_KEY = "app-data";

export const setSessionToken = (token) => {
  try {
    localStorage.removeItem(DATA_CACHE_KEY);
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage tidak tersedia
  }
};

const request = async (body) => {
  const init = {
    method: body ? "POST" : "GET",
    headers: { "X-Session-Token": getSessionToken() },
  };
  if (body) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}`, init);
  const json = await res.json();
  if (json.code === 401 && body?.action !== "LOGIN") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  return json;
};

const post = (action, data) => request({ action, data });

export const fetchAllData = async () => {
  const json = await request();
  if (!json.success) throw new Error(json.error || "Gagal fetch data");
  return json.data;
};

export const editMaster = (idPm, updatedFields) =>
  post("EDIT_MASTER", { "ID PM": idPm, ...updatedFields });

export const deleteMaster = (idPm) => post("HAPUS_MASTER", { "ID PM": idPm });

export const addMaster = (payload) => post("TAMBAH_MASTER", payload);

export const addSalur = (payload) => post("TAMBAH_SALUR", payload);

export const editSalur = (payload) => post("EDIT_SALUR", payload);

export const deleteSalur = (idSalur) =>
  post("HAPUS_PM_PROGRAM", { "ID SALUR": idSalur });

export const addProgram = (name) => post("TAMBAH_PROGRAM", { name });

export const editProgram = (oldName, newName) =>
  post("EDIT_PROGRAM", { oldName, newName });

export const deleteProgram = (name) => post("HAPUS_PROGRAM", { name });

export const loginUser = async (username, password) => {
  const json = await post("LOGIN", { username, password });
  if (!json.success) {
    throw new Error(json.error || json.message || "Login gagal");
  }
  const user = json.user || (json.data && json.data.user);
  const token = json.token || (json.data && json.data.token);
  setSessionToken(token);
  return user;
};

export const logoutUser = async () => {
  try {
    await post("LOGOUT", {});
  } catch {
    // abaikan; sesi lokal tetap dihapus
  } finally {
    setSessionToken("");
  }
};
