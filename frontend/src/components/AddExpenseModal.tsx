import React, { useState } from "react";
import { createExpense } from "../api/expenseApi";
import { X, Receipt, Check, AlertCircle, CheckCircle2 } from "lucide-react";

interface Member {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface AddExpenseModalProps {
  groupId: string;
  members: Member[];
  onClose: () => void;
  onExpenseAdded: () => void;
}

export default function AddExpenseModal({
  groupId,
  members,
  onClose,
  onExpenseAdded,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    members.map((m) => m.user.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    setSelectedParticipants(members.map((m) => m.user.id));
  };

  const deselectAll = () => {
    setSelectedParticipants([]);
  };

  const numAmount = Number(amount) || 0;
  const splitCount = selectedParticipants.length;
  const perPersonShare = splitCount > 0 ? (numAmount / splitCount).toFixed(2) : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!description.trim()) {
      setError("Please provide a description");
      return;
    }

    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (selectedParticipants.length === 0) {
      setError("Select at least one participant to split the expense with");
      return;
    }

    setLoading(true);
    try {
      await createExpense(groupId, {
        description: description.trim(),
        amount: numAmount,
        participantIds: selectedParticipants,
      });

      setSuccess("Expense added successfully!");
      onExpenseAdded();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200/80 p-6 text-slate-800 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/60">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Add New Expense</h3>
              <p className="text-xs text-slate-500">Equal split among selected members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / What was this for?
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner at Taj, Uber to airport"
              required
              className="w-full rounded-xl bg-slate-50 border border-slate-200/90 py-2.5 px-3.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Total Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full rounded-xl bg-slate-50 border border-slate-200/90 py-2.5 pl-8 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600 transition"
              />
            </div>
          </div>

          {/* Participant Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                Split With ({selectedParticipants.length} selected)
              </label>
              <div className="flex gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-teal-700 font-bold hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-slate-500 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-2.5 scrollbar-thin">
              {members.map((m) => {
                const isSelected = selectedParticipants.includes(m.user.id);
                return (
                  <button
                    type="button"
                    key={m.user.id}
                    onClick={() => toggleParticipant(m.user.id)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs transition ${
                      isSelected
                        ? "bg-teal-50 text-teal-800 border border-teal-200/80 font-bold"
                        : "bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-100/80"
                    }`}
                  >
                    <span className="truncate pr-2">
                      {m.user.name} <span className="text-slate-400 text-[10px]">({m.user.email})</span>
                    </span>
                    <div
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition ${
                        isSelected
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Summary Banner */}
          {numAmount > 0 && splitCount > 0 && (
            <div className="rounded-2xl bg-teal-50 border border-teal-200/80 p-3.5 text-xs text-teal-800 flex items-center justify-between">
              <span>Each person pays:</span>
              <span className="font-black text-sm text-teal-700">₹{perPersonShare}</span>
            </div>
          )}

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
              disabled={loading}
              className="w-1/2 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition disabled:opacity-50 shadow-md shadow-teal-600/20"
            >
              {loading ? "Creating..." : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
