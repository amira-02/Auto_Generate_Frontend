// src/components/DashboardSection/Accounts/ConnectedAccountsView.tsx
import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrash2, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiLink } from "react-icons/fi";
import { AuthContext } from "../../../hooks/AuthContext";

const API_BASE = "https://localhost:7079";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", color: "#0077b5", icon: "💼", bg: "#e8f4fb" },
  { id: "twitter", label: "Twitter / X", color: "#1da1f2", icon: "𝕏", bg: "#e8f6fe" },
  { id: "instagram", label: "Instagram", color: "#e1306c", icon: "📸", bg: "#fce8ef" },
  { id: "facebook", label: "Facebook", color: "#1877f2", icon: "f", bg: "#e8f0fd" },
  { id: "tiktok", label: "TikTok", color: "#000", icon: "🎵", bg: "#f0f0f0" },
  { id: "threads", label: "Threads", color: "#000", icon: "🧵", bg: "#f0f0f0" },
];

type Account = {
  id: number;
  platform: string;
  username: string;
  avatar?: string;
  connectedAt: string;
  status: "connected" | "error" | "expired";
  lastSync?: string;
  accessTokenExpiresAt?: string;
};

export default function ConnectedAccountsView() {
  const { token } = useContext(AuthContext);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch connected accounts
  const fetchAccounts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load accounts");
      const data = await res.json();
      setAccounts(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token]);

  // Connect new account (starts OAuth flow)
  const connectAccount = async (platform: string) => {
    setConnecting(platform);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/connect/${platform}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Connection failed");
      
      const { authUrl } = await res.json();
      // Redirect to OAuth
      window.location.href = authUrl;
      
    } catch (err: any) {
      alert("Erreur de connexion : " + err.message);
    } finally {
      setConnecting(null);
    }
  };

  // Disconnect account
  const disconnectAccount = async (id: number) => {
    if (!confirm("Voulez-vous vraiment déconnecter ce compte ?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/accounts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setAccounts(accounts.filter(a => a.id !== id));
      } else {
        alert("Impossible de déconnecter");
      }
    } catch (err) {
      alert("Erreur lors de la déconnexion");
    }
  };

  const reconnect = (platform: string) => {
    connectAccount(platform);
  };

  if (loading) {
    return <div className="text-center py-20">Chargement des comptes...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Comptes Connectés</h1>
          <p className="text-gray-500 mt-2">Gérez vos connexions sociales</p>
        </div>

        <button
          onClick={() => alert("Choisissez une plateforme ci-dessous")}
          className="flex items-center gap-3 bg-black text-white px-6 py-3.5 rounded-2xl hover:bg-gray-800 transition font-medium"
        >
          <FiPlus size={20} />
          Ajouter un compte
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLATFORMS.map((plat) => {
          const account = accounts.find(a => a.platform === plat.id);

          return (
            <motion.div
              key={plat.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: plat.bg }}
                  >
                    {plat.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl">{plat.label}</h3>
                    {account ? (
                      <p className="text-sm text-gray-600 font-medium">{account.username}</p>
                    ) : (
                      <p className="text-sm text-gray-400">Non connecté</p>
                    )}
                  </div>
                </div>

                {account ? (
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium justify-end">
                      <FiCheckCircle /> Connecté
                    </div>
                    <button
                      onClick={() => disconnectAccount(account.id)}
                      className="text-red-500 hover:text-red-700 text-sm mt-2 flex items-center gap-1"
                    >
                      <FiTrash2 /> Déconnecter
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => connectAccount(plat.id)}
                    disabled={connecting === plat.id}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-2xl transition flex items-center gap-2"
                  >
                    {connecting === plat.id ? "Connexion..." : "Connecter"}
                    <FiLink />
                  </button>
                )}
              </div>

              {account && (
                <div className="mt-6 pt-5 border-t text-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Connecté le</span>
                    <span>{new Date(account.connectedAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {account.lastSync && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dernière synchro</span>
                      <span>{account.lastSync}</span>
                    </div>
                  )}
                  {account.status === "error" && (
                    <button
                      onClick={() => reconnect(plat.id)}
                      className="w-full mt-4 bg-orange-100 hover:bg-orange-200 text-orange-700 py-3 rounded-2xl flex items-center justify-center gap-2 transition"
                    >
                      <FiRefreshCw /> Reconnecter
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}