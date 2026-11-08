import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from './components/ScrollToTop';
import AppShortcuts from '@/components/AppShortcuts';
import SettingsModal from '@/components/SettingsModal';
import Landing from './pages/Landing';
import Vault from './pages/Vault';
import { LanguageProvider } from '@/lib/i18n';
import '@/lib/useTheme';

export default function App() {
  return (
    <LanguageProvider>
      <Router>
        <ScrollToTop />
        <AppShortcuts />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="*" element={<Landing />} />
        </Routes>
        <SettingsModal />
        <Toaster />
      </Router>
    </LanguageProvider>
  );
}
