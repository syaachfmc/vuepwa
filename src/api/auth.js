const API_URL =
  "https://script.google.com/macros/s/AKfycbwvyT0YNOAQLVydiESiBCq-j-kWqQ-95eSnzPI69kkdl8WiOS9fnT-cHbmriUIOgIws/exec";

/**
 * Helper function untuk mengirim request POST ke Google Apps Script Web App.
 */
async function request(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8"
    },
    body: JSON.stringify({
      action,
      ...payload
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}

/**
 * Melakukan login dengan username, password, dan projectCode.
 */
export function login(username, password, projectCode) {
  return request("login", { username, password, projectCode });
}

/**
 * Memvalidasi token sesi pengguna.
 */
export function validateSession(token) {
  return request("validateSession", { token });
}

/**
 * Menghapus sesi login (logout).
 */
export function logout(token) {
  return request("logout", { token });
}

/**
 * Mengambil data profil user dari sesi aktif.
 */
export function getMe(token) {
  return request("me", { token });
}

/**
 * Mengambil daftar publik Project Code & Project Name dari sheet ProjectList.
 */
export function getProjectList() {
  return request("getProjectList");
}