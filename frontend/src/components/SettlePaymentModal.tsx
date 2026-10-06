import React, { useState } from "react";
import { recordSettlementPayment } from "../api/settlementApi";
import { useAuth } from "../context/AuthContext";
import { X, Send, AlertCircle, CheckCircle2, Wallet, ArrowRight } from "lucide-react";

interface SettlePaymentModalProps {
  groupId: string;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
  suggestedAmount: number;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export default function SettlePaymentModal({
  groupId,
  toUserId,
  toUserName,
  suggestedAmount,
  onClose,
  onPaymentComplete,
}: SettlePaymentModalProps) {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState<string>(suggestedAmount.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const walletBalance = Number(user?.wallet?.balance ?? 0);
  const numAmount = Number(amount) || 0;
  const isInsufficient = numAmount > walletBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!numAmount || numAmount <= 0) {
      setError("Payment amount must be greater than 0");
      return;
    }

    if (isInsufficient) {
      setError("Insufficient wallet balance. Please top up your wallet first.");
      return;
    }

    setLoading(true);
    try {
      await recordSettlementPayment(groupId, toUserId, numAmount);
      setSuccess(`Successfully settled ₹${numAmount} with ${toUserName}!`);
      await refreshUser();
      onPaymentComplete();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to complete settlement payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200/80 p-6 text-slate-800 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Smart Settlement Payment</h3>
              <p className="text-xs text-slate-500">Direct wallet-to-wallet transfer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Transfer Visual */}
        <div className="mt-4 flex items-center justify-between bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">From You</span>
            <p className="text-xs font-bold text-slate-900 truncate max-w-[110px]">{user?.name}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full text-emerald-800 border border-emerald-200/60">
            <span className="text-xs font-black text-emerald-700">₹{numAmount}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">To Receiver</span>
            <p className="text-xs font-bold text-slate-900 truncate max-w-[110px]">{toUserName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Payment Amount (₹)
              </label>
              <span className="text-[11px] text-slate-500">
                Suggested max: <strong className="text-slate-900">₹{suggestedAmount}</strong>
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                min="0.01"
                max={suggestedAmount}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-200/90 py-2.5 pl-8 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
            <span className="flex items-center gap-1.5 text-slate-600">
              <Wallet className="h-4 w-4 text-emerald-600" />
              Your Balance:
            </span>
            <span className={`font-black ${isInsufficient ? "text-rose-700" : "text-emerald-700"}`}>
              ₹{walletBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInsufficient}
              className="w-1/2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
            >
              {loading ? "Processing..." : `Pay ₹${numAmount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
