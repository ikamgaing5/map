# 🛡️ FamilySafe - Suivi Sécurisé Familial en Temps Réel

Application web complète (Frontend Next.js + Backend API Routes & Server Actions) conçue spécialement pour la **sécurité familiale et la protection absolue de la vie privée**.

Permet à un parent de suivre en temps réel la position de son enfant via un simple clic sur un lien sécurisé, sans aucune application native à installer sur le téléphone de l'enfant.

---

## 🔒 Principes de Sécurité & Anti-Fuite de Données

1. **Zéro tracker tiers** : Aucun script publicitaire, aucun SDK Google/Meta, aucune revente de données de géolocalisation.
2. **OpenStreetMap & Leaflet** : Utilisation d'un moteur cartographique 100% open source et respectueux de la vie privée.
3. **Tokens cryptographiques uniques** : Liens protégés par des jetons aléatoires de 64 caractères hexadécimaux (`crypto.randomBytes(32)`).
4. **Code PIN optionnel** : Déverrouillage sécurisé sur le mobile de l'enfant avec un code à 4 chiffres configuré par le parent.
5. **Durée de vie limitée (TTL)** : Les liens s'éteignent automatiquement au bout de la durée choisie (1h, 4h, 8h, 24h, 7 jours).
6. **Révocation instantanée** : Le parent (comme l'enfant) peut couper le suivi à tout instant d'un seul clic.
7. **Screen Wake Lock API** : Maintient le GPS actif sans mise en veille intempestive de l'écran du smartphone dans la poche.

---

## 🚀 Fonctionnalités Clés

- **Espace Parent sécurisé** :
  - Création de compte et connexion chiffrée (bcrypt + JWT HTTP-only).
  - Génération de liens de suivi sécurisés personnalisés par enfant.
  - Carte interactive plein écran avec radar animé, rayon de précision GPS et tracé de l'itinéraire.
  - Indicateurs de télémétrie en direct : Vitesse de déplacement (marche, vélo, véhicule), niveau de batterie du smartphone et état de charge.
  - Historique complet des points GPS avec distance totale parcourue en kilomètres.
  - Partage instantané via WhatsApp ou SMS en 1 clic.

- **Vue Enfant (sur smartphone)** :
  - Accessible depuis n'importe quel navigateur (Safari iOS, Chrome Android, Firefox).
  - Aucune application à télécharger sur l'App Store ou Google Play.
  - Bouton simple « Démarrer le partage en direct » et « Arrêter le partage ».
  - Indicateur visuel clair garantissant un partage consenti et transparent.

---

## 🛠️ Stack Technique

- **Framework** : Next.js 14 (App Router) - Monolithe Fullstack (Front + Back dans un seul dossier).
- **Backend** : Next.js API Routes & Route Handlers Serverless.
- **Base de données & ORM** : Prisma ORM avec SQLite (local) ou PostgreSQL (Vercel Postgres, Supabase, Neon).
- **Cartographie** : Leaflet & React Leaflet avec tuiles OpenStreetMap.
- **Sécurité** : `jose` (JWT), `bcryptjs`, cryptographie Node.js.
- **Design & UI** : Tailwind CSS, Lucide React icons.

---

## 💻 Démarrage en Local

### 1. Cloner ou ouvrir le dossier du projet
```bash
cd map
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Initialiser la base de données locale
```bash
npx prisma db push
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```

L'application est accessible à l'adresse : **[http://localhost:3000](http://localhost:3000)**

---

## ☁️ Déploiement en 1 clic sur Vercel

Le projet a été spécialement conçu pour un déploiement direct et instantané sur **Vercel** :

1. Poussez le code sur un dépôt GitHub / GitLab.
2. Rendez-vous sur [Vercel](https://vercel.com) et cliquez sur **Add New Project** > Importez votre dépôt.
3. Configurez les variables d'environnement dans l'interface Vercel :
   - `DATABASE_URL` : L'URL de connexion PostgreSQL (par exemple Vercel Postgres, Supabase ou Neon) :
     ```text
     DATABASE_URL="postgresql://user:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require"
     ```
   - `JWT_SECRET` : Une chaîne aléatoire d'au moins 32 caractères (ex: `openssl rand -hex 32`).
   - `NEXT_PUBLIC_APP_URL` : L'URL de votre application déployée (ex: `https://votre-app.vercel.app`).
4. Dans le fichier `prisma/schema.prisma`, si vous utilisez PostgreSQL en production, changez :
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. Cliquez sur **Deploy**. Vercel exécutera automatiquement le build et l'application sera en ligne !

