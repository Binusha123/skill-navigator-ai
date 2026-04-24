interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  tone?: "primary" | "success" | "warning" | "destructive";
}

const toneMap = {
  primary: "gradient-bg",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

const ProgressBar = ({ value, className = "", tone = "primary" }: ProgressBarProps) => {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`relative h-2 overflow-hidden rounded-full bg-muted ${className}`}>
      <div
        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${toneMap[tone]}`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
};

export default ProgressBar;
