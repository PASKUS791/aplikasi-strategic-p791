/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Delete User Modal
 * Purpose: Konfirmasi penghapusan anggota map planner.
 */

export default function StrategicDeleteUserModal({ userEntry, onCancel, onConfirm }) {
  if (!userEntry) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[280] flex items-center justify-center bg-black/78 p-4 backdrop-blur-md"
      onClick={onCancel}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-[28px] border border-rose-500/18 bg-[#121618]/94 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.52)] backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/6 pb-4">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.28em] text-rose-300">
              Access Registry
            </p>
            <h3 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
              Hapus Anggota
            </h3>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 font-public text-[10px] uppercase tracking-[0.18em] text-stone-300 transition hover:bg-white/[0.08]"
          >
            Tutup
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-[22px] border border-white/8 bg-black/20 px-5 py-4">
            <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
              Target Anggota
            </p>
            <p className="mt-2 font-sans text-xl font-bold uppercase text-stone-100">
              {userEntry.label}
            </p>
            <p className="mt-1 text-sm text-stone-400">
              Operator ID: @{userEntry.operatorId || userEntry.username}
            </p>
          </div>

          <p className="text-sm leading-7 text-stone-300">
            Akun anggota ini akan dihapus dari akses `Map Planner`, `Map Custom`,
            dan `Strategic Saves`. Strategic save milik akun ini juga akan ikut
            dibersihkan.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/6 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.18em] text-stone-300 transition hover:bg-white/[0.08]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[18px] border border-rose-400/18 bg-rose-500 px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:brightness-105"
          >
            Hapus Anggota
          </button>
        </div>
      </div>
    </div>
  );
}
