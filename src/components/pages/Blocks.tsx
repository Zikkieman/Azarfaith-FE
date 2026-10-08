import type { Block, Card } from "@/components/pages/types";

function Rule() {
  return <div className="h-px w-full bg-line" />;
}

function CardGrid({ items }: { items: Card[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="flex h-full flex-col gap-3 rounded-xl border border-line-soft bg-paper p-6 transition-colors hover:border-line"
        >
          {item.tag ? (
            <span className="w-fit rounded-full bg-peach px-2.5 py-1 font-gsf text-xs font-semibold uppercase tracking-[0.08em] text-[#FE5102]">
              {item.tag}
            </span>
          ) : null}
          <h3 className="font-gsf text-lg font-semibold leading-[27px] tracking-[-0.01em] text-ink">
            {item.title}
          </h3>
          {item.meta ? (
            <p className="font-gsf text-[13px] leading-[19.5px] text-muted-ink">{item.meta}</p>
          ) : null}
          {item.text ? (
            <p className="font-gsf text-sm leading-[21px] text-ink-soft">{item.text}</p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <details key={item.q} className="group border-t border-line last:border-b">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-[17px] font-gsf text-base leading-[22.4px] tracking-[-0.02em] text-ink [&::-webkit-details-marker]:hidden">
            {item.q}
            <svg
              viewBox="0 0 18 18"
              className="h-[18px] w-[18px] shrink-0 transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              <path
                d="M4 7l5 5 5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </summary>
          <p className="pb-[17px] font-gsf text-sm leading-[21px] text-ink-soft">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line-soft">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-panel">
            {head.map((cell) => (
              <th
                key={cell}
                className="px-4 py-3 font-gsf text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-soft"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("|")} className="border-t border-line-soft">
              {row.map((cell) => (
                <td key={cell} className="px-4 py-3 font-gsf text-sm leading-[21px] text-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-7">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <div key={index} className="flex flex-col gap-7 pt-4">
                <Rule />
                <h2
                  id={block.id}
                  className="scroll-mt-24 font-display text-[clamp(26px,2.2vw,36px)] leading-[1.14] tracking-[-0.01em] text-ink"
                >
                  {block.text}
                </h2>
              </div>
            );
          case "h3":
            return (
              <h3
                key={index}
                className="pt-2 font-gsf text-lg font-semibold leading-[27px] text-ink"
              >
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p
                key={index}
                className="font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft"
              >
                {block.text}
              </p>
            );
          case "bullets":
            return (
              <ul key={index} className="flex flex-col gap-3">
                {block.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#FE5102]" />
                    <span className="font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "steps":
            return (
              <ol key={index} className="flex flex-col gap-4">
                {block.items.map((item, step) => (
                  <li key={item} className="flex items-start gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink font-gsf text-[13px] font-semibold text-ink-contrast">
                      {step + 1}
                    </span>
                    <span className="font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            );
          case "callout":
            return (
              <aside
                key={index}
                className="flex flex-col gap-2 rounded-2xl border border-line bg-panel-olive p-6"
              >
                {block.title ? (
                  <p className="font-gsf text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
                    {block.title}
                  </p>
                ) : null}
                <p className="font-gsf text-base leading-[25.6px] tracking-[-0.02em] text-ink-soft">
                  {block.text}
                </p>
              </aside>
            );
          case "quote":
            return (
              <figure key={index} className="flex flex-col gap-3 border-l-4 border-[#FE5102] pl-6">
                <blockquote className="font-display text-[clamp(22px,1.8vw,28px)] leading-[1.26] tracking-[-0.01em] text-ink">
                  “{block.text}”
                </blockquote>
                {block.by ? (
                  <figcaption className="font-gsf text-sm leading-[21px] text-muted-ink">
                    {block.by}
                  </figcaption>
                ) : null}
              </figure>
            );
          case "table":
            return <Table key={index} head={block.head} rows={block.rows} />;
          case "faq":
            return <Faq key={index} items={block.items} />;
          case "cards":
            return <CardGrid key={index} items={block.items} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
