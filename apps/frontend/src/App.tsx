import { BrowserRouter, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import CreateRafflePage from "./pages/CreateRaffle";
import HomePage from "./pages/Home";
import LoginPage from "./pages/Login";
import NotFoundPage from "./pages/NotFound";
import ProfilePage from "./pages/Profile";
import PurchasesPage from "./pages/Purchases";
import RaffleDetailPage from "./pages/RaffleDetail";
import RegisterPage from "./pages/Register";
import SellRafflesPage from "./pages/SellRaffles";
import WalletPage from "./pages/Wallet";

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateRafflePage />} />
            <Route path="/raffles/:raffleId" element={<RaffleDetailPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/sell/raffles" element={<SellRafflesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AppProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
