import { ilike, or, sql, type SQL } from "drizzle-orm";
import {
  accountSetupTokens,
  authIdentities,
  organizationMembers,
  organizations,
  signupRequests,
} from "@/core/db/schema";

export type SaasAccountsSearchTerm = {
  trimmed: string;
  likePattern: string;
  loweredPattern: string;
  digitsOnly: string;
  isAllDigits: boolean;
};

export function parseSaasAccountsSearchTerm(search: string | undefined): SaasAccountsSearchTerm | null {
  const trimmed = search?.trim();
  if (!trimmed) return null;

  return {
    trimmed,
    likePattern: `%${trimmed}%`,
    loweredPattern: `%${trimmed.toLowerCase()}%`,
    digitsOnly: trimmed.replace(/\D/g, ""),
    isAllDigits: /^\d+$/.test(trimmed),
  };
}

export function buildSaasAccountsSearchFilter(search: string | undefined): SQL | undefined {
  const parsed = parseSaasAccountsSearchTerm(search);
  if (!parsed) return undefined;

  const conditions: SQL[] = [
    ilike(organizations.name, parsed.likePattern),
  ];

  if (parsed.isAllDigits) {
    conditions.push(sql`cast(${organizations.accountNumber} as text) like ${parsed.likePattern}`);
  }

  if (parsed.digitsOnly.length >= 3) {
    const digitPattern = `%${parsed.digitsOnly}%`;
    conditions.push(sql`exists (
      select 1
      from ${organizationMembers} om
      inner join ${authIdentities} ai
        on ai.user_id = om.user_id
        and ai.provider = 'username_password'
      where om.organization_id = ${organizations.id}
        and om.role = 'owner'
        and (
          ai.login_phone ilike ${parsed.likePattern}
          or ai.phone_number ilike ${parsed.likePattern}
          or regexp_replace(coalesce(ai.login_phone, ''), '\\D', '', 'g') like ${digitPattern}
          or regexp_replace(coalesce(ai.phone_number, ''), '\\D', '', 'g') like ${digitPattern}
        )
    )`);
  }

  if (parsed.trimmed.includes("@") || !parsed.isAllDigits) {
    conditions.push(sql`exists (
      select 1
      from ${organizationMembers} om
      inner join ${authIdentities} ai
        on ai.user_id = om.user_id
        and ai.provider = 'username_password'
      where om.organization_id = ${organizations.id}
        and om.role = 'owner'
        and lower(coalesce(ai.username, '')) like ${parsed.loweredPattern}
    )`);
    conditions.push(sql`exists (
      select 1
      from ${accountSetupTokens} ast
      where ast.organization_id = ${organizations.id}
        and ast.owner_email is not null
        and lower(ast.owner_email) like ${parsed.loweredPattern}
    )`);
    conditions.push(sql`exists (
      select 1
      from ${signupRequests} sr
      where sr.organization_id = ${organizations.id}
        and lower(sr.email) like ${parsed.loweredPattern}
    )`);
  }

  return or(...conditions);
}
