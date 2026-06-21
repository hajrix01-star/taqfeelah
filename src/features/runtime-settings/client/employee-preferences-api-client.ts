import { fetchApiJson } from "@/core/client/api-fetch";
import type { EmployeePreferencesPayload } from "@/features/runtime-settings/client/runtime-settings-client-types";

export async function fetchEmployeePreferencesViaApi(): Promise<EmployeePreferencesPayload> {
  return fetchApiJson("/api/v1/me/preferences", {
    errorMessage: "Failed to load employee preferences.",
  }) as Promise<EmployeePreferencesPayload>;
}

export async function saveEmployeePreferencesViaApi({
  preferences,
}: {
  preferences: Record<string, unknown>;
}): Promise<EmployeePreferencesPayload> {
  return fetchApiJson("/api/v1/me/preferences", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: { preferences },
    errorMessage: "Failed to save employee preferences.",
  }) as Promise<EmployeePreferencesPayload>;
}
