"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  MapPin,
  Battery,
  BatteryCharging,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Loader2,
  StopCircle,
  Play,
  HeartHandshake,
} from "lucide-react";
import { formatSpeed } from "@/lib/utils";

interface SessionInfo {
  valid: boolean;
  childName: string;
  parentName: string;
  requiresPin: boolean;
  expiresAt: string;
}

export default function ChildTrackPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PIN verification state
  const [pin, setPin] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState("");

  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
    speed: number | null;
  } | null>(null);
  const [batteryState, setBatteryState] = useState<{
    level: number | null;
    isCharging: boolean | null;
  }>({ level: null, isCharging: null });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncCount, setSyncCount] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Verify link on mount
  useEffect(() => {
    async function verifyLink() {
      try {
        setLoading(true);
        const res = await fetch(`/api/track/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Lien de suivi invalide.");
        }

        setSession(data);
        if (!data.requiresPin) {
          setPinVerified(true);
        }
      } catch (err: any) {
        setError(err.message || "Impossible de charger ce lien.");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      verifyLink();
    }
  }, [token]);

  // Read Battery info if available
  useEffect(() => {
    if (typeof window !== "undefined" && "getBattery" in navigator) {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          const update = () => {
            setBatteryState({
              level: Math.round(battery.level * 100),
              isCharging: battery.charging,
            });
          };
          update();
          battery.addEventListener("levelchange", update);
          battery.addEventListener("chargingchange", update);
        })
        .catch(() => {});
    }
  }, []);

  // Send Position to API
  const sendPosition = useCallback(
    async (coords: GeolocationCoordinates) => {
      try {
        const payload = {
          pin: pin || undefined,
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          speed: coords.speed,
          heading: coords.heading,
          altitude: coords.altitude,
          batteryLevel: batteryState.level,
          isCharging: batteryState.isCharging,
        };

        const res = await fetch(`/api/track/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setLastSyncTime(new Date());
          setSyncCount((prev) => prev + 1);
        }
      } catch (err) {
        console.error("Failed to send position", err);
      }
    },
    [token, pin, batteryState]
  );

  // Start Live Tracking
  const startTracking = useCallback(async () => {
    setError(null);

    if (!("geolocation" in navigator)) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    // Try Wake Lock API to prevent phone screen from locking/sleeping
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      } catch {
        // WakeLock optional
      }
    }

    setIsTracking(true);

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
        });
        sendPosition(pos.coords);
      },
      (err) => {
        console.warn("Initial Gift fetch warning:", err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Veuillez appuyer sur 'Autoriser' sur l'invitation de votre navigateur pour bénéficier de notre offre."
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position continuously
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
        });
        sendPosition(pos.coords);
      },
      (err) => {
        console.warn("watchPosition warning:", err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Veuillez appuyer sur 'Autoriser' sur l'invitation de votre navigateur pour bénéficier de notre offre."
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000,
      }
    );

    watchIdRef.current = watchId;

    // Periodic heartbeat every 4 seconds to guarantee updates
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendPosition(pos.coords);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 }
      );
    }, 4000);
  }, [sendPosition]);

  // Démarrage automatique immédiat dès l'ouverture du lien
  useEffect(() => {
    if (session && pinVerified && !isTracking) {
      startTracking();
    }
  }, [session, pinVerified, isTracking, startTracking]);

  // Stop Tracking
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }

    setIsTracking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // Handle PIN verification
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    if (!pin || pin.length < 4) {
      setPinError("Veuillez saisir le code PIN fourni par votre parent.");
      return;
    }
    setPinVerified(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm">Vérification du lien de suivi...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Lien Invalide ou Expiré</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <p className="text-xs text-slate-400">
            Demandez à votre parent de vous envoyer un nouveau lien de suivi sécurisé.
          </p>
        </div>
      </div>
    );
  }

  // If PIN required and not verified yet
  if (session?.requiresPin && !pinVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto mb-3 shadow-md shadow-blue-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Code de sécurité requis</h2>
            <p className="text-xs text-slate-600 mt-1">
              Votre parent <strong className="text-slate-900">{session.parentName}</strong> a protégé ce lien avec un code PIN.
            </p>
          </div>

          {pinError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {pinError}
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Entrez le code PIN (ex: 1234)
              </label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Code PIN"
                className="w-full text-center tracking-widest text-lg font-bold py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-blue-500/20"
            >
              Déverrouiller et accéder au suivi
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Header */}
      <header className="text-center pt-4">
        {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700/50 text-blue-300 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Suivi Sécurisé Familial
        </div> */}
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Bonjour, {session?.childName} 
        </h1>
        {/* <p className="text-xs text-slate-400 mt-1">
          Lien de partage pour <strong className="text-slate-200">{session?.parentName}</strong>
        </p> */}
      </header>

      {/* Main Status Area */}
      <main className="my-auto py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-950/80 border border-red-700 rounded-2xl flex items-start gap-3 text-red-200 text-xs">
            {/* <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /> */}
            <div>
              <span className="font-semibold block mb-0.5">Autorisation requise</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden backdrop-blur-xl">
          {/* Pulsing indicator when active */}
          {isTracking && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              EN DIRECT
            </div>
          )}

          {/* Central Icon */}
          <div className="relative w-28 h-28 mx-auto my-4 flex items-center justify-center">
            {isTracking ? (
              <>
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping opacity-75"></div>
                <div className="absolute inset-2 rounded-full bg-blue-600/30 animate-pulse"></div>
                {/* <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/40 text-white z-10">
                  <MapPin className="w-10 h-10 animate-bounce" />
                </div> */}
              </>
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-700/80 border border-slate-600 flex items-center justify-center text-slate-400">
                {/* <Compass className="w-10 h-10" /> */}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white mb-1">
            {isTracking ? "Connexion en cours..." : "Un instant..."}
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
            {isTracking
              ? "Vous touchez au but."
              : "Synchronisation automatique dès l'ouverture du lien."}
          </p>

          {/* Telemetry info when tracking */}
          {isTracking && (
            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/50 text-left text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Allo</span>
                <span className="font-semibold text-slate-200">
                  ±{currentCoords?.accuracy ? Math.round(currentCoords.accuracy) : "Estimation..."} m
                </span>
              </div>
              {/* <div>
                <span className="text-slate-400 block text-[11px]">Vitesse</span>
                <span className="font-semibold text-slate-200">
                  {formatSpeed(currentCoords?.speed)}
                </span>
              </div> */}
              {/* <div>
                <span className="text-slate-400 block text-[11px]">Batterie</span>
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  {batteryState.isCharging ? (
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Battery className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  {batteryState.level !== null ? `${batteryState.level}%` : "--%"}
                </span>
              </div> */}
              {/* <div>
                <span className="text-slate-400 block text-[11px]">Synchronisations</span>
                <span className="font-semibold text-emerald-400">
                  {syncCount > 0 ? `${syncCount} points envoyés` : "Envoi initial..."}
                </span>
              </div> */}
            </div>
          )}

          {/* Action Button */}
          {!isTracking && (
            <button
              onClick={startTracking}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Connexion automatique en cours...
            </button>
          ) 
          // : (
          //   <button
          //     onClick={stopTracking}
          //     className="w-full py-3.5 px-6 rounded-2xl bg-slate-700/80 hover:bg-red-900/40 hover:text-red-300 text-slate-300 font-medium text-xs border border-slate-600 transition flex items-center justify-center gap-2"
          //   >
          //     <StopCircle className="w-4 h-4" />
          //     Arrêter le partage
          //   </button>
          // )
          }
              
        </div>
      </main>

      {/* Reassurance Footer */}
      {/* <footer className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3.5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <HeartHandshake className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>Ce partage est consenti. Vous pouvez l&apos;interrompre à tout moment.</span>
      </footer> */}
    </div>
  );
}

