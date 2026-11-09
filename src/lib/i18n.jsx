import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { readPref, writePref } from '@/lib/prefs';

const translations = {
  en: {
    home: 'Home', vault: 'Vault', switchView: 'Switch view', switchLanguage: 'Change language',
    lightMode: 'Switch to light mode', darkMode: 'Switch to dark mode',
    landingBadge: 'Save and organize every link you keep',
    landingTitle: 'Transform links into structured knowledge.',
    landingDescription: 'Paste any Instagram Reel, GitHub repository or web link. Starlight reads it, extracts the summary, code snippets and tags, then files it neatly into your vault.',
    pasteLink: 'Paste a full link — a Reel, a repository or an article.',
    voiceUnsupported: 'Voice input is not supported in this browser.',
    inputPlaceholder: 'Paste an Instagram Reel, GitHub URL, or any web link...',
    inputLabel: 'Paste an Instagram Reel, GitHub URL, or any web link', pasteClipboard: 'Paste a link from the clipboard',
    stopListening: 'Stop listening', dictate: 'Dictate a link', processLink: 'Process link',
    modelLocal: 'Local cataloguing', modelHint: 'No AI service configured',
    modelAi: 'AI · {model}',
    aiBannerFast: 'Fast algorithm mode active (free & local).',
    aiBannerAddKey: 'Add an AI API key',
    aiBannerAddKeySuffix: 'to unlock advanced AI summaries.',
    aiModeActive: 'AI mode active ({provider})',
    aiSettingsTitle: 'AI provider',
    aiSettingsBody: 'Pick your model and paste your key to generate smarter summaries.',
    aiProviderSection: 'MODEL & PROVIDER',
    aiApiKey: 'API key', aiApiKeyPlaceholder: 'Paste your API key',
    aiKeyHint: 'Your key is stored locally on this Mac (localStorage) and is only sent to the selected official API.',
    aiSaveKey: 'Save settings', aiRemoveKey: 'Remove key',
    aiGetKey: 'Get a free {provider} API key',
    aiRecommended: 'Recommended',
    ollamaChecking: 'Checking the local server…',
    ollamaDetected: 'Detected locally',
    ollamaMissing: 'Ollama not detected on port 11434',
    ollamaHint: 'No key needed — the model runs on your Mac.',
    ollamaRecheck: 'Check again',
    aiKeySaved: 'AI key saved.', aiKeyRemoved: 'AI key removed.', aiKeyRequired: 'Enter an API key first.',
    settings: 'Settings', settingsGeneral: 'General', settingsAi: 'AI & API keys', settingsAppearance: 'Appearance',
    settingsLaunchTitle: 'Startup', settingsLaunchLabel: 'Launch Starlight when your Mac starts up',
    settingsLaunchBody: 'Adds Starlight to your macOS login items so it is ready when you are.',
    settingsLaunchUnavailable: 'Only available in the macOS app.',
    settingsLanguageTitle: 'Language', settingsLanguageBody: 'Menus, labels and AI summaries.',
    settingsAppearanceTitle: 'Theme', settingsAppearanceBody: 'Choose how Starlight looks.',
    themeLight: 'Light', themeDark: 'Dark', themeSystem: 'System (Auto)',
    themeLightHint: 'Warm terracotta', themeDarkHint: 'Dark stone', themeSystemHint: 'Follows macOS',
    aiStatusTitle: 'Active provider', aiStatusConnected: 'Connected',
    aiStatusNative: 'Native algorithm mode active (free & local)',
    aiStatusNativeBody: 'No key needed — links are categorised on your Mac.',
    aiActiveProvider: 'Active provider: {provider}',
    aiTestConnection: 'Test connection', aiTesting: 'Testing…',
    aiTestOk: 'Connection successful ({ms} ms).', aiTestFail: 'Connection failed: {message}',
    aiTestHint: 'Sends a minimal request to the selected API to validate your key.',
    aiDisconnect: 'Disconnect key', aiNoKey: 'No key saved yet.',
    duplicateTitle: 'This link is already in your vault.',
    duplicateQuestion: 'Do you want to add it again anyway?',
    duplicateCancel: 'Cancel', duplicateAdd: 'Add anyway',
    added: 'Added “{title}” to {category}.', processError: 'That link could not be processed. Try again.',
    invalidUrl: 'That does not look like a valid link. Paste a full URL (https://…).',
    aiFallbackInvalidKey: 'Invalid API key — switching to the native algorithm.',
    copied: 'Copied to clipboard.', copyError: 'Could not copy — open the original instead.', deleted: '“{title}” deleted.',
    savedLink: 'saved link', savedLinks: 'saved links', favorite: 'favorite', favorites: 'favorites',
    searchVault: 'Search the vault…', searchLinks: 'Search saved links', addLink: 'Add link',
    clearSearch: 'Clear search', showAll: 'Show all links',
    tabAll: 'All', tabGithub: 'GitHub Repos', tabInstagram: 'Reels', tabWeb: 'Articles', tabStarred: 'Favorites',
    emptySearchTitle: 'Nothing matches that yet', emptySearchBody: 'Try a shorter phrase, or clear the filters to see your whole vault.',
    emptyFilterTitle: 'This shelf is empty', emptyFilterBody: 'No saved links live in this view yet. Paste a link on the Home screen to start filling it.',
    emptyTitle: 'Your vault is waiting', emptyBody: 'Paste an Instagram Reel, GitHub repo or article on the Home screen — it gets summarised, tagged and filed automatically.',
    resetFilters: 'Reset filters', toggleStar: 'Toggle favorite', itemActions: 'Item actions',
    openOriginal: 'Open original', copyLink: 'Copy link', removeStar: 'Remove favorite', starItem: 'Add favorite', delete: 'Delete',
    saved: 'Saved', aiSummary: 'Summary', takeaways: 'Key takeaways', extractedCode: 'Extracted code', repositorySignal: 'Repository details',
    stars: 'stars', audioSummary: 'Audio transcript summary', pageSummary: 'Page summary', tags: 'Tags', copy: 'Copy', deleteItem: 'Delete item',
    close: 'Close', copySnippet: 'Copy snippet',
    repoChatTitle: 'Ask about this link',
    repoChatEmpty: 'Ask how it works, how to install it, or what it actually does.',
    repoChatPlaceholder: 'Ask a question about this link…',
    repoChatSend: 'Send question', repoChatClear: 'Clear conversation',
    repoChatThinking: 'Thinking…',
    repoChatScope: 'Answers use this link only and stay in this panel.',
    repoChatErrorNoAi: 'Add an API key in Settings to ask the AI about this link.',
    repoChatErrorNetwork: 'Could not reach the AI provider. Check your connection or pick another provider in Settings.',
    repoChatErrorModel: 'This AI model is no longer available. Pick another provider in Settings.',
    repoChatErrorInvalidKey: 'Invalid API key — check your AI settings.',
    repoChatErrorTimeout: 'The AI took too long to answer. Try again.',
    repoChatErrorGeneral: 'The AI could not answer. Try again.',
    stageUrl: 'Reading link', stageContent: 'Extracting content', stageSummary: 'Preparing summary', stageSave: 'Saving to your vault',
    categoryAll: 'All', categoryGithub: 'Repositories', categoryInstagram: 'Reels & Posts', categoryArticle: 'Articles & Web', categoryCode: 'Snippets',
    fallbackReel: 'A saved Reel from {host}; it is ready for you to revisit.', fallbackLink: 'Saved from {host}; this link is ready for you to revisit.',
  },
  fr: {
    home: 'Accueil', vault: 'Coffre', switchView: 'Changer de vue', switchLanguage: 'Changer de langue',
    lightMode: 'Passer au thème clair', darkMode: 'Passer au thème sombre',
    landingBadge: 'Enregistrez et organisez les liens que vous gardez',
    landingTitle: 'Transformez vos liens en connaissances organisées.',
    landingDescription: 'Collez un Reel Instagram, un dépôt GitHub ou un lien web. Starlight prépare un résumé, extrait les extraits de code et les tags, puis range le tout dans votre coffre.',
    pasteLink: 'Collez un lien complet : Reel, dépôt ou article.',
    voiceUnsupported: 'La saisie vocale n’est pas prise en charge par ce navigateur.',
    inputPlaceholder: 'Collez un Reel Instagram, un lien GitHub ou un lien web…',
    inputLabel: 'Collez un Reel Instagram, une URL GitHub ou un lien web', pasteClipboard: 'Coller un lien depuis le presse-papiers',
    stopListening: 'Arrêter l’écoute', dictate: 'Dicter un lien', processLink: 'Traiter le lien',
    modelLocal: 'Classement local', modelHint: 'Aucun service IA configuré',
    modelAi: 'IA · {model}',
    aiBannerFast: 'Mode Algorithme rapide actif (gratuit & local).',
    aiBannerAddKey: 'Ajouter une clé API IA',
    aiBannerAddKeySuffix: 'pour activer les résumés avancés par IA.',
    aiModeActive: 'Mode IA actif ({provider})',
    aiSettingsTitle: 'Fournisseur d’IA',
    aiSettingsBody: 'Choisissez votre modèle et renseignez votre clé pour générer des résumés intelligents.',
    aiProviderSection: 'MODÈLE & FOURNISSEUR',
    aiApiKey: 'Clé API', aiApiKeyPlaceholder: 'Collez votre clé API',
    aiKeyHint: 'Votre clé est stockée localement en toute sécurité sur votre Mac (localStorage) et n’est transmise qu’à l’API officielle sélectionnée.',
    aiSaveKey: 'Enregistrer les paramètres', aiRemoveKey: 'Supprimer la clé',
    aiGetKey: 'Obtenir une clé API gratuite {provider}',
    ollamaChecking: 'Vérification du serveur local…',
    ollamaDetected: 'Détecté en local',
    ollamaMissing: 'Ollama non détecté sur le port 11434',
    ollamaHint: 'Aucune clé requise — le modèle s’exécute sur votre Mac.',
    ollamaRecheck: 'Vérifier à nouveau',
    aiKeySaved: 'Clé IA enregistrée.', aiKeyRemoved: 'Clé IA supprimée.', aiKeyRequired: 'Renseignez d’abord une clé API.',
    settings: 'Paramètres', settingsGeneral: 'Général', settingsAi: 'IA & Clés API', settingsAppearance: 'Apparence',
    settingsLaunchTitle: 'Lancement', settingsLaunchLabel: 'Lancer Starlight au démarrage du Mac',
    settingsLaunchBody: 'Ajoute Starlight aux éléments d’ouverture de session macOS pour qu’il soit prêt quand vous l’êtes.',
    settingsLaunchUnavailable: 'Disponible uniquement dans l’app macOS.',
    settingsLanguageTitle: 'Langue', settingsLanguageBody: 'Menus, libellés et résumés IA.',
    settingsAppearanceTitle: 'Thème', settingsAppearanceBody: 'Choisissez l’apparence de Starlight.',
    themeLight: 'Clair', themeDark: 'Sombre', themeSystem: 'Système (Auto)',
    themeLightHint: 'Terracotta chaleureux', themeDarkHint: 'Pierre sombre', themeSystemHint: 'Suit macOS',
    aiStatusTitle: 'Fournisseur actif', aiStatusConnected: 'Connecté',
    aiStatusNative: 'Mode Algorithme natif actif (Gratuit & Local)',
    aiStatusNativeBody: 'Aucune clé requise — les liens sont classés sur votre Mac.',
    aiActiveProvider: 'Fournisseur actif : {provider}',
    aiTestConnection: 'Tester la connexion', aiTesting: 'Test en cours…',
    aiTestOk: 'Connexion réussie ({ms} ms).', aiTestFail: 'Échec de la connexion : {message}',
    aiTestHint: 'Envoie une requête minimale à l’API choisie pour valider la clé.',
    aiDisconnect: 'Déconnecter la clé', aiNoKey: 'Aucune clé enregistrée.',
    duplicateTitle: 'Ce lien existe déjà dans votre Coffre.',
    duplicateQuestion: 'Voulez-vous quand même l’ajouter à nouveau ?',
    duplicateCancel: 'Annuler', duplicateAdd: 'Ajouter quand même',
    added: '« {title} » ajouté à {category}.', processError: 'Impossible de traiter ce lien. Réessayez.',
    invalidUrl: 'Ce lien n’est pas valide. Collez une URL complète (https://…).',
    aiFallbackInvalidKey: 'Clé API invalide — bascule sur l’algorithme natif.',
    copied: 'Lien copié dans le presse-papiers.', copyError: 'Copie impossible — ouvrez le lien original.', deleted: '« {title} » supprimé.',
    savedLink: 'lien enregistré', savedLinks: 'liens enregistrés', favorite: 'favori', favorites: 'favoris',
    searchVault: 'Rechercher dans le coffre…', searchLinks: 'Rechercher des liens enregistrés', addLink: 'Ajouter un lien',
    clearSearch: 'Effacer la recherche', showAll: 'Afficher tous les liens',
    tabAll: 'Tout', tabGithub: 'Dépôts GitHub', tabInstagram: 'Reels', tabWeb: 'Articles', tabStarred: 'Favoris',
    emptySearchTitle: 'Aucun résultat', emptySearchBody: 'Essayez une recherche plus courte ou retirez les filtres pour voir tout le coffre.',
    emptyFilterTitle: 'Cette section est vide', emptyFilterBody: 'Aucun lien enregistré ici. Collez un lien sur l’accueil pour commencer.',
    emptyTitle: 'Votre coffre vous attend', emptyBody: 'Collez un Reel Instagram, un dépôt GitHub ou un article sur l’accueil : il sera résumé, étiqueté et classé automatiquement.',
    resetFilters: 'Réinitialiser les filtres', toggleStar: 'Ajouter ou retirer des favoris', itemActions: 'Actions du lien',
    openOriginal: 'Ouvrir le lien original', copyLink: 'Copier le lien', removeStar: 'Retirer des favoris', starItem: 'Ajouter aux favoris', delete: 'Supprimer',
    saved: 'Enregistré', aiSummary: 'Résumé', takeaways: 'Points clés', extractedCode: 'Extrait de code', repositorySignal: 'Détails du dépôt',
    stars: 'étoiles', audioSummary: 'Résumé de la transcription audio', pageSummary: 'Résumé de la page', tags: 'Étiquettes', copy: 'Copier', deleteItem: 'Supprimer le lien',
    close: 'Fermer', copySnippet: 'Copier l’extrait de code',
    repoChatTitle: 'Questions sur ce lien',
    repoChatEmpty: 'Demandez comment il fonctionne, comment l’installer ou ce qu’il fait vraiment.',
    repoChatPlaceholder: 'Posez une question sur ce lien…',
    repoChatSend: 'Envoyer la question', repoChatClear: 'Effacer la conversation',
    repoChatThinking: 'Réflexion…',
    repoChatScope: 'Les réponses ne portent que sur ce lien et restent dans ce panneau.',
    repoChatErrorNoAi: 'Ajoutez une clé API dans les Paramètres pour poser des questions à l’IA sur ce lien.',
    repoChatErrorNetwork: 'Impossible de joindre le fournisseur IA. Vérifiez votre connexion ou changez de fournisseur dans les Paramètres.',
    repoChatErrorModel: 'Ce modèle IA n’est plus disponible. Changez de fournisseur dans les Paramètres.',
    repoChatErrorInvalidKey: 'Clé API invalide — vérifiez vos paramètres IA.',
    repoChatErrorTimeout: 'L’IA met trop de temps à répondre. Réessayez.',
    repoChatErrorGeneral: 'L’IA n’a pas pu répondre. Réessayez.',
    stageUrl: 'Analyse du lien', stageContent: 'Extraction du contenu', stageSummary: 'Préparation du résumé', stageSave: 'Enregistrement dans le coffre',
    categoryAll: 'Tout', categoryGithub: 'Dépôts', categoryInstagram: 'Reels et publications', categoryArticle: 'Articles et Web', categoryCode: 'Extraits de code',
    fallbackReel: 'Reel enregistré depuis {host}, prêt à être consulté à nouveau.', fallbackLink: 'Lien enregistré depuis {host}, prêt à être consulté à nouveau.',
  },
};

export function translate(language, key, values = {}) {
  const table = translations[language] || translations.en;
  return (table[key] || translations.en[key] || key)
    .replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      return readPref('language', 'en') === 'fr' ? 'fr' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: (next) => {
      setLanguage(next);
      writePref('language', next);
    },
    t: (key, values = {}) => translate(language, key, values),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
