/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Custom Maps
 * Purpose: Galeri card map custom dengan upload JPG/PNG untuk planner draw-only.
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CustomMapDeleteModal from "./CustomMapDeleteModal";
import DeleteBurstOverlay from "./DeleteBurstOverlay";
import { useAuth } from "../lib/strategicAuth";
import { RESOURCE_KEYS, useSyncedResource } from "../lib/resources";
import {
  countCustomMapLinkedSaves,
  createCustomMapId,
  normalizeCustomMaps,
  removeCustomMapEntries,
  removeCustomMapLinkedSaves,
} from "./customMaps";
import { isPrimaryStrategicAdminUser } from "./strategicAccess";
import { normalizeStrategicSaves } from "./strategicSaves";

function formatMapDate(isoString) {
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

function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca file map."));
    reader.readAsDataURL(file);
  });
}

function AddCustomMapModal({ draft, onChange, onClose, onSubmit, error, submitting }) {
  return (
    <div
      className="fixed inset-0 z-[260] flex items-center justify-center bg-black/72 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl rounded-[28px] border border-white/8 bg-[#121618]/92 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/6 pb-4">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.28em] text-lime-300">
              Custom Map Vault
            </p>
            <h3 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
              Tambah Map Custom
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 font-public text-[10px] uppercase tracking-[0.18em] text-stone-300 transition hover:bg-white/[0.08]"
          >
            Tutup
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Judul Map
            </span>
            <input
              autoFocus
              value={draft.title}
              onChange={(event) => onChange("title", event.target.value)}
              className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/30"
              placeholder="Operation Harbor Grid"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Deskripsi Singkat
            </span>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(event) => onChange("description", event.target.value)}
              className="resize-none rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm leading-6 text-stone-100 outline-none transition focus:border-lime-300/30"
              placeholder="Catatan singkat untuk map custom ini."
            />
          </label>

          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              File Map JPG / PNG
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => onChange("file", event.target.files?.[0] ?? null)}
              className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-300 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-lime-300 file:px-4 file:py-2 file:font-public file:text-[10px] file:font-bold file:uppercase file:tracking-[0.18em] file:text-[#0a100e]"
            />
          </label>

          {error ? (
            <p className="font-public text-[10px] uppercase tracking-[0.18em] text-rose-300">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/6 pt-4">
          <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
            Map custom ini akan membuka planner draw-only tanpa marker intel.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full border border-lime-300/20 bg-lime-300 px-4 py-2 font-public text-[10px] font-bold uppercase tracking-[0.2em] text-[#0a100e] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Menyimpan..." : "Tambah Map"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function StrategicCustomMapsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isPrimaryAdmin = isPrimaryStrategicAdminUser(user);
  const { data: customMaps, setData: setCustomMaps, loading } = useSyncedResource(
    RESOURCE_KEYS.strategicCustomMaps,
    {
      defaultValue: [],
      normalize: normalizeCustomMaps,
      saveDelay: 700,
    },
  );
  const { data: strategicSaves, setData: setStrategicSaves } = useSyncedResource(
    RESOURCE_KEYS.strategicStrategicSaves,
    {
      defaultValue: [],
      saveDelay: 550,
      normalize: normalizeStrategicSaves,
      enabled: isPrimaryAdmin,
    },
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteBurstVisible, setIsDeleteBurstVisible] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    file: null,
  });

  const totalActions = useMemo(
    () =>
      customMaps.reduce(
        (count, mapEntry) => count + (mapEntry.board?.actions?.length ?? 0),
        0,
      ),
    [customMaps],
  );

  useEffect(() => {
    const navigationFeedback = location.state?.customMapFeedback;

    if (!navigationFeedback) {
      return;
    }

    setActionFeedback(navigationFeedback);
    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!actionFeedback) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setActionFeedback(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [actionFeedback]);

  const handleDraftChange = (field, value) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  };

  const handleAddMap = async (event) => {
    event.preventDefault();

    if (!draft.file) {
      setSubmitError("File map wajib dipilih.");
      return;
    }

    if (!draft.title.trim()) {
      setSubmitError("Judul map wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const imageDataUrl = await readImageFileAsDataUrl(draft.file);
      const timestamp = new Date().toISOString();
      const nextMap = {
        id: createCustomMapId(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        imageDataUrl,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: {
          id: user?.id ?? null,
          username: user?.username ?? "",
          label: user?.label ?? "Strategic User",
        },
        board: {
          actions: [],
          viewport: null,
        },
      };

      setCustomMaps((currentMaps) => [nextMap, ...currentMaps].slice(0, 48));
      setDraft({
        title: "",
        description: "",
        file: null,
      });
      setSubmitError("");
      setIsAddModalOpen(false);
    } catch (error) {
      setSubmitError(error.message || "Gagal membuat map custom.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMap = () => {
    if (!deleteTarget) {
      return;
    }

    const linkedSaveCount = countCustomMapLinkedSaves(strategicSaves, deleteTarget.id);

    setCustomMaps((currentMaps) => removeCustomMapEntries(currentMaps, deleteTarget.id));
    setStrategicSaves((currentSaves) =>
      removeCustomMapLinkedSaves(currentSaves, deleteTarget.id),
    );
    setDeleteTarget(null);
    setActionFeedback(
      linkedSaveCount > 0
        ? `${deleteTarget.title} dihapus bersama ${linkedSaveCount} strategic save terkait.`
        : `${deleteTarget.title} berhasil dihapus dari custom map vault.`,
    );
  };

  const handleStartDeleteSequence = () => {
    setIsDeleteBurstVisible(true);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/8 bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.32em] text-lime-300/80">
              Custom Grid
            </p>
            <h1 className="mt-3 font-sans text-2xl font-bold uppercase leading-none text-stone-100 sm:text-3xl 2xl:text-4xl">
              Map Custom
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">
              Upload map JPG atau PNG, lalu gunakan board draw-only untuk briefing,
              sketsa jalur, dan catatan taktis tanpa layer marker intel.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4">
              <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                Total Map
              </p>
              <p className="mt-2 font-sans text-2xl font-bold text-stone-100">
                {customMaps.length}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4">
              <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                Total Coretan
              </p>
              <p className="mt-2 font-sans text-2xl font-bold text-stone-100">
                {totalActions}
              </p>
            </div>
          </div>
        </div>
      </section>

      {actionFeedback ? (
        <section className="rounded-[22px] border border-lime-300/18 bg-lime-300/8 px-5 py-4 backdrop-blur-xl">
          <p className="font-public text-[10px] uppercase tracking-[0.18em] text-lime-200">
            {actionFeedback}
          </p>
        </section>
      ) : null}

      {isPrimaryAdmin ? (
        <section className="rounded-[28px] border border-dashed border-lime-300/16 bg-lime-300/[0.04] p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
                Add New Board
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                Tambahkan map custom baru untuk dipakai anggota Strategic yang memiliki akses.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full rounded-[18px] border border-lime-300/18 bg-lime-300 px-5 py-3 font-public text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b100e] transition hover:brightness-105 sm:w-auto"
            >
              Tambah Map Custom
            </button>
          </div>
        </section>
      ) : null}

      {loading ? (
        <section className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-xl sm:p-8">
          <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
            Loading Custom Maps
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-400">
            Memuat daftar map custom dari database...
          </p>
        </section>
      ) : null}

      {!loading && customMaps.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-xl sm:p-8">
          <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
            No Custom Map
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-400">
            Belum ada map custom yang ditambahkan ke Strategic Center.
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {customMaps.map((mapEntry) => (
          <article
            key={mapEntry.id}
            className="overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-lime-300/18 hover:bg-white/[0.05]"
          >
            <div className="relative h-56 overflow-hidden border-b border-white/8 bg-black/30">
              <img
                src={mapEntry.imageDataUrl}
                alt={mapEntry.title}
                className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
                    Custom Board
                  </p>
                  <h2 className="mt-2 font-sans text-xl font-bold uppercase text-stone-100">
                    {mapEntry.title}
                  </h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-public text-[9px] uppercase tracking-[0.18em] text-stone-300">
                  {formatMapDate(mapEntry.updatedAt)}
                </span>
              </div>

              <p className="text-sm leading-7 text-stone-400">
                {mapEntry.description || "Tidak ada deskripsi tambahan untuk map custom ini."}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                  <p className="font-public text-[8px] uppercase tracking-[0.18em] text-stone-500">
                    Coretan
                  </p>
                  <p className="mt-2 font-sans text-2xl font-bold text-stone-100">
                    {mapEntry.board?.actions?.length ?? 0}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3">
                  <p className="font-public text-[8px] uppercase tracking-[0.18em] text-stone-500">
                    Dibuat Oleh
                  </p>
                  <p className="mt-2 font-sans text-sm font-bold uppercase text-stone-100">
                    {mapEntry.createdBy?.label || "Strategic"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  to={`/dashboard/custom-maps/${mapEntry.id}`}
                  className="inline-flex w-full items-center justify-center rounded-[18px] border border-lime-300/18 bg-lime-300 px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b100e] transition hover:brightness-105"
                >
                  Buka Map Custom
                </Link>

                {isPrimaryAdmin ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({
                        id: mapEntry.id,
                        title: mapEntry.title,
                        linkedSaveCount: countCustomMapLinkedSaves(
                          strategicSaves,
                          mapEntry.id,
                        ),
                      })
                    }
                    className="inline-flex w-full items-center justify-center rounded-[18px] border border-rose-400/14 bg-rose-500/10 px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200 transition hover:border-rose-400/22 hover:bg-rose-500/16"
                  >
                    Hapus Map
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      {isAddModalOpen ? (
        <AddCustomMapModal
          draft={draft}
          onChange={handleDraftChange}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddMap}
          error={submitError}
          submitting={submitting}
        />
      ) : null}

      {deleteTarget ? (
        <CustomMapDeleteModal
          mapTitle={deleteTarget.title}
          saveCount={deleteTarget.linkedSaveCount}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleStartDeleteSequence}
        />
      ) : null}

      <DeleteBurstOverlay
        visible={isDeleteBurstVisible}
        onComplete={() => {
          setIsDeleteBurstVisible(false);
          handleDeleteMap();
        }}
      />
    </div>
  );
}
