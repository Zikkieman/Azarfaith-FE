import { cn } from "@/lib/utils";

type BarChartProps = {
  data: { label: string; value: number }[];
  maxValue?: number;
  className?: string;
};

export function AdminBarChart({ data, maxValue, className }: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-right text-xs text-gray-500">{item.label}</span>
          <div className="flex-1">
            <div className="h-6 rounded-md bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-md bg-amber-400 transition-all duration-500"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-20 shrink-0 text-xs font-medium text-gray-700">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
