export default function Card({ title, value, status }){
  return(
    <div className="p-6 bg-slate-800 border border-slate-700 rounded-xl shadow-sm">
      <h3 className="text-sm font-medium text-slate-400">{title}</h3>
      <p className="text-3xl font-bold mt-2 text-white">{value}</p>
      {status &&(
        <span className="inline-block mt-3 text-xs px-2.5 py-1 bg-slate-700 text-slate-300 rounded-full">
          {status}
        </span>
      )}
    </div>
  );
}