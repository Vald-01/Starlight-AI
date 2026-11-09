# 🔖 Starlight

> **Transformez vos liens en connaissances structurées, synthétisées et toujours organisées.**

**Starlight** est une application macOS native, ultra-rapide et respectueuse de votre vie privée. Elle vous permet de capturer, résumer et classer en un instant vos dépôts GitHub, articles web, snippets de code et contenus sociaux (Instagram Reels, etc.).




## ✨ Fonctionnalités Clés

- ⚡ **Mode Hybride (0 Setup requis) :**
  - **Algorithme Natif (Gratuit & sans clé API) :** Ajoutez des liens instantanément dès le premier lancement. L'application extrait automatiquement les titres, langages, étoiles GitHub et métadonnées sans nécessiter la moindre clé API.
  - **Mode IA Avancé (BYOK - *Bring Your Own Key*) :** Activez la puissance des LLM pour obtenir des résumés synthétiques, un marquage par tags ultra-précis et des réponses à vos questions sur chaque lien.

- 🤖 **Support Multi-Fournisseurs IA :**
  - **Ollama**
  - **OpenAI**
  - **Anthropic**
  - **Google Gemini**
  - **xAI**

- 🍏 **Expérience macOS Native & Légère :**
  - Développée avec **Tauri v2**, **React** et **Tailwind CSS** pour une empreinte mémoire minimale et une réactivité instantanée.
  - Raccourcis natifs : `Cmd + ,` pour les Paramètres, `Cmd + N` pour la barre de saisie, `Échap` pour fermer les fenêtres.
  - Prise en charge du thème macOS (Clair / Sombre / Automatique).
  - Option de lancement automatique au démarrage du Mac.

- 🛡️ **Gestion des Doublons :** Détection intelligente des URLs déjà enregistrées avec dialogue de confirmation.




## 🔒 Confidentialité & Sécurité

- Vos **clés API** sont conservées dans le **Trousseau macOS** et ne sont envoyées qu'à l'API officielle du fournisseur sélectionné.
- Vos **liens et préférences** restent sur votre machine. Aucun compte, aucune télémétrie.
- Pour récupérer les métadonnées, l'application contacte directement la page enregistrée ou l'API GitHub.
- En mode IA, le titre, l'URL, le résumé et vos questions sont envoyés au fournisseur que vous avez choisi. Avec **Ollama**, tout reste sur votre machine.




## 📦 Téléchargement & Installation

1. Rendez-vous dans la section **[Releases](../../releases)** du dépôt.
2. Téléchargez la dernière version du fichier **`.dmg`** (Mac Apple Silicon).
3. Ouvrez le fichier `.dmg` et glissez **Starlight** dans votre dossier **Applications**.

> **Application non signée :** Starlight n'est pas signée avec un certificat Apple. Si macOS bloque la première ouverture, allez dans **Réglages Système → Confidentialité et sécurité**, puis cliquez sur **Ouvrir quand même**. macOS peut aussi demander l'accès au Trousseau après une mise à jour.




## 🛠️ Compiler depuis les sources

Prérequis : [Node.js](https://nodejs.org), [Rust](https://rustup.rs) et les [dépendances Tauri](https://tauri.app/start/prerequisites/).

```bash
npm install
npm run tauri build
```




## 📄 Licence

Distribué sous licence [MIT](LICENSE).
