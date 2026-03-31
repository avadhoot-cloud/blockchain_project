import { cn } from "@/lib/utils";

type Status = "approved" | "pending" | "rejected";

const statusStyles: Record<Status, string> = {
  approved: "bg-status-approved/15 text-status-approved border-status-approved/30",
  pending: "bg-status-pending/15 text-status-pending border-status-pending/30",
  rejected: "bg-status-rejected/15 text-status-rejected border-status-rejected/30",
};

const StatusBadge = ({ status }: { status: Status }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize",
      statusStyles[status]
    )}
  >
    <span
      className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-status-approved": status === "approved",
        "bg-status-pending": status === "pending",
        "bg-status-rejected": status === "rejected",
      })}
    />
    {status}
  </span>
);

export default StatusBadge;
