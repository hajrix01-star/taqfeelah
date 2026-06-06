import type { MemberRole } from "@/core/auth/roles";

type ResolveCloseoutAutoReviewInput = {
  actorRole: MemberRole;
  closeoutReviewEnabled: boolean;
  autoReview?: boolean;
};

export function resolveCloseoutAutoReview(input: ResolveCloseoutAutoReviewInput): boolean {
  if (input.actorRole === "employee") {
    return !input.closeoutReviewEnabled;
  }
  return input.autoReview === true;
}
