export default function AdUnit({ slot }: { slot: string }) {
  return (
    <div className="w-full bg-slate-200 border-2 border-dashed border-slate-300 p-6 rounded-xl my-8 flex flex-col items-center justify-center">
      <span className="text-xs text-slate-500 uppercase tracking-widest font-black mb-1">Espacio Publicitario</span>
      <div className="text-slate-600 font-medium">
        [Anuncio CPM/Clic: {slot}]
      </div>
    </div>
  );
}
