import type { ReactNode } from "react";

export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-[#e9e6ef] bg-white p-5 md:p-7"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-[#777283]">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <p>{message}</p>
      <button type="button" onClick={retry} className="mt-2 font-semibold underline">
        Retry
      </button>
    </div>
  );
}

export function SaveActions({
  pending,
  dirty,
  discard,
  label = "Save changes",
}: {
  pending: boolean;
  dirty: boolean;
  discard: () => void;
  label?: string;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#efedf3] pt-5">
      <button
        type="button"
        className="giving-small-button"
        disabled={pending || !dirty}
        onClick={discard}
      >
        Discard changes
      </button>
      <button
        type="submit"
        disabled={pending || !dirty}
        className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {pending ? "Saving..." : label}
      </button>
    </div>
  );
}
