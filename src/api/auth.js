
const API_URL =
  "https://script.google.com/macros/s/AKfycbxdkulTl8TBSrU1bQ0aD4ex29Th7yh-pt33j-hkCrfQKuEio1SedZWWizDkMgmmFF4H/exec";
  // Gsheet: // https://docs.google.com/spreadsheets/d/1hcpqlhlVR5oEV_ASxPH4E1olaT6UplG8DlMSgp2iqsE/edit?gid=0#gid=0

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