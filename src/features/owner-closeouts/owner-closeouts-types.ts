import type { DisplayLang } from "@/core/i18n/display-locale";

export type OwnerCloseoutOutflowRow = {
  id?: string;
  typeLabel?: string;
  type?: string;
  category?: string;
  amount?: number;
  attachments?: unknown[];
};

export type OwnerCloseoutManageRecord = {
  id?: string;
  storeId?: string;
  storeName?: string;
  date?: string;
  status?: string;
  submittedByName?: string;
  submittedAt?: string;
  sales?: Record<string, number>;
  outflows?: OwnerCloseoutOutflowRow[];
  attachments?: unknown[];
  totals?: {
    totalSales?: number;
    totalOutflow?: number;
    netMovement?: number;
  };
};

export type OwnerCloseoutManagePanelProps = {
  lang: DisplayLang;
  closeout: OwnerCloseoutManageRecord | null;
  formatCalendarDate: (value: string, lang: DisplayLang) => string;
  formatDateTime: (value: string, lang: DisplayLang) => string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  attachmentsApiEnabled?: boolean;
  attachmentsApiOrganizationId?: string;
  attachmentsApiActorUserId?: string;
  attachmentsApiActorRole?: string;
};
