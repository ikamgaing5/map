"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const LiveTrackerMap = dynamic(() => import("./LiveTrackerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-500 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <span className="text-sm font-medium">Chargement de la carte privée OpenStreetMap...</span>
    </div>
  ),
});

export default LiveTrackerMap;

