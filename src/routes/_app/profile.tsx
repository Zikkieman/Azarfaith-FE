import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ProfileSkeleton } from "@/components/app/Skeletons";
import { pending, simulateNetwork } from "@/lib/api";
import { useState } from "react";
import { BadgeCheck, Building2, LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  AppShell,
  Container,
  SectionHeading,
  StatTile,
  btnPrimary,
  btnSecondary,
  cardClass,
  eyebrowClass,
  inputClass,
  labelClass,
} from "@/components/app/AppShell";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/lib/store";
import { formatCompactMoney, me } from "@/lib/mock";

export const Route = createFileRoute("/_app/profile")({
  loader: () => simulateNetwork(),
  pendingComponent: () => <ProfileSkeleton label="Loading your profile" />,
  ...pending,
  head: () => ({ meta: [{ title: "Profile — AzarFaith" }] }),
  component: Profile,
});

const preferences = [
  {
    id: "reminders",
    title: "Gift reminders",
    body: "A heads-up two days before a recurring gift is charged or due.",
    on: true,
  },
  {
    id: "updates",
    title: "Campaign updates",
    body: "When a campaign you support posts news, photos or receipts.",
    on: true,
  },
  {
    id: "news",
    title: "AzarFaith newsletter",
    body: "A monthly round-up of verified causes and donor stories.",
    on: false,
  },
];

function Profile() {
  const navigate = useNavigate();
  const recurringDonations = useApp((s) => s.recurringDonations);
  const orgs = useApp((s) => s.orgs);
  const setAuthed = useApp((s) => s.setAuthed);
  const activeCount = recurringDonations.filter((r) => r.active).length;
  const [first, ...rest] = me.name.split(" ");
  const [editing, setEditing] = useState(false);
  const supportedOrgs = orgs.slice(0, 3);

  return (
    <AppShell>
      <section className="border-b border-line pb-12 pt-12 md:pb-14 md:pt-16">
        <Container className="flex flex-col gap-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-5">
              <img
                src={me.avatar}
                alt=""
                className="h-20 w-20 shrink-0 rounded-full object-cover md:h-24 md:w-24"
              />
              <div className="flex flex-col gap-1.5">
                <p className={eyebrowClass}>Profile</p>
                <h1 className="font-display text-[clamp(32px,3.7vw,56px)] leading-[1.08] tracking-[-0.03em] text-ink">
                  {me.name}
                </h1>
                <p className="text-base text-ink-soft">
                  {me.location} · Giving since {me.joined}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthed(false);
                navigate({ to: "/" });
              }}
              className={`${btnSecondary} self-start sm:self-auto`}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} /> Log out
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            <StatTile value={formatCompactMoney(me.totalGiven)} label="Total given" />
            <StatTile value={activeCount} label="Recurring gifts" />
            <StatTile value={me.verifications.length} label="Checks passed" />
          </div>
        </Container>
      </section>

      <Container className="grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-12">
          <section className="flex flex-col gap-6">
            <SectionHeading
              aside={
                !editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-sm font-medium text-ink underline underline-offset-2"
                  >
                    Edit
                  </button>
                ) : null
              }
            >
              Personal details
            </SectionHeading>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setEditing(false);
                toast("Profile updated");
              }}
              className={`${cardClass} grid gap-5 p-6 sm:grid-cols-2`}
            >
              <Field label="First name" defaultValue={first} disabled={!editing} />
              <Field label="Last name" defaultValue={rest.join(" ")} disabled={!editing} />
              <Field
                label="Email"
                type="email"
                defaultValue="tunde@azarfaith.com"
                disabled={!editing}
              />
              <Field
                label="Phone"
                type="tel"
                defaultValue="+234 803 000 0000"
                disabled={!editing}
              />
              <Field
                label="City"
                defaultValue={me.location}
                disabled={!editing}
                className="sm:col-span-2"
              />
              {editing ? (
                <div className="flex gap-3 sm:col-span-2">
                  <button type="submit" className={btnPrimary}>
                    Save changes
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className={btnSecondary}>
                    Cancel
                  </button>
                </div>
              ) : null}
            </form>
          </section>

          <section className="flex flex-col gap-6">
            <SectionHeading>Notifications</SectionHeading>
            <ul className="flex flex-col border-t border-line">
              {preferences.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-6 border-b border-line py-5"
                >
                  <label htmlFor={p.id} className="flex flex-col gap-0.5">
                    <span className="text-base font-semibold text-ink">{p.title}</span>
                    <span className="text-sm leading-5 text-muted-ink">{p.body}</span>
                  </label>
                  <Switch
                    id={p.id}
                    defaultChecked={p.on}
                    className="data-[state=checked]:bg-ink data-[state=unchecked]:bg-line-input"
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <div className={`${cardClass} flex flex-col gap-4 p-6`}>
            <p className="text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.1em] text-ink-soft">
              Verifications
            </p>
            <ul className="flex flex-col gap-3">
              {me.verifications.map((v) => (
                <li key={v} className="flex items-center gap-3 text-base text-ink">
                  <BadgeCheck className="h-5 w-5 text-[#00B67A]" strokeWidth={1.5} />
                  {v}
                </li>
              ))}
            </ul>
          </div>

          <div className={`${cardClass} flex flex-col gap-4 p-6`}>
            <p className="text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.1em] text-ink-soft">
              Organizations you support
            </p>
            <ul className="flex flex-col gap-3">
              {supportedOrgs.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/org/$id"
                    params={{ id: o.id }}
                    className="flex items-center gap-3 text-ink hover:underline"
                  >
                    <img
                      src={o.photos[0]}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0 truncate text-base">{o.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-xl bg-[#FFE228] p-6">
            <Building2 className="h-6 w-6 text-ink" strokeWidth={1.5} />
            <p className="font-display text-2xl leading-[1.2] text-ink">
              Lead a church or ministry?
            </p>
            <p className="text-base leading-[25.6px] tracking-[-0.02em] text-ink">
              Register it on AzarFaith to raise support with a verified badge.
            </p>
            <Link to="/register-org" className={`${btnPrimary} self-start`}>
              Register your org
            </Link>
          </div>
        </aside>
      </Container>
    </AppShell>
  );
}

function Field({
  label,
  className,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className={labelClass}>{label}</span>
      <input
        {...props}
        className={`${inputClass} disabled:border-transparent disabled:bg-panel disabled:text-ink-soft`}
      />
    </label>
  );
}
