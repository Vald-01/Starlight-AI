# 🔖 LinkVault AI

> **Transformez vos liens en connaissances structurées, synthétisées et toujours organisées.**

**LinkVault AI** est une application macOS native, ultra-rapide et respectueuse de votre vie privée. Elle vous permet de capturer, résumer et classer en un instant vos dépôts GitHub, articles web, snippets de code et contenus sociaux (Instagram Reels, etc.).

---

## ✨ Fonctionnalités Clés

- ⚡ **Mode Hybride (0 Setup requis) :**
  - **Algorithme Natif (Gratuit & 100% Local) :** Ajoutez des liens instantanément dès le premier lancement. L'application extrait automatiquement les titres, langages, étoiles GitHub et métadonnées sans nécessiter la moindre clé API.
  - **Mode IA Avancé (BYOK - *Bring Your Own Key*) :** Activez la puissance des LLM pour obtenir des résumés synthétiques et un marquage par tags ultra-précis.

- 🤖 **Support Multi-Fournisseurs IA :**
  - **Groq** (Llama 3.3 70B — *Recommandé / Gratuit*)
  - **OpenAI** (GPT-4o mini)
  - **Anthropic** (Claude 3.5 Sonnet / Haiku)
  - **Google Gemini** (Gemini 1.5 Flash)
  - **Microsoft Copilot** / GitHub Models
  - **Ollama** (Modèles locaux 100% hors-ligne via `localhost:11434`)

- 🎨 **Mise en Page 100% Homogène :**
  - Grâce à l'imposition de schémas JSON stricts (*Structured Outputs*), chaque carte générée conserve une structure visuelle identique et épurée (style Terracotta / Warm Neutral).

- 🍏 **Expérience macOS Native & Légère :**
  - Développée avec **Tauri v2**, **React** et **Tailwind CSS** pour une empreinte mémoire minimale et une réactivité instantanée.
  - Raccourcis natifs : `Cmd + ,` pour les Paramètres, `Cmd + N` pour la barre de saisie, `Échap` pour fermer les fenêtres.
  - Prise en charge du thème macOS (Clair / Sombre / Automatique).
  - Option de lancement automatique au démarrage du Mac.

- 🛡️ **Gestion des Doublons & Confidentialité :**
  - Détection intelligente des URLs déjà enregistrées avec dialogue de confirmation.
  - Vos clés API restent stockées en toute sécurité sur votre machine (`localStorage`) et ne sont transmises qu'aux endpoints officiels des services configurés.

---

## 📦 Téléchargement & Installation

1. Rendez-vous dans la section **[Releases](../../releases)** du dépôt.
2. Téléchargez la dernière version du fichier **`.dmg`** (ex: `LinkVault AI_1.0.0_aarch64.dmg`).
3. Ouvrez le fichier `.dmg` et glissez **LinkVault AI** dans votre dossier **Applications**.
