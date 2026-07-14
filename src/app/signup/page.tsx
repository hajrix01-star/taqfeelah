import type { Metadata } from "next";
import { NO_INDEX_ROBOTS } from "@/core/config/seo";
import OwnerSignupPage from "@/features/signup/client/OwnerSignupPage";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  robots: NO_INDEX_ROBOTS,
};

export default function SignupRoutePage() {
  return <OwnerSignupPage />;
}
