const ORG = "8f63cf87-f2e2-4e2a-a20e-e8f637f0a9e1";
const OWNER = "e8f3e35b-6051-4da3-8b10-979700c2f00f";

async function login() {
  const res = await fetch("http://localhost:3000/api/v1/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "owner_password", username: "hajri", password: "123" }),
  });
  const body = await res.json();
  const cookie = res.headers.get("set-cookie");
  console.log("login status:", res.status, body);
  return cookie;
}

async function fetchWithAuth(path, cookie) {
  const res = await fetch(`http://localhost:3000${path}`, {
    headers: {
      cookie: cookie || "",
      "x-organization-id": ORG,
      "x-user-id": OWNER,
      "x-member-role": "owner",
    },
  });
  const text = await res.text();
  console.log("\n===", path, res.status, "===");
  console.log(text.slice(0, 1500));
}

const cookie = await login();
await fetchWithAuth("/api/v1/stores?status=all", cookie);
await fetchWithAuth("/api/v1/members?status=all", cookie);
await fetchWithAuth("/api/v1/auth/employee-roster", cookie);
