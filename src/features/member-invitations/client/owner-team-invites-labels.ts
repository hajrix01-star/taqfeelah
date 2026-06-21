import type {
  FormatInviteStatusLang,
  OwnerTeamInvitesLabels,
  StaffInviteActivationLabels,
  TeamInvitation,
} from "@/features/member-invitations/client/member-invitations-client-types";

export function formatInviteStatus(status: string, lang: FormatInviteStatusLang) {
  const labels: Record<FormatInviteStatusLang, Record<string, string>> = {
    ar: {
      pending: "قيد الانتظار",
      used: "مستخدمة",
      expired: "منتهية",
      revoked: "ملغاة",
      locked: "مقفلة",
    },
    en: {
      pending: "Pending",
      used: "Used",
      expired: "Expired",
      revoked: "Revoked",
      locked: "Locked",
    },
  };
  return labels[lang]?.[status] || status;
}

export function getOwnerTeamInvitesLabels(lang: FormatInviteStatusLang): OwnerTeamInvitesLabels {
  if (lang === "ar") {
    return {
      createTitle: "دعوة موظف جديد",
      title: "دعوات الموظفين",
      hint: "كل موظف له دعوة مستقلة — جوال إلزامي وPIN تُرسله أنت عبر واتساب.",
      pendingTitle: "بانتظار التفعيل",
      pendingHint: "دعوات لم يُفعّلها الموظف بعد.",
      activatedViaInvite: "مفعّل عبر دعوة",
      name: "اسم الموظف (للعرض فقط)",
      phone: "جوال الموظف",
      pin: "PIN للتفعيل (مرة واحدة)",
      store: "المحل",
      roleEmployee: "موظف إدخال",
      roleManager: "مدير محل",
      create: "إنشاء دعوة",
      creating: "جاري الإنشاء…",
      inviteUrl: "رابط الدعوة",
      pinLabel: "PIN",
      copyLink: "نسخ الرابط",
      copyPin: "نسخ PIN",
      shareWhatsApp: "مشاركة عبر واتساب",
      revoke: "إلغاء الدعوة",
      expiresAt: "تنتهي في",
      noInvites: "لا توجد دعوات بعد.",
      copied: "تم النسخ",
      inviteAlias: "دعوة باسم",
      phoneLabel: "الجوال",
    };
  }

  return {
    createTitle: "Invite new employee",
    title: "Employee invitations",
    hint: "Each employee gets a private invite — mobile is required and you send the PIN via WhatsApp.",
    pendingTitle: "Awaiting activation",
    pendingHint: "Invites that have not been activated yet.",
    activatedViaInvite: "Activated via invite",
    name: "Employee display name",
    phone: "Employee mobile",
    pin: "Activation PIN (one-time)",
    store: "Store",
    roleEmployee: "Entry employee",
    roleManager: "Store manager",
    create: "Create invitation",
    creating: "Creating…",
    inviteUrl: "Invite link",
    pinLabel: "PIN",
    copyLink: "Copy link",
    copyPin: "Copy PIN",
    shareWhatsApp: "Share via WhatsApp",
    revoke: "Revoke invitation",
    expiresAt: "Expires at",
    noInvites: "No invitations yet.",
    copied: "Copied",
    inviteAlias: "Invited as",
    phoneLabel: "Mobile",
  };
}

export function formatStaffInviteActivationLine({
  invite,
  labels,
}: {
  invite?: TeamInvitation | null;
  labels: StaffInviteActivationLabels;
}) {
  if (!invite) return "";

  const storeName = typeof invite.storeName === "string" ? invite.storeName.trim() : "";
  const invitationDisplayName = typeof invite.invitationDisplayName === "string"
    ? invite.invitationDisplayName.trim()
    : "";
  const displayName = typeof invite.displayName === "string" ? invite.displayName.trim() : "";
  const alias = invitationDisplayName && invitationDisplayName !== displayName
    ? invitationDisplayName
    : "";

  if (alias) {
    return `${labels.activatedViaInvite} (${alias})${storeName ? ` · ${storeName}` : ""}`;
  }

  return `${labels.activatedViaInvite}${storeName ? ` · ${storeName}` : ""}`;
}
