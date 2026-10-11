import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
export function EmailChange({ currentEmail }: { currentEmail: string }) {
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
        className="giving-small-button mt-4"
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
              <label className="giving-label">
                New sign-in email
                <input
                  type="email"
                  required
                  maxLength={160}
                  className="giving-input"
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
                className="giving-small-button bg-black text-white"
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
              <label className="giving-label">
                Code from current inbox
                <input
                  className="giving-input"
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
              <label className="giving-label">
                Code from new inbox
                <input
                  className="giving-input"
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
                  className="giving-small-button bg-black text-white"
                  disabled={busy || oldCode.length !== 6 || newCode.length !== 6}
                >
                  {confirm.isPending ? "Verifying..." : "Verify and change email"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="giving-small-button"
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
