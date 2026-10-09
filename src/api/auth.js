
const API_URL =
  "https://script.google.com/macros/s/AKfycbyS6-aRGXlE9Zq40GFVljrlSlWv6SNQ0oYjBD2t8J5WOMoBIIGW9KzLy5ncVDffkFn5Yw/exec";

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