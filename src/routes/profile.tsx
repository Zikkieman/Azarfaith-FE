import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/profile")({
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
      <section className="border-b border-[#D9DDBC] pb-12 pt-12 md:pb-14 md:pt-16">
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
                <h1 className="font-display text-[clamp(32px,3.7vw,56px)] leading-[1.08] tracking-[-0.01em] text-[#130E30]">
                  {me.name}
                </h1>
                <p className="text-base text-[#4A4660]">
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
                    className="text-sm font-medium text-[#130E30] underline underline-offset-2"
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
            <ul className="flex flex-col border-t border-[#D9DDBC]">
              {preferences.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-6 border-b border-[#D9DDBC] py-5"
                >
                  <label htmlFor={p.id} className="flex flex-col gap-0.5">
                    <span className="text-base font-semibold text-[#130E30]">{p.title}</span>
                    <span className="text-sm leading-5 text-[#667085]">{p.body}</span>
                  </label>
                  <Switch
                    id={p.id}
                    defaultChecked={p.on}
                    className="data-[state=checked]:bg-[#130E30]"
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <div className={`${cardClass} flex flex-col gap-4 p-6`}>
            <p className="text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.1em] text-[#4A4660]">
              Verifications
            </p>
            <ul className="flex flex-col gap-3">
              {me.verifications.map((v) => (
                <li key={v} className="flex items-center gap-3 text-base text-[#130E30]">
                  <BadgeCheck className="h-5 w-5 text-[#00B67A]" strokeWidth={1.5} />
                  {v}
                </li>
              ))}
            </ul>
          </div>

          <div className={`${cardClass} flex flex-col gap-4 p-6`}>
            <p className="text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.1em] text-[#4A4660]">
              Organizations you support
            </p>
            <ul className="flex flex-col gap-3">
              {supportedOrgs.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/org/$id"
                    params={{ id: o.id }}
                    className="flex items-center gap-3 text-[#130E30] hover:underline"
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
            <Building2 className="h-6 w-6 text-[#130E30]" strokeWidth={1.5} />
            <p className="font-display text-2xl leading-[1.2] text-[#130E30]">
              Lead a church or ministry?
            </p>
            <p className="text-base leading-[25.6px] tracking-[-0.02em] text-[#130E30]">
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
        className={`${inputClass} disabled:border-transparent disabled:bg-[#F7F5F3] disabled:text-[#4A4660]`}
      />
    </label>
  );
}
