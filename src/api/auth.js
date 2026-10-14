
const API_URL =
  "https://script.google.com/macros/s/AKfycbwvyT0YNOAQLVydiESiBCq-j-kWqQ-95eSnzPI69kkdl8WiOS9fnT-cHbmriUIOgIws/exec";
  // Gsheet User:  https://docs.google.com/spreadsheets/d/1hcpqlhlVR5oEV_ASxPH4E1olaT6UplG8DlMSgp2iqsE/edit?gid=0#gid=0
  // Script :  https://script.google.com/home/projects/1nSdwzRWRBN9M5J1i8S6cx-mJAGPHUBNqoY4sYh2QFIY8EJ0rZoTAT0uG/edit


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

export function login(username, password) {
  return request("login", { username, password });
}

export function validateSession(token) {
  return request("validateSession", { token });
}

export function logout(token) {
  return request("logout", { token });
}

export function getMe(token) {
  return request("me", { token });
}