const MAP: Record<string, { color: string; label: string }> = {
  active:              { color: "#5B8258", label: "Active" },
  past_due:            { color: "#E8933A", label: "Past due" },
  scheduled_to_cancel: { color: "#C15A1A", label: "Scheduled" },
  canceled:            { color: "#6F6A62", label: "Canceled" },
  pending:             { color: "#F4B942", label: "Pending" },
  succeeded:           { color: "#5B8258", label: "Succeeded" },
  failed:              { color: "#A9432A", label: "Failed" },
  refunded:            { color: "#8A6B3B", label: "Refunded" },
};

export default function StatusDot({ status }: { status: string }) {
  const s = MAP[status] ?? { color: "#6F6A62", label: status };
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="w-[7px] h-[7px] rounded-full"
        style={{ background: s.color, boxShadow: `0 0 0 2px ${s.color}22` }}
      />
      <span className="text-[14px]">{s.label}</span>
    </span>
  );
}
