import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import TopUpModal from "../components/TopUpModal";
import { getWalletTransactions } from "../api/walletApi";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Gift, AlertCircle, RefreshCw } from "lucide-react";

interface Transaction {
  id: string;
  amount: string | number;
  type: "INITIAL_CREDIT" | "CREDIT" | "DEBIT";
  reason: string;
  createdAt: string;
  relatedUser?: {
    name: string;
    email: string;
  } | null;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<{ id: string; balance: string | number } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");

  const loadTransactions = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await getWalletTransactions();
      setWallet(res.wallet);
      setTransactions(res.transactions || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load wallet transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const balanceNum = Number(wallet?.balance ?? 0);

  const filteredTransactions = transactions.filter((t) => {
    if (filter === "ALL") return true;
    if (filter === "CREDIT") return t.type === "CREDIT" || t.type === "INITIAL_CREDIT";
    if (filter === "DEBIT") return t.type === "DEBIT";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans pb-16">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Demo Wallet</h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your balance and review real-time settlement transfer history
            </p>
          </div>

          <button
            onClick={() => setShowTopUp(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 text-xs transition shadow-md shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" /> Top Up Wallet
          </button>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 border border-emerald-600/60 p-6 sm:p-8 shadow-lg text-white mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-200 uppercase tracking-wider mb-2">
                <Wallet className="h-4 w-4" />
                <span>Available Balance</span>
              </div>
              <p className="text-4xl sm:text-5xl font-black tracking-tight">
                ₹{balanceNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-emerald-100/90 mt-2">
                Used to instantly settle group debts with peer members.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2 min-w-[200px]">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-100">Total Transactions:</span>
                <span className="font-bold text-white">{transactions.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-100">Status:</span>
                <span className="font-bold text-emerald-200 flex items-center gap-1">
                  Active Demo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Transactions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
              <button
                onClick={() => setFilter("ALL")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filter === "ALL"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({transactions.length})
              </button>

              <button
                onClick={() => setFilter("CREDIT")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filter === "CREDIT"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Credits
              </button>

              <button
                onClick={() => setFilter("DEBIT")}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filter === "DEBIT"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Debits
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
              <Wallet className="mx-auto h-10 w-10 text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-800">No transactions found</p>
              <p className="text-xs text-slate-500 mt-1">
                Your wallet transactions and settlement logs will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const isDebit = tx.type === "DEBIT";
                const isInitial = tx.type === "INITIAL_CREDIT";
                const dateStr = new Date(tx.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 flex items-center justify-between hover:border-slate-300 transition shadow-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold border ${
                          isDebit
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : isInitial
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {isDebit ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : isInitial ? (
                          <Gift className="h-5 w-5" />
                        ) : (
                          <ArrowDownLeft className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{tx.reason}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{dateStr}</span>
                          {tx.relatedUser && (
                            <>
                              <span>•</span>
                              <span className="text-slate-700 font-medium">{tx.relatedUser.name}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-base font-black ${
                          isDebit ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
                        {isDebit ? "-" : "+"}₹
                        {Number(tx.amount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {tx.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showTopUp && (
        <TopUpModal
          onClose={() => {
            setShowTopUp(false);
            loadTransactions();
          }}
        />
      )}
    </div>
  );
}
