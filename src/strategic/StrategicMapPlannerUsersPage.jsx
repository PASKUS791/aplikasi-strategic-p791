/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Map Planner Users
 * Purpose: Menambah user Strategic dan mengatur akses ke planner utama, map custom, dan saves.
 */

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { RESOURCE_KEYS, useSyncedResource } from "../lib/resources";
import DeleteBurstOverlay from "./DeleteBurstOverlay";
import StrategicDeleteUserModal from "./StrategicDeleteUserModal";
import {
  createStrategicPlannerUser,
  fetchStrategicPlannerUsers,
  removeStrategicPlannerUser,
} from "./data/strategicPortalBackend";
import {
  isPrimaryStrategicAdminUser,
  normalizeStrategicAccessEntries,
  normalizeStrategicUsername,
} from "./strategicAccess";
import { useAuth } from "../lib/strategicAuth";

const INITIAL_FORM_STATE = {
  username: "",
  label: "",
  unit: "Strategic Command",
  role: "user",
  password: "",
};

function AccessToggle({ checked, label, onChange, disabled = false }) {
  const [burstSeed, setBurstSeed] = useState(0);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        setBurstSeed((currentSeed) => currentSeed + 1);
        onChange();
      }}
      className={[
        "flex min-w-0 items-center justify-between gap-3 rounded-[18px] border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45",
        checked
          ? "border-lime-300/26 bg-lime-300/10 text-lime-100"
          : "border-white/8 bg-black/20 text-stone-300 hover:bg-white/[0.05]",
      ].join(" ")}
    >
      <span className="min-w-0 flex-1 font-public text-[9px] uppercase tracking-[0.14em] leading-4">
        {label}
      </span>
      <span
        className={[
          "relative h-5 w-10 shrink-0 rounded-full border transition",
          checked ? "border-lime-300/30 bg-lime-300/20" : "border-white/10 bg-black/20",
        ].join(" ")}
      >
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={`${burstSeed}-${index}`}
              initial={{
                opacity: 0,
                scale: 0.35,
                x: checked ? -2 : 18,
                y: 8,
              }}
              animate={{
                opacity: checked ? [0, 0.85, 0] : [0, 0.35, 0],
                scale: [0.3, 1, 0.55],
                x: checked ? 17 + index * 4 : 8 - index * 3,
                y: [8, 4 - index, 9 + index],
              }}
              transition={{
                duration: 0.42,
                ease: "easeOut",
                delay: index * 0.03,
              }}
              className={[
                "absolute h-1.5 w-1.5 rounded-full",
                checked ? "bg-lime-200/80" : "bg-stone-400/50",
              ].join(" ")}
            />
          ))}
        </span>
        <motion.span
          animate={{
            x: checked ? 18 : 2,
            y: -8,
            scale: checked ? 1.02 : 1,
          }}
          transition={{ type: "spring", stiffness: 520, damping: 30, mass: 0.7 }}
          className={[
            "absolute left-0 top-1/2 block h-4 w-4 rounded-full shadow-[0_0_18px_rgba(190,242,100,0.18)]",
            checked ? "bg-lime-300" : "bg-stone-500",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

export default function StrategicMapPlannerUsersPage() {
  const { user } = useAuth();
  const isPrimaryAdmin = isPrimaryStrategicAdminUser(user);
  const [users, setUsers] = useState([]);
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingUsername, setDeletingUsername] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteBurstVisible, setIsDeleteBurstVisible] = useState(false);
  const {
    data: accessEntries,
    setData: setAccessEntries,
  } = useSyncedResource(RESOURCE_KEYS.strategicMapPlannerUsers, {
    defaultValue: [],
    normalize: normalizeStrategicAccessEntries,
    enabled: isPrimaryAdmin,
  });

  useEffect(() => {
    if (!isPrimaryAdmin) {
      setLoadingUsers(false);
      return undefined;
    }

    let active = true;

    async function loadUsers() {
      try {
        const nextUsers = await fetchStrategicPlannerUsers();

        if (!active) {
          return;
        }

        setUsers(nextUsers);
        setError("");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError.message || "Gagal memuat user map planner.");
      } finally {
        if (active) {
          setLoadingUsers(false);
        }
      }
    }

    loadUsers();

    return () => {
      active = false;
    };
  }, [isPrimaryAdmin]);

  const mergedUsers = useMemo(() => {
    return users.map((entry) => {
      const matchedAccess = accessEntries.find(
        (accessEntry) =>
          normalizeStrategicUsername(accessEntry.username) ===
          normalizeStrategicUsername(entry.username),
      );

      return {
        ...entry,
        access: matchedAccess?.access ?? entry.access ?? {
          mainPlanner: true,
          customMaps: true,
          saves: true,
        },
      };
    });
  }, [accessEntries, users]);

  const handleChange = (field) => (event) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const payload = await createStrategicPlannerUser(formState);
      const refreshed = await fetchStrategicPlannerUsers();

      setUsers(refreshed);
      setFormState(INITIAL_FORM_STATE);
      setNotice(payload?.message || "User map planner berhasil ditambahkan.");
      setError("");
    } catch (submitError) {
      setError(submitError.message || "Gagal menambahkan user map planner.");
      setNotice("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAccess = (targetUser, accessKey) => {
    setAccessEntries((currentEntries) => {
      const normalizedUsername = normalizeStrategicUsername(targetUser.username);
      const otherEntries = currentEntries.filter(
        (entry) => normalizeStrategicUsername(entry.username) !== normalizedUsername,
      );
      const currentEntry = currentEntries.find(
        (entry) => normalizeStrategicUsername(entry.username) === normalizedUsername,
      );
      const currentAccess = currentEntry?.access ?? targetUser.access ?? {
        mainPlanner: true,
        customMaps: true,
        saves: true,
      };

      return [
        ...otherEntries,
        {
          username: normalizedUsername,
          access: {
            ...currentAccess,
            [accessKey]: !currentAccess[accessKey],
          },
          updatedAt: new Date().toISOString(),
        },
      ];
    });
    setNotice(`Akses ${targetUser.label} diperbarui.`);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeletingUsername(deleteTarget.username);
      const payload = await removeStrategicPlannerUser(deleteTarget.username);

      setUsers((currentUsers) =>
        currentUsers.filter((entry) => entry.username !== deleteTarget.username),
      );
      setAccessEntries((currentEntries) =>
        currentEntries.filter(
          (entry) =>
            normalizeStrategicUsername(entry.username) !==
            normalizeStrategicUsername(deleteTarget.username),
        ),
      );
      setNotice(payload?.message || `Anggota ${deleteTarget.label} berhasil dihapus.`);
      setError("");
    } catch (deleteError) {
      setError(deleteError.message || "Gagal menghapus anggota Strategic.");
      setNotice("");
    } finally {
      setDeletingUsername("");
      setDeleteTarget(null);
    }
  };

  if (!isPrimaryAdmin) {
    return (
      <section className="rounded-[28px] border border-amber-300/14 bg-amber-300/[0.06] p-6 text-sm leading-7 text-amber-100 backdrop-blur-xl">
        Menu ini hanya tersedia untuk akun Strategic utama.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/8 bg-white/[0.035] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.32em] text-lime-300/80">
              Access Registry
            </p>
            <h1 className="mt-3 font-sans text-2xl font-bold uppercase leading-none text-stone-100 sm:text-3xl 2xl:text-4xl">
              Tambah User Map Planner
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">
              Tambahkan akun Strategic baru dan atur akses ke map planner utama, map custom,
              serta strategic saves.
            </p>
          </div>

          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-5 py-4">
            <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
              User Aktif
            </p>
            <p className="mt-2 font-sans text-2xl font-bold text-stone-100">
              {mergedUsers.length}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[0.94fr_1.06fr]">
        <section className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
              Create Account
            </p>
            <h2 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
              User Strategic Baru
            </h2>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
                Operator ID
              </span>
              <input
                value={formState.username}
                onChange={handleChange("username")}
                placeholder="contoh: strategic.alpha"
                autoComplete="username"
                className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/24"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
                Nama User
              </span>
              <input
                value={formState.label}
                onChange={handleChange("label")}
                placeholder="Nama operator Strategic"
                className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/24"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
                Unit
              </span>
              <input
                value={formState.unit}
                onChange={handleChange("unit")}
                className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/24"
              />
            </label>

            <label className="grid gap-2">
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
                Role
              </span>
              <select
                value={formState.role}
                onChange={handleChange("role")}
                className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/24"
              >
                <option value="user">User</option>
                <option value="scout">Scout</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
                Security Key
              </span>
              <input
                type="password"
                value={formState.password}
                onChange={handleChange("password")}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/24"
              />
            </label>

            {error ? (
              <p className="font-public text-[10px] uppercase tracking-[0.16em] text-rose-300">
                {error}
              </p>
            ) : null}

            {notice ? (
              <p className="font-public text-[10px] uppercase tracking-[0.16em] text-lime-300">
                {notice}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-[18px] border border-lime-300/16 bg-lime-300 px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b100e] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Menyimpan..." : "Tambah User Map Planner"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
                Access Matrix
              </p>
              <h2 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
                Akses Anggota
              </h2>
            </div>
            {loadingUsers ? (
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Loading...
              </span>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            {mergedUsers.map((entry) => (
              <article
                key={entry.username}
                className="rounded-[22px] border border-white/8 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-start 2xl:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-sans text-lg font-bold uppercase text-stone-100">
                        {entry.label}
                      </h3>
                      {entry.isPrimaryAdmin ? (
                        <span className="rounded-full border border-lime-300/18 bg-lime-300/10 px-3 py-1 font-public text-[9px] uppercase tracking-[0.18em] text-lime-200">
                          Strategic Utama
                        </span>
                      ) : (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-public text-[9px] uppercase tracking-[0.18em] text-stone-300">
                          {entry.role === "scout"
                            ? "Scout"
                            : entry.role === "admin"
                              ? "Admin"
                              : "User"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-stone-400">
                      Operator ID: @{entry.operatorId || entry.username}
                    </p>
                    <p className="mt-1 font-public text-[10px] uppercase tracking-[0.16em] text-stone-500">
                      {entry.unit}
                    </p>
                  </div>

                  <div className="grid w-full gap-2 sm:grid-cols-2 2xl:w-[min(100%,540px)] 2xl:grid-cols-3">
                    <AccessToggle
                      label="Map Planner"
                      checked={entry.access.mainPlanner}
                      disabled={entry.isPrimaryAdmin}
                      onChange={() => handleToggleAccess(entry, "mainPlanner")}
                    />
                    <AccessToggle
                      label="Map Custom"
                      checked={entry.access.customMaps}
                      disabled={entry.isPrimaryAdmin}
                      onChange={() => handleToggleAccess(entry, "customMaps")}
                    />
                    <AccessToggle
                      label="Strategic Saves"
                      checked={entry.access.saves}
                      disabled={entry.isPrimaryAdmin}
                      onChange={() => handleToggleAccess(entry, "saves")}
                    />
                  </div>
                </div>

                {!entry.isPrimaryAdmin ? (
                  <div className="mt-4 border-t border-white/6 pt-4">
                    <button
                      type="button"
                      disabled={deletingUsername === entry.username}
                      onClick={() => setDeleteTarget(entry)}
                      className="rounded-[16px] border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 font-public text-[10px] font-bold uppercase tracking-[0.16em] text-rose-200 transition hover:bg-rose-500/16 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingUsername === entry.username
                        ? "Menghapus..."
                        : "Hapus Anggota"}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}

            {!loadingUsers && mergedUsers.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-white/10 bg-black/20 px-4 py-6 text-sm text-stone-500">
                Belum ada user Strategic tambahan di database.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <StrategicDeleteUserModal
        userEntry={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          setIsDeleteBurstVisible(true);
        }}
      />

      <DeleteBurstOverlay
        visible={isDeleteBurstVisible}
        onComplete={() => {
          setIsDeleteBurstVisible(false);
          handleDeleteUser();
        }}
      />
    </div>
  );
}
