/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Server Address Webhook
 * Purpose: Mengelola daftar alamat server berbasis webhook Discord tanpa database.
 */

import { useEffect, useMemo, useState } from "react";
import paskusLogo from "../assets/paskus.webp";
import { useAuth } from "../lib/strategicAuth";
import {
  createStrategicServerAddressWebhook,
  deleteStrategicServerAddressWebhook,
  updateStrategicServerAddressWebhook,
} from "../lib/strategicApi";

const STATUS_OPTIONS = ["Active", "In Active"];
const STORAGE_PREFIX = "strategic-p791.server-address-cards.v1";
const WEBHOOK_SECURITY_LABEL = "Dikelola aman di backend";
const INITIAL_FORM_STATE = {
  serverAddress: "",
  status: "Active",
};

function normalizeStatus(status) {
  return String(status || "").toLowerCase().trim() === "in active"
    ? "In Active"
    : "Active";
}

function normalizeCardEntry(entry, index) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const serverAddress = String(entry.serverAddress || "").trim();

  if (!serverAddress) {
    return null;
  }

  const createdAt =
    typeof entry.createdAt === "string" && entry.createdAt
      ? entry.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof entry.updatedAt === "string" && entry.updatedAt
      ? entry.updatedAt
      : createdAt;

  return {
    id: entry.id || `server-address-${index}`,
    serverAddress,
    status: normalizeStatus(entry.status),
    webhookUrl: WEBHOOK_SECURITY_LABEL,
    messageId: String(entry.messageId || "").trim(),
    createdAt,
    updatedAt,
  };
}

function readStoredCards(storageKey) {
  if (typeof window === "undefined" || !storageKey) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue)
      ? parsedValue.map((entry, index) => normalizeCardEntry(entry, index)).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function saveCardsToStorage(storageKey, cards) {
  if (typeof window === "undefined" || !storageKey) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(cards));
}

function createCardId() {
  return `server-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatCardTimestamp(isoString) {
  const dateValue = new Date(isoString);

  if (Number.isNaN(dateValue.getTime())) {
    return "Unknown";
  }

  return dateValue.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ServerAddressEditor({
  open,
  mode,
  formState,
  onChange,
  onClose,
  onSubmit,
  error,
  submitting,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[280] flex items-center justify-center bg-black/72 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl rounded-[30px] border border-white/8 bg-[#111618]/92 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.46)] backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.28em] text-lime-300/80">
              Administrasi Paskus
            </p>
            <h3 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
              {mode === "edit" ? "Edit Alamat Server" : "Tambah Alamat Server"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 font-public text-[10px] uppercase tracking-[0.18em] text-stone-300 transition hover:bg-white/[0.08]"
          >
            Tutup
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Alamat Server
            </span>
            <input
              autoFocus
              value={formState.serverAddress}
              onChange={(event) => onChange("serverAddress", event.target.value)}
              placeholder="Contoh: aab2e760-2e56-45e2-8d73-43574855d523"
              className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/30"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Status Server
            </span>
            <select
              value={formState.status}
              onChange={(event) => onChange("status", event.target.value)}
              className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/30"
            >
              {STATUS_OPTIONS.map((statusOption) => (
                <option key={statusOption} value={statusOption} className="bg-[#0c1113]">
                  {statusOption}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Discord Webhook
            </span>
            <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-300">
              <p className="font-mono">{WEBHOOK_SECURITY_LABEL}</p>
            </div>
          </label>

          {error ? (
            <p className="font-public text-[10px] uppercase tracking-[0.16em] text-rose-300">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-full font-public text-[10px] uppercase tracking-[0.16em] text-stone-500 sm:max-w-[68%]">
            Embed webhook dikirim sebagai Administrasi Paskus dengan format alamat dan status.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full border border-lime-300/20 bg-lime-300 px-5 py-2.5 font-public text-[10px] font-bold uppercase tracking-[0.2em] text-[#0a100e] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting ? "Processing..." : mode === "edit" ? "Simpan Edit" : "Tambah & Kirim"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function StrategicServerAddressesPage() {
  const { user } = useAuth();
  const storageKey = useMemo(
    () => `${STORAGE_PREFIX}.${String(user?.username || "guest").toLowerCase()}`,
    [user?.username],
  );
  const [cards, setCards] = useState([]);
  const [editorMode, setEditorMode] = useState("create");
  const [editingCardId, setEditingCardId] = useState("");
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [editorOpen, setEditorOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyCardId, setBusyCardId] = useState("");

  useEffect(() => {
    setCards(readStoredCards(storageKey));
  }, [storageKey]);

  useEffect(() => {
    saveCardsToStorage(storageKey, cards);
  }, [cards, storageKey]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const orderedCards = useMemo(
    () =>
      [...cards].sort(
        (firstCard, secondCard) =>
          new Date(secondCard.updatedAt).getTime() - new Date(firstCard.updatedAt).getTime(),
      ),
    [cards],
  );

  const openCreateEditor = () => {
    setEditorMode("create");
    setEditingCardId("");
    setFormState(INITIAL_FORM_STATE);
    setSubmitError("");
    setEditorOpen(true);
  };

  const openEditEditor = (card) => {
    setEditorMode("edit");
    setEditingCardId(card.id);
    setFormState({
      serverAddress: card.serverAddress,
      status: normalizeStatus(card.status),
    });
    setSubmitError("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (submitting) {
      return;
    }

    setEditorOpen(false);
    setSubmitError("");
    setFormState(INITIAL_FORM_STATE);
    setEditingCardId("");
  };

  const handleFormChange = (field, value) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setNotice("");

    const serverAddress = String(formState.serverAddress || "").trim();
    const status = normalizeStatus(formState.status);

    if (!serverAddress) {
      setSubmitError("Alamat server wajib diisi.");
      return;
    }

    setSubmitting(true);

    try {
      const editingCard = cards.find((card) => card.id === editingCardId) || null;

      let responsePayload = null;
      let nextMessageId = String(editingCard?.messageId || "").trim();

      if (editingCard && nextMessageId) {
        responsePayload = await updateStrategicServerAddressWebhook(nextMessageId, {
          serverAddress,
          status,
        });
        nextMessageId = String(responsePayload?.messageId || nextMessageId).trim();
      } else {
        responsePayload = await createStrategicServerAddressWebhook({
          serverAddress,
          status,
        });
        nextMessageId = String(responsePayload?.messageId || "").trim();
      }

      if (!nextMessageId) {
        throw new Error("Discord webhook tidak mengembalikan message id.");
      }

      const timestamp = new Date().toISOString();

      if (editingCard) {
        setCards((currentCards) =>
          currentCards.map((card) =>
            card.id === editingCard.id
              ? {
                  ...card,
                  serverAddress,
                  webhookUrl: WEBHOOK_SECURITY_LABEL,
                  status,
                  messageId: nextMessageId,
                  updatedAt: timestamp,
                }
              : card,
          ),
        );
        setNotice("Alamat server berhasil diupdate dan embed lama diedit.");
      } else {
        setCards((currentCards) => [
          {
            id: createCardId(),
            serverAddress,
            webhookUrl: WEBHOOK_SECURITY_LABEL,
            status,
            messageId: nextMessageId,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          ...currentCards,
        ]);
        setNotice("Alamat server baru berhasil dikirim ke channel webhook.");
      }

      setEditorOpen(false);
      setFormState(INITIAL_FORM_STATE);
      setEditingCardId("");
    } catch (error) {
      setSubmitError(error.message || "Gagal memproses webhook alamat server.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCard = async (card) => {
    const confirmationText = `Hapus alamat server "${card.serverAddress}" dari dashboard?`;

    if (!window.confirm(confirmationText)) {
      return;
    }

    setBusyCardId(card.id);
    setNotice("");
    setSubmitError("");

    try {
      if (card.messageId) {
        await deleteStrategicServerAddressWebhook(card.messageId);
      }

      setCards((currentCards) => currentCards.filter((entry) => entry.id !== card.id));
      setNotice("Alamat server berhasil dihapus.");
    } catch (error) {
      setSubmitError(error.message || "Gagal menghapus alamat server.");
    } finally {
      setBusyCardId("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/8 bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-lime-300/16 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.32em] text-lime-300/80">
              Administrasi Paskus
            </p>
            <h1 className="mt-3 font-sans text-2xl font-bold uppercase leading-none text-stone-100 sm:text-3xl 2xl:text-4xl">
              Server Address Webhook
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">
              Menu ini tanpa database. Daftar card disimpan lokal di browser saat ini,
              sedangkan publish data dilakukan langsung ke Discord webhook.
            </p>

            <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2">
              <img
                src={paskusLogo}
                alt="Administrasi Paskus"
                className="h-8 w-8 rounded-full border border-lime-300/30 object-cover"
              />
              <p className="font-public text-[10px] uppercase tracking-[0.2em] text-lime-200">
                Webhook Name: Administrasi Paskus
              </p>
            </div>
            <p className="mt-3 max-w-3xl break-all font-mono text-xs text-stone-500">
              Endpoint webhook disembunyikan di frontend demi keamanan.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateEditor}
            className="w-full rounded-full border border-lime-300/20 bg-lime-300 px-5 py-3 font-public text-[10px] font-bold uppercase tracking-[0.22em] text-[#0a100e] transition hover:brightness-105 sm:w-auto"
          >
            Tambah Alamat Server
          </button>
        </div>
      </section>

      {notice ? (
        <section className="rounded-[22px] border border-emerald-400/28 bg-emerald-400/12 p-4 text-sm text-emerald-100 backdrop-blur-xl">
          {notice}
        </section>
      ) : null}

      {submitError ? (
        <section className="rounded-[22px] border border-rose-500/28 bg-rose-500/12 p-4 text-sm text-rose-100 backdrop-blur-xl">
          {submitError}
        </section>
      ) : null}

      {orderedCards.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-xl sm:p-8">
          <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
            No Server Address
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-400">
            Belum ada alamat server. Klik tombol Tambah Alamat Server untuk kirim embed
            pertama.
          </p>
        </section>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {orderedCards.map((card) => (
            <article
              key={card.id}
              className="rounded-[26px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-lime-300/18"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-public text-[10px] uppercase tracking-[0.2em] text-lime-300/80">
                    Alamat Server
                  </p>
                  <p className="mt-2 break-all font-mono text-lg text-stone-100">
                    {card.serverAddress}
                  </p>
                </div>

                <span
                  className={[
                    "rounded-full border px-3 py-1 font-public text-[9px] uppercase tracking-[0.2em]",
                    card.status === "Active"
                      ? "border-emerald-300/28 bg-emerald-300/14 text-emerald-200"
                      : "border-rose-300/28 bg-rose-300/14 text-rose-200",
                  ].join(" ")}
                >
                  {card.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 rounded-[18px] border border-white/8 bg-black/18 p-3 text-xs text-stone-400">
                <p className="break-all">
                  <span className="font-public uppercase tracking-[0.16em] text-stone-500">
                    Webhook
                  </span>{" "}
                  {card.webhookUrl}
                </p>
                <p>
                  <span className="font-public uppercase tracking-[0.16em] text-stone-500">
                    Message ID
                  </span>{" "}
                  <span className="font-mono text-stone-300">
                    {card.messageId || "-"}
                  </span>
                </p>
                <p>
                  <span className="font-public uppercase tracking-[0.16em] text-stone-500">
                    Update
                  </span>{" "}
                  {formatCardTimestamp(card.updatedAt)}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => openEditEditor(card)}
                  disabled={busyCardId === card.id}
                  className="rounded-[14px] border border-lime-300/22 bg-lime-300/12 px-3 py-2 font-public text-[10px] font-bold uppercase tracking-[0.18em] text-lime-100 transition hover:bg-lime-300/18 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCard(card)}
                  disabled={busyCardId === card.id}
                  className="rounded-[14px] border border-rose-400/28 bg-rose-500/14 px-3 py-2 font-public text-[10px] font-bold uppercase tracking-[0.18em] text-rose-100 transition hover:bg-rose-500/22 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {busyCardId === card.id ? "Deleting..." : "Hapus"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ServerAddressEditor
        open={editorOpen}
        mode={editorMode}
        formState={formState}
        onChange={handleFormChange}
        onClose={closeEditor}
        onSubmit={handleSubmit}
        error={submitError}
        submitting={submitting}
      />
    </div>
  );
}
