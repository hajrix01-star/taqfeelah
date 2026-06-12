export function formatInviteStatus(status, lang) {
  const labels = {
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

export function getOwnerTeamInvitesLabels(lang) {
  if (lang === "ar") {
    return {
      title: "دعوات الموظفين",
      hint: "كل موظف له دعوة مستقلة — جوال إلزامي وPIN تُرسله أنت عبر واتساب.",
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
    };
  }

  return {
    title: "Employee invitations",
    hint: "Each employee gets a private invite — mobile is required and you send the PIN via WhatsApp.",
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
  };
}
