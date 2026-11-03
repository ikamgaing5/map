import Link from "next/link";
import { ShieldCheck, MapPin, Smartphone, Lock, EyeOff, Battery, Clock, ArrowRight, HeartHandshake } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Navigation */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Family<span className="text-blue-600">Safe</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition shadow-sm text-sm"
              >
                Mon Espace Parent
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-500/20"
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <Lock className="w-3.5 h-3.5" /> 100% Privé • Zéro Fuite de Données • OpenStreetMap
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            La sécurité de vos enfants,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              sans espionnage ni fuite de données.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Envoyez un simple lien sécurisé à votre enfant. Dès qu&apos;il clique dessus, vous visualisez sa
            position en temps réel et son trajet sur une carte privée, sans application intrusive.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
            >
              Démarrer le suivi sécurisé
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-200 transition"
            >
              Comment ça marche ?
            </Link>
          </div>

          {/* Privacy badge banner */}
          <div className="mt-12 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm max-w-3xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-600" />
              <span>Aucune revente de données</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Tokens sécurisés uniques</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Liens à durée limitée (TTL)</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span>OpenStreetMap privé</span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-slate-100/70 border-y border-slate-200 py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-4">
              Simple comme un clic, sécurisé pour votre famille
            </h2>
            <p className="text-slate-600 text-center max-w-xl mx-auto mb-12">
              Pas besoin d&apos;installer une application compliquée sur le téléphone de votre enfant. Tout fonctionne dans le navigateur.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">Générez un lien sécurisé</h3>
                <p className="text-slate-600 text-sm">
                  Depuis votre espace parent, créez un lien pour votre enfant avec une durée de validité (ex: 2h pour le trajet retour de l&apos;école) et un code PIN optionnel.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">L&apos;enfant clique sur le lien</h3>
                <p className="text-slate-600 text-sm">
                  Envoyez le lien par SMS ou WhatsApp. L&apos;enfant ouvre le lien sur son smartphone et autorise le partage GPS d&apos;un simple toucher.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">Suivi en direct & Historique</h3>
                <p className="text-slate-600 text-sm">
                  Suivez en temps réel ses déplacements, sa vitesse, son niveau de batterie, et consultez l&apos;historique complet de son itinéraire.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
            Conçu pour la confiance et la protection
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Sans installation requise</h4>
              <p className="text-sm text-slate-600">
                Fonctionne instantanément sur Safari (iPhone), Chrome (Android) et tout navigateur moderne sans configuration.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Battery className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Niveau de batterie visible</h4>
              <p className="text-sm text-slate-600">
                Gardez un œil sur la batterie de son téléphone pour ne jamais être pris de court par un appareil déchargé.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Contrôle consenti</h4>
              <p className="text-sm text-slate-600">
                L&apos;enfant voit un indicateur clair et peut arrêter le partage à tout moment. Cela renforce la confiance parent-enfant.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} FamilySafe - Suivi familial sécurisé et privé. Hébergeable en 1 clic sur Vercel.</p>
      </footer>
    </div>
  );
}
