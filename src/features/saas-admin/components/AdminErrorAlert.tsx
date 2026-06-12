import { AdminCallout } from "@/features/saas-admin/components/AdminCallout";

type AdminErrorAlertProps = {
  message: string;
  cause?: string;
  code?: string;
};

export function AdminErrorAlert({ message, cause, code }: AdminErrorAlertProps) {
  return (
    <AdminCallout tone="danger">
      <p className="font-semibold">{message}</p>
      {cause ? <p className="mt-1 text-xs leading-5 opacity-90">{cause}</p> : null}
      {code ? (
        <p className="mt-1 font-mono text-[11px] opacity-80" dir="ltr">
          {code}
        </p>
      ) : null}
    </AdminCallout>
  );
}
