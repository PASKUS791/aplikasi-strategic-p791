/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import paskusLogo from "../assets/paskus.webp";
import { useAuth } from "../lib/strategicAuth";
import { RESOURCE_KEYS, useSyncedResource } from "../lib/resources";
import DeleteBurstOverlay from "./DeleteBurstOverlay";
import { normalizeCustomMaps } from "./customMaps";
import { isPrimaryStrategicAdminUser } from "./strategicAccess";
import {
  applyStrategicSaveToPlanner,
  dispatchStrategicSave,
  normalizeStrategicSaves,
} from "./strategicSaves";

function formatSaveDate(isoString) {
  const date = new Date(isoString);

  return Number.isNaN(date.getTime())
    ? "Unknown Timestamp"
    : date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function StrategicSavesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    data: saves,
    setData: setSaves,
    loading,
    error,
  } = useSyncedResource(RESOURCE_KEYS.strategicStrategicSaves, {
    defaultValue: [],
    saveDelay: 550,
    normalize: normalizeStrategicSaves,
  });
  const { setData: setCustomMaps } = useSyncedResource(RESOURCE_KEYS.strategicCustomMaps, {
    defaultValue: [],
    normalize: normalizeCustomMaps,
  });
  const [sendStatus, setSendStatus] = useState({});
  const [pendingDeleteSaveId, setPendingDeleteSaveId] = useState(null);

  const visibleSaves = useMemo(
    () =>
      saves.filter(
        (save) =>
          String(save.ownerId || "") === String(user?.id || "") ||
          String(save.ownerUsername || "").toLowerCase() ===
            String(user?.username || "").toLowerCase() ||
          ((!save.ownerId && !save.ownerUsername) && isPrimaryStrategicAdminUser(user)),
      ),
    [saves, user],
  );
  const totalActions = useMemo(
    () => visibleSaves.reduce((count, save) => count + (save.actionCount ?? 0), 0),
    [visibleSaves],
  );

  const handleDelete = (saveId) => {
    setSaves((currentSaves) => currentSaves.filter((save) => save.id !== saveId));
  };

  const handleApply = async (save) => {
    if (save.sourceType === "custom-map" && save.sourceMapId) {
      setCustomMaps((currentMaps) =>
        currentMaps.map((entry) =>
          entry.id === save.sourceMapId
            ? {
                ...entry,
                updatedAt: new Date().toISOString(),
                board: {
                  actions: Array.isArray(save.snapshot?.actions)
                    ? save.snapshot.actions
                    : [],
                  viewport: save.snapshot?.viewport ?? null,
                },
              }
            : entry,
        ),
      );
      navigate(`/dashboard/custom-maps/${encodeURIComponent(save.sourceMapId)}`);
      return;
    }

    await applyStrategicSaveToPlanner(save);
    navigate("/dashboard");
  };

  const handleSendToDiscord = async (save) => {
    if (sendStatus[save.id]?.type === "sending") {
      return;
    }

    setSendStatus((currentStatus) => ({
      ...currentStatus,
      [save.id]: {
        type: "sending",
        message: "Mengirim strategi ke Strategic Channel...",
      },
    }));

    try {
      const payload = await dispatchStrategicSave(save);
      setSendStatus((currentStatus) => ({
        ...currentStatus,
        [save.id]: {
          type: "success",
          message: payload?.message || "Strategi berhasil dikirim.",
        },
      }));
    } catch (sendError) {
      setSendStatus((currentStatus) => ({
        ...currentStatus,
        [save.id]: {
          type: "error",
          message: sendError.message || "Gagal mengirim strategi.",
        },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/8 bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-lime-300/16 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.32em] text-lime-300/80">
              Strategy Vault
            </p>
            <h1 className="mt-3 font-sans text-2xl font-bold uppercase leading-none text-stone-100 sm:text-3xl 2xl:text-4xl">
              Strategic Saves
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">
              Semua snapshot strategi dari map planner utama dan custom map
              disimpan di database server dan dapat langsung di-apply kembali ke
              board sumbernya.
            </p>

            <div className="mt-5 max-w-3xl rounded-[24px] border border-white/8 bg-gradient-to-r from-white/[0.05] to-lime-300/[0.06] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={paskusLogo}
                    alt="Strategic Admin"
                    className="h-14 w-14 rounded-2xl border border-lime-300/20 bg-black/18 object-cover p-1"
                  />
                  <div>
                    <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
                      Secure Dispatch
                    </p>
                    <h3 className="mt-2 font-sans text-xl font-bold uppercase text-stone-100">
                      Strategic Admin
                    </h3>
                    <p className="mt-1 text-sm text-stone-400">
                      Dispatch ke Discord sekarang berjalan dari backend dan
                      tidak lagi membuka webhook sensitif di browser.
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-lime-300/18 bg-lime-300/10 px-4 py-2 font-public text-[10px] font-bold uppercase tracking-[0.2em] text-lime-200">
                  Server Routed
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 backdrop-blur-xl">
              <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                Saved Strategies
              </p>
              <p className="mt-2 font-sans text-2xl font-bold text-stone-100">
                {visibleSaves.length}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4 backdrop-blur-xl">
              <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                Total Actions
              </p>
              <p className="mt-2 font-sans text-2xl font-bold text-stone-100">
                {totalActions}
              </p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-xl sm:p-8">
          <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
            Loading Vault
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-400">
            Memuat snapshot strategi dari database...
          </p>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-[30px] border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-100 backdrop-blur-xl">
          {error}
        </section>
      ) : null}

      {!loading && visibleSaves.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-xl sm:p-8">
          <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
            No Snapshot
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-400">
            Belum ada strategi yang disimpan. Simpan snapshot dari page Map
            Planner, lalu strategi itu akan muncul di sini.
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {visibleSaves.map((save) => (
          <article
            key={save.id}
            role="button"
            tabIndex={0}
            onClick={() => handleApply(save)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleApply(save);
              }
            }}
            className="group overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-lime-300/18 hover:bg-white/[0.05]"
          >
            {save.thumbnailDataUrl ? (
              <div className="relative h-52 overflow-hidden border-b border-white/8 bg-black/30">
                <img
                  src={save.thumbnailDataUrl}
                  alt={save.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              </div>
            ) : null}

            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
                    Strategic Save
                  </p>
                  <h2 className="mt-2 font-sans text-xl font-bold uppercase text-stone-100">
                    {save.title}
                  </h2>
                  <p className="mt-2 font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                    {save.sourceType === "custom-map"
                      ? `Custom Map • ${save.sourceMapTitle || "Custom Board"}`
                      : "Map Planner • Ronograd"}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-public text-[9px] uppercase tracking-[0.18em] text-stone-300">
                  {formatSaveDate(save.updatedAt || save.createdAt)}
                </span>
              </div>

              <p className="text-sm leading-7 text-stone-400">
                {save.note || "Tidak ada catatan strategi tambahan."}
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                  <p className="font-public text-[8px] uppercase tracking-[0.18em] text-stone-500">
                    Actions
                  </p>
                  <p className="mt-2 font-sans text-2xl font-bold text-stone-100">
                    {save.actionCount ?? 0}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                  <p className="font-public text-[8px] uppercase tracking-[0.18em] text-stone-500">
                    Source
                  </p>
                  <p className="mt-2 font-sans text-2xl font-bold text-stone-100">
                    {save.sourceType === "custom-map" ? "CSTM" : "MAIN"}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                  <p className="font-public text-[8px] uppercase tracking-[0.18em] text-stone-500">
                    Zoom
                  </p>
                  <p className="mt-2 font-sans text-2xl font-bold text-stone-100">
                    {Math.round((save.snapshot?.viewport?.scale ?? 0) * 100)}%
                  </p>
                </div>
              </div>

              {sendStatus[save.id] ? (
                <div
                  className={[
                    "rounded-[18px] border px-4 py-3 text-sm",
                    sendStatus[save.id].type === "error"
                      ? "border-rose-500/25 bg-rose-500/10 text-rose-100"
                      : sendStatus[save.id].type === "success"
                        ? "border-lime-300/18 bg-lime-300/10 text-lime-100"
                        : "border-white/10 bg-white/[0.04] text-stone-200",
                  ].join(" ")}
                >
                  {sendStatus[save.id].message}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleApply(save);
                  }}
                  className="rounded-[18px] border border-lime-300/18 bg-lime-300/10 px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.16em] text-lime-100 transition hover:bg-lime-300/16"
                >
                  Apply to Planner
                </button>
                <button
                  type="button"
                  disabled={sendStatus[save.id]?.type === "sending"}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSendToDiscord(save);
                  }}
                  className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.16em] text-stone-100 transition hover:border-lime-300/18 hover:bg-lime-300/10 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {sendStatus[save.id]?.type === "sending"
                    ? "Sending..."
                    : "Send to Strategic Channel"}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingDeleteSaveId(save.id);
                  }}
                  className="rounded-[18px] border border-rose-500/18 bg-rose-500/10 px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.16em] text-rose-100 transition hover:bg-rose-500/16"
                >
                  Delete Save
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <DeleteBurstOverlay
        visible={Boolean(pendingDeleteSaveId)}
        onComplete={() => {
          if (pendingDeleteSaveId) {
            handleDelete(pendingDeleteSaveId);
          }
          setPendingDeleteSaveId(null);
        }}
      />
    </div>
  );
}
