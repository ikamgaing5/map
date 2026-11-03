"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Plus,
  LogOut,
  MapPin,
  Battery,
  BatteryCharging,
  Clock,
  Trash2,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Power,
  RefreshCw,
  AlertCircle,
  X,
  MessageSquare,
  Smartphone,
  ChevronRight,
  Route,
} from "lucide-react";
import LiveTrackerMap from "@/components/Map/MapWrapper";
import { formatDistance, formatSpeed, formatTimeAgo } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
}

interface TrackingLinkItem {
  id: string;
  token: string;
  childName: string;
  pinCode: string | null;
  isActive: boolean;
  isExpired: boolean;
  effectiveActive: boolean;
  expiresAt: string;
  createdAt: string;
  lastLat: number | null;
  lastLng: number | null;
  lastAccuracy: number | null;
  lastSpeed: number | null;
  lastHeading: number | null;
  lastBattery: number | null;
  isCharging: boolean | null;
  lastSeen: string | null;
  locationCount: number;
}

export default function DashboardClient({ user }: { user: User }) {
  const router = useRouter();

  const [links, setLinks] = useState<TrackingLinkItem[]>([]);
  const [selectedLink, setSelectedLink] = useState<TrackingLinkItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyPoints, setHistoryPoints] = useState<
    Array<{ latitude: number; longitude: number; timestamp?: string }>
  >([]);
  const [totalDistance, setTotalDistance] = useState(0);

  // New Link Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [childName, setChildName] = useState("");
  const [durationHours, setDurationHours] = useState(4);
  const [pinCode, setPinCode] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createdLinkResult, setCreatedLinkResult] = useState<TrackingLinkItem | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Fetch Links
  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/links");
      const data = await res.json();
      if (res.ok) {
        setLinks(data.links);

        // Keep selectedLink synced or default to the first active one
        setSelectedLink((prev) => {
          if (prev) {
            const updated = data.links.find((l: TrackingLinkItem) => l.id === prev.id);
            return updated || data.links[0] || null;
          }
          return data.links[0] || null;
        });
      }
    } catch (err) {
      console.error("Failed to load links:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  // Fetch History for selected link
  const fetchHistory = useCallback(async (token: string) => {
    try {
      const res = await fetch(`/api/track/${token}/history`);
      const data = await res.json();
      if (res.ok) {
        setHistoryPoints(data.points || []);
        setTotalDistance(data.totalDistanceMeters || 0);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedLink?.token) {
      fetchHistory(selectedLink.token);
    }
  }, [selectedLink?.token, fetchHistory]);

  // Real-time live polling every 3 seconds for the selected link
  useEffect(() => {
    if (!selectedLink?.token || !selectedLink.effectiveActive) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/track/${selectedLink.token}/live`);
        const live = await res.json();

        if (res.ok && live.lastLat && live.lastLng) {
          setSelectedLink((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              lastLat: live.lastLat,
              lastLng: live.lastLng,
              lastAccuracy: live.lastAccuracy,
              lastSpeed: live.lastSpeed,
              lastHeading: live.lastHeading,
              lastBattery: live.lastBattery,
              isCharging: live.isCharging,
              lastSeen: live.lastSeen,
              locationCount: live.totalPoints,
            };
          });

          // Append to history points if new position
          setHistoryPoints((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.latitude !== live.lastLat || last.longitude !== live.lastLng) {
              return [...prev, { latitude: live.lastLat, longitude: live.lastLng, timestamp: live.lastSeen }];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Live poll failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedLink?.token, selectedLink?.effectiveActive]);

  // Logout handler
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // Create new link
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName,
          durationHours,
          pinCode: pinCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCreatedLinkResult(data.link);
      setChildName("");
      setPinCode("");
      await fetchLinks();
    } catch (err: any) {
      alert(err.message || "Erreur lors de la création du lien.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Toggle link active status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (res.ok) {
        fetchLinks();
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  // Delete link
  const handleDeleteLink = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce lien et tout son historique ?")) {
      return;
    }
    try {
      const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedLink?.id === id) {
          setSelectedLink(null);
        }
        fetchLinks();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Copy share URL to clipboard
  const getFullShareUrl = (token: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/track/${token}`;
    }
    return `/track/${token}`;
  };

  const copyToClipboard = (token: string) => {
    const url = getFullShareUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-slate-900 hidden sm:inline">
                Family<span className="text-blue-600">Safe</span>
              </span>
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200 hidden md:inline">
              Espace Parent
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-600 hidden sm:inline">
              Bonjour, <strong className="text-slate-900">{user.name}</strong>
            </span>
            <button
              onClick={() => {
                setCreatedLinkResult(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-sm transition gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Lien</span>
            </button>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Children & Links */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600" />
              Liens de Suivi ({links.length})
            </h2>
            <button
              onClick={fetchLinks}
              title="Actualiser"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Links list */}
          <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
            {links.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
                <Smartphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-700 text-sm mb-1">Aucun lien actif</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Créez un lien à envoyer à votre enfant pour suivre son trajet.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  Créer un premier lien
                </button>
              </div>
            ) : (
              links.map((link) => {
                const isSelected = selectedLink?.id === link.id;

                return (
                  <div
                    key={link.id}
                    onClick={() => setSelectedLink(link)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative bg-white ${
                      isSelected
                        ? "border-blue-500 shadow-md ring-2 ring-blue-500/10"
                        : "border-slate-200 hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white ${
                            link.effectiveActive ? "bg-blue-600" : "bg-slate-400"
                          }`}
                        >
                          {link.childName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{link.childName}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                link.effectiveActive ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                            ></span>
                            <span>{link.effectiveActive ? "Actif" : link.isExpired ? "Expiré" : "En pause"}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(link.lastSeen)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Battery indicator if available */}
                      {link.lastBattery !== null && (
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          {link.isCharging ? (
                            <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Battery className="w-3.5 h-3.5 text-blue-500" />
                          )}
                          <span>{link.lastBattery}%</span>
                        </div>
                      )}
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 border-t border-slate-100 pt-2.5 mt-2">
                      <div>
                        <span>Vitesse : </span>
                        <strong className="text-slate-700">{formatSpeed(link.lastSpeed)}</strong>
                      </div>
                      <div>
                        <span>Points GPS : </span>
                        <strong className="text-slate-700">{link.locationCount}</strong>
                      </div>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(link.token);
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg text-xs flex items-center gap-1 transition"
                          title="Copier le lien"
                        >
                          {copiedToken === link.token ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[11px]">
                            {copiedToken === link.token ? "Copié !" : "Copier le lien"}
                          </span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(link.id, link.isActive);
                          }}
                          className={`p-1.5 rounded-lg text-xs transition ${
                            link.isActive
                              ? "text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={link.isActive ? "Mettre en pause" : "Réactiver"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLink(link.id);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Interactive Live Map & Telemetry */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {selectedLink ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-[550px]">
              {/* Map Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                    {selectedLink.childName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      Suivi en Direct : {selectedLink.childName}
                      {selectedLink.effectiveActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          🟢 Connecté
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Expire le {new Date(selectedLink.expiresAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(selectedLink.token)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition"
                  >
                    {copiedToken === selectedLink.token ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>Partager</span>
                  </button>
                  <a
                    href={`/track/${selectedLink.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Vue Enfant</span>
                  </a>
                </div>
              </div>

              {/* Leaflet Map Component */}
              <div className="flex-1 w-full relative min-h-[440px]">
                <LiveTrackerMap
                  childName={selectedLink.childName}
                  currentLocation={
                    selectedLink.lastLat && selectedLink.lastLng
                      ? {
                          latitude: selectedLink.lastLat,
                          longitude: selectedLink.lastLng,
                          accuracy: selectedLink.lastAccuracy,
                          speed: selectedLink.lastSpeed,
                          heading: selectedLink.lastHeading,
                          batteryLevel: selectedLink.lastBattery,
                          timestamp: selectedLink.lastSeen,
                        }
                      : null
                  }
                  historyPoints={historyPoints}
                  totalDistanceMeters={totalDistance}
                />
              </div>

              {/* Bottom Route Summary Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Route className="w-4 h-4 text-indigo-500" />
                    <span>Distance totale : </span>
                    <strong className="text-slate-900">{formatDistance(totalDistance)}</strong>
                  </div>
                  <div>
                    <span>Relevés : </span>
                    <strong className="text-slate-900">{historyPoints.length} points</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Rafraîchissement automatique toutes les 3s • OpenStreetMap
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[500px]">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">Sélectionnez un lien de suivi</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Choisissez un enfant dans la colonne de gauche ou créez un nouveau lien pour voir sa position en direct sur la carte.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Link Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                {createdLinkResult ? "Lien Prêt à Partager !" : "Nouveau Lien de Suivi"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setCreatedLinkResult(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!createdLinkResult ? (
              <form onSubmit={handleCreateLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prénom de l&apos;enfant
                  </label>
                  <input
                    type="text"
                    required
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="ex: Lucas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durée de validité du lien
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value={1}>1 heure (Trajet court)</option>
                    <option value={4}>4 heures (Après-midi)</option>
                    <option value={8}>8 heures (Journée d&apos;école)</option>
                    <option value={24}>24 heures (Journée complète)</option>
                    <option value={168}>7 jours (Semaine de vacances)</option>
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Le lien s&apos;éteindra automatiquement après cette durée pour respecter la vie privée.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code PIN de sécurité (Optionnel)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="ex: 1234"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Si renseigné, l&apos;enfant devra taper ce code sur son téléphone pour débloquer le partage.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-blue-500/20"
                  >
                    {createLoading ? "Génération du lien..." : "Générer le lien sécurisé"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs">
                  <span className="font-bold block mb-1">✅ Lien généré avec succès pour {createdLinkResult.childName} !</span>
                  Envoyez ce lien à votre enfant par message. Dès qu&apos;il clique dessus, vous verrez son trajet en temps réel.
                </div>

                {/* Link Box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lien de suivi :</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getFullShareUrl(createdLinkResult.token)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all"
                    />
                    <button
                      onClick={() => copyToClipboard(createdLinkResult.token)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap shadow-sm"
                    >
                      {copiedToken === createdLinkResult.token ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copier
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Instant share buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `Coucou ! Clique sur ce lien pour me partager ta position en direct : ${getFullShareUrl(
                        createdLinkResult.token
                      )}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Partager sur WhatsApp
                  </a>

                  <a
                    href={`sms:?body=${encodeURIComponent(
                      `Coucou ! Clique sur ce lien pour me partager ta position en direct : ${getFullShareUrl(
                        createdLinkResult.token
                      )}`
                    )}`}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition"
                  >
                    <Smartphone className="w-4 h-4" />
                    Envoyer par SMS
                  </a>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setCreatedLinkResult(null);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

