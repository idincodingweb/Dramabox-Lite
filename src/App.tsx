import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { setupGlobalClickSound } from "@/lib/utils";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/Home";
import { DramaPage } from "./pages/Drama";
import { ProfilePage } from "./pages/Profile";
import { SettingsPage } from "./pages/Settings";
import { AuthPage } from "./pages/Auth";
import { PopularPage } from "./pages/Popular";
import { LibraryPage } from "./pages/Library";
import { SearchPage } from "./pages/Search";
import { WalletPage } from "./pages/Wallet";
import { VipPage } from "./pages/Vip";
import { Toaster } from "sonner";

export default function App() {
  useEffect(() => {
    setupGlobalClickSound();
  }, []);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/drama/:id" element={<DramaPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/popular" element={<PopularPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/vip" element={<VipPage />} />
        </Routes>
      </Layout>
      <Toaster position="top-center" theme="dark" />
    </BrowserRouter>
  );
}

