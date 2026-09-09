import { format, differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";

/** Base dùng chung cho Timeline/Gantt: lưới cột-ngày cố định bề rộng (px/ngày). */
export const DAY_WIDTH = 32;
export const ROW_HEIGHT = 44;

export function DateGridHeader({ days }: { days: Date[] }) {
  return (
    <div className="flex border-b border-border">
      {days.map((day) => (
        <div
          key={day.toISOString()}
          style={{ width: DAY_WIDTH, minWidth: DAY_WIDTH }}
          className={cn(
            "shrink-0 border-r border-border/40 px-1 py-1 text-center text-[10px] text-muted-foreground",
            [0, 6].includes(day.getDay()) && "bg-muted/40"
          )}
        >
          {format(day, "dd/MM")}
        </div>
      ))}
    </div>
  );
}

export function dayOffset(days: Date[], date: Date) {
  return differenceInCalendarDays(date, days[0]);
}
