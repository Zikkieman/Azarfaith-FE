import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import * as Legacy from "@/components/ui/dialog";
import * as Source from "@/components/app/DesignDialog";
import { inputClass, labelClass } from "@/components/app/AppShell";
import { btn } from "@/components/app/btn";
import { cn } from "@/lib/utils";
export function EmailChange({
  currentEmail,
  appearance,
}: {
  currentEmail: string;
  appearance?: "app";
}) {
  const { Dialog, DialogContent, DialogDescription, DialogTitle } =
    appearance === "app" ? Source : Legacy;
  const app = appearance === "app";
  const [open, setOpen] = useState(false),
    [email, setEmail] = useState(""),
    [oldCode, setOldCode] = useState(""),
    [newCode, setNewCode] = useState("");
  const [challenge, setChallenge] = useState<{
    challengeId: string;
    newEmail: string;
    expiresAt: string;
  } | null>(null);
  const request = useMutation({
    mutationFn: () =>
      apiFetch<{ challengeId: string; newEmail: string; expiresAt: string }>(
        "/auth/email-change/request",
        { method: "POST", body: JSON.stringify({ email: email.trim().toLowerCase() }) },
      ),
    onSuccess: (result) => {
      setChallenge(result);
      setOldCode("");
      setNewCode("");
    },
  });
  const confirm = useMutation({
    mutationFn: () =>
      apiFetch("/auth/email-change/confirm", {
        method: "POST",
        body: JSON.stringify({ challengeId: challenge?.challengeId, oldCode, newCode }),
      }),
    onSuccess: () => window.location.assign("/login"),
  });
  const busy = request.isPending || confirm.isPending;
  return (
    <>
      <button
        type="button"
        className={app ? cn(btn("secondary", "sm"), "self-start") : "giving-small-button mt-4"}
        onClick={() => {
          request.reset();
          confirm.reset();
          setChallenge(null);
          setEmail("");
          setOpen(true);
        }}
      >
        Change sign-in email
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogTitle>Change sign-in email</DialogTitle>
          <DialogDescription>
            Verify both inboxes before changing your email. This signs out every session. Saved card
            authorizations keep their original payment email.
          </DialogDescription>
          {!challenge ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!busy) request.mutate();
              }}
            >
              <p className="text-sm break-all">Current email: {currentEmail}</p>
              <label className={app ? cn(labelClass, "flex flex-col gap-1.5") : "giving-label"}>
                New sign-in email
                <input
                  type="email"
                  required
                  maxLength={160}
                  className={app ? inputClass : "giving-input"}
                  disabled={busy}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              {request.isError && (
                <p role="alert" className="text-sm text-red-700">
                  {request.error.message}
                </p>
              )}
              <button
                className={app ? btn("primary", "sm") : "giving-small-button bg-black text-white"}
                disabled={busy || email.trim().toLowerCase() === currentEmail}
              >
                {request.isPending ? "Sending codes..." : "Send verification codes"}
              </button>
            </form>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!busy && /^\d{6}$/.test(oldCode) && /^\d{6}$/.test(newCode)) confirm.mutate();
              }}
            >
              <p className="text-xs text-muted-ink">
                Codes expire after 10 minutes. After changing your email, sign in with{" "}
                {challenge.newEmail}. If you used Google only, use password reset for the new email
                to set a password.
              </p>
              <label className={app ? cn(labelClass, "flex flex-col gap-1.5") : "giving-label"}>
                Code from current inbox
                <input
                  className={app ? inputClass : "giving-input"}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  disabled={busy}
                  value={oldCode}
                  onChange={(event) => setOldCode(event.target.value.replace(/\D/g, ""))}
                />
              </label>
              <label className={app ? cn(labelClass, "flex flex-col gap-1.5") : "giving-label"}>
                Code from new inbox
                <input
                  className={app ? inputClass : "giving-input"}
                  inputMode="numeric"
                  required
                  pattern="[0-9]{6}"
                  maxLength={6}
                  disabled={busy}
                  value={newCode}
                  onChange={(event) => setNewCode(event.target.value.replace(/\D/g, ""))}
                />
              </label>
              {confirm.isError && (
                <p role="alert" className="text-sm text-red-700">
                  {confirm.error.message}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  className={app ? btn("primary", "sm") : "giving-small-button bg-black text-white"}
                  disabled={busy || oldCode.length !== 6 || newCode.length !== 6}
                >
                  {confirm.isPending ? "Verifying..." : "Verify and change email"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className={app ? btn("secondary", "sm") : "giving-small-button"}
                  onClick={() => {
                    setChallenge(null);
                    request.reset();
                    confirm.reset();
                  }}
                >
                  Request new codes
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
