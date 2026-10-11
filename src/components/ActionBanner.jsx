export default function ActionBanner({ title, description, count, type = "warning", onAction }) {
  // Define border and background colors based on the banner type
  const isWarning = type === "warning";
  
  const borderStyles = isWarning 
    ? "border-amber-500/30 bg-amber-500/10 text-amber-400" 
    : "border-blue-500/30 bg-blue-500/10 text-blue-400";

  return (
    <div className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${borderStyles}`}>
      <div className="flex items-start gap-4">
        {/* Count Badge */}
        <span className="px-3 py-1 bg-slate-900/80 rounded-lg text-sm font-bold border border-slate-700/50">
          {count}
        </span>
        <div>
          <h3 className="font-semibold text-white text-base">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>

      {/* Interactive Action Button */}
      {onAction && (
        <button 
          onClick={onAction}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition border border-slate-700 whitespace-nowrap"
        >
          View Items
        </button>
      )}
    </div>
  );
}