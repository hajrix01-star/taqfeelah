type AdminErrorAlertProps = {
  message: string;
  cause?: string;
  code?: string;
};

export function AdminErrorAlert({ message, cause, code }: AdminErrorAlertProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900">
      <p className="font-semibold">{message}</p>
      {cause ? <p className="mt-1 text-xs leading-5 text-red-800/90">{cause}</p> : null}
      {code ? (
        <p className="mt-1 font-mono text-[11px] text-red-700/80" dir="ltr">
          {code}
        </p>
      ) : null}
    </div>
  );
}
