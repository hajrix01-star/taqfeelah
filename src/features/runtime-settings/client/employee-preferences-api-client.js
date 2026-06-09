import { fetchApiJson } from "@/core/client/api-fetch";

export async function fetchEmployeePreferencesViaApi() {
  return fetchApiJson("/api/v1/me/preferences", {
    errorMessage: "Failed to load employee preferences.",
  });
}

export async function saveEmployeePreferencesViaApi({ preferences }) {
  return fetchApiJson("/api/v1/me/preferences", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: { preferences },
    errorMessage: "Failed to save employee preferences.",
  });
}
