/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Custom Map Delete Modal
 * Purpose: Konfirmasi penghapusan map custom dan strategic save terkait.
 */

export default function CustomMapDeleteModal({
  mapTitle,
  saveCount = 0,
  onCancel,
  onConfirm,
}) {
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
              Custom Map Vault
            </p>
            <h3 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
              Hapus Map Custom
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
              Target
            </p>
            <p className="mt-2 font-sans text-xl font-bold uppercase text-stone-100">
              {mapTitle}
            </p>
          </div>

          <p className="text-sm leading-7 text-stone-300">
            Map custom ini akan dihapus permanen dari gallery dan planner.
            {saveCount > 0
              ? ` ${saveCount} strategic save yang terhubung ke map ini juga akan ikut dibersihkan.`
              : " Strategic save lain tidak akan terpengaruh."}
          </p>

          <div className="rounded-[18px] border border-rose-500/14 bg-rose-500/8 px-4 py-3">
            <p className="font-public text-[9px] uppercase tracking-[0.18em] text-rose-200">
              Permanent Action
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-300">
              Tindakan ini tidak bisa di-undo dari interface.
            </p>
          </div>
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
            Hapus Map
          </button>
        </div>
      </div>
    </div>
  );
}
