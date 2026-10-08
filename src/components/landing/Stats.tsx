import type { CSSProperties } from "react";
import { CountUp, Reveal } from "@/components/motion/Reveal";
const stats = [
  { label: "Given to Ministries", value: "₦250M+" },
  { label: "Active Donors", value: "18k+" },
  { label: "Verified Orgs", value: "480+" },
];

const rings = [
  { size: 108, offset: 142 },
  { size: 180, offset: 106 },
  { size: 244, offset: 74 },
  { size: 322, offset: 35 },
];

export function Stats() {
  return (
    <section className="w-full bg-paper pt-6 md:pt-10">
      <div className="mx-auto flex w-full max-w-[1728px] flex-col items-center gap-2.5">
        <Reveal className="flex w-full flex-col gap-6 p-6 md:px-[120px] md:py-[120px] xl:flex-row">
          <div
            data-stagger
            style={{ "--i": 0 } as CSSProperties}
            className="relative h-[270px] min-w-0 flex-1 overflow-hidden rounded-lg bg-[radial-gradient(circle_at_2%_1%,rgba(84,84,84,1)_0%,rgba(28,26,23,1)_100%)]"
          >
            <div className="pointer-events-none absolute -left-[178px] -top-[204px] h-[392px] w-[392px]">
              {rings.map((ring) => (
                <span
                  key={ring.size}
                  className="absolute rounded-full border border-white/[0.12]"
                  style={{
                    width: ring.size,
                    height: ring.size,
                    left: ring.offset,
                    top: ring.offset,
                  }}
                />
              ))}
              <span className="absolute inset-0 rounded-full border border-white/[0.12] opacity-10" />
            </div>

            <div className="relative flex h-full flex-col justify-end p-10">
              <p className="font-gsf text-2xl font-medium leading-[1.2] tracking-[-0.03em] text-white">
                Trusted by
                <br />
                givers
                <br />
                funding
                <br />
                God&apos;s work
                <br />
                in Nigeria
              </p>
            </div>
          </div>

          {stats.map((stat, i) => (
            <div
              key={stat.label}
              data-stagger
              style={{ "--i": i + 1 } as CSSProperties}
              className="flex h-[270px] min-w-0 flex-1 flex-col justify-between rounded-lg bg-panel p-10"
            >
              <p className="font-gsf text-lg font-medium leading-6 tracking-[-0.01em] text-muted-ink">
                {stat.label}
              </p>
              <p className="font-gsf text-[56px] font-bold leading-[56px] tracking-[-0.03em] text-heading">
                <CountUp value={stat.value} />
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
