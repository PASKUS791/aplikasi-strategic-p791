/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 *
 * Module: Strategic / Custom Map Planner
 * Purpose: Planner draw-only untuk map custom tanpa layer marker intel.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import paskusLightGif from "../assets/paskus-light.gif";
import { useAuth } from "../lib/strategicAuth";
import { RESOURCE_KEYS, useSyncedResource } from "../lib/resources";
import CustomMapDeleteModal from "./CustomMapDeleteModal";
import DeleteBurstOverlay from "./DeleteBurstOverlay";
import {
  countCustomMapLinkedSaves,
  normalizeCustomMaps,
  removeCustomMapEntries,
  removeCustomMapLinkedSaves,
} from "./customMaps";
import {
  getStrategicAccessForUser,
  isPrimaryStrategicAdminUser,
} from "./strategicAccess";
import { renderStrategySnapshotDataUrl } from "./snapshotRenderer";
import { normalizeStrategicSaves } from "./strategicSaves";

const COLOR_SWATCHES = [
  "#E9C349",
  "#A7F3D0",
  "#67E8F9",
  "#F97316",
  "#FA005A",
  "#FA0000",
  "#E5E7EB",
];
const MIN_SCALE = 0.05;
const MAX_SCALE = 4;
const CUSTOM_MAP_INTRO_MIN_DURATION = 3400;
const DRAW_TOOL_OPTIONS = [
  { id: "pan", label: "Pan", icon: "focus" },
  { id: "pen", label: "Pencil", icon: "draw" },
  { id: "eraser", label: "Delete", icon: "trash" },
  { id: "text", label: "Text", icon: "text" },
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createActionId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getRelativePoint(event, element) {
  const bounds = element.getBoundingClientRect();

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
}

function screenToWorld(point, viewport) {
  return {
    x: (point.x - viewport.offsetX) / viewport.scale,
    y: (point.y - viewport.offsetY) / viewport.scale,
  };
}

function worldToScreen(point, viewport) {
  return {
    x: viewport.offsetX + point.x * viewport.scale,
    y: viewport.offsetY + point.y * viewport.scale,
  };
}

function constrainViewport(nextViewport, width, height, imageWidth, imageHeight) {
  const scale = clamp(nextViewport.scale, MIN_SCALE, MAX_SCALE);
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;
  let offsetX = nextViewport.offsetX;
  let offsetY = nextViewport.offsetY;

  if (scaledWidth <= width) {
    offsetX = (width - scaledWidth) / 2;
  } else {
    offsetX = clamp(offsetX, width - scaledWidth, 0);
  }

  if (scaledHeight <= height) {
    offsetY = (height - scaledHeight) / 2;
  } else {
    offsetY = clamp(offsetY, height - scaledHeight, 0);
  }

  return {
    scale,
    offsetX,
    offsetY,
  };
}

function createFittedViewport(width, height, imageWidth, imageHeight) {
  const nextScale = clamp(
    Math.min(width / imageWidth, height / imageHeight) * 0.98,
    MIN_SCALE,
    MAX_SCALE,
  );

  return constrainViewport(
    {
      scale: nextScale,
      offsetX: (width - imageWidth * nextScale) / 2,
      offsetY: (height - imageHeight * nextScale) / 2,
    },
    width,
    height,
    imageWidth,
    imageHeight,
  );
}

function resolveSavedViewport(viewport, frameWidth, frameHeight, imageWidth, imageHeight) {
  if (
    !viewport ||
    !Number.isFinite(viewport.scale) ||
    !Number.isFinite(viewport.offsetX) ||
    !Number.isFinite(viewport.offsetY) ||
    !frameWidth ||
    !frameHeight ||
    !imageWidth ||
    !imageHeight
  ) {
    return null;
  }

  const sanitizedViewport = constrainViewport(
    viewport,
    frameWidth,
    frameHeight,
    imageWidth,
    imageHeight,
  );
  const scaledWidth = sanitizedViewport.scale * imageWidth;
  const scaledHeight = sanitizedViewport.scale * imageHeight;
  const centeredOffsetX = (frameWidth - scaledWidth) / 2;
  const centeredOffsetY = (frameHeight - scaledHeight) / 2;
  const looksLikeBootstrapViewport =
    Math.abs(viewport.scale - 0.1) < 0.0001 &&
    Math.abs(viewport.offsetX) < 1 &&
    Math.abs(viewport.offsetY) < 1;
  const violatesHorizontalCenter =
    scaledWidth <= frameWidth && Math.abs(viewport.offsetX - centeredOffsetX) > 8;
  const violatesVerticalCenter =
    scaledHeight <= frameHeight && Math.abs(viewport.offsetY - centeredOffsetY) > 8;

  if (looksLikeBootstrapViewport || violatesHorizontalCenter || violatesVerticalCenter) {
    return null;
  }

  return sanitizedViewport;
}

function getBoardSignature(actions = [], viewport = null) {
  return JSON.stringify({
    actions: actions.map((action) => ({
      id: action.id,
      type: action.type,
      tool: action.tool,
      color: action.color,
      size: action.size,
      text: action.text,
      x: action.x,
      y: action.y,
      points: Array.isArray(action.points)
        ? action.points.map((point) => [point.x, point.y])
        : [],
    })),
    viewport,
  });
}

function drawStrokePath(context, stroke, viewport) {
  if (stroke.type !== "stroke" || stroke.points.length === 0) {
    return;
  }

  context.save();
  context.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";
  context.strokeStyle = stroke.color;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = Math.max(2.4, stroke.size * Math.max(viewport.scale, 0.18));
  if (stroke.tool === "pen") {
    context.shadowColor = stroke.color;
    context.shadowBlur = 4;
  }
  context.beginPath();

  const firstPoint = worldToScreen(stroke.points[0], viewport);
  context.moveTo(firstPoint.x, firstPoint.y);

  if (stroke.points.length === 1) {
    context.lineTo(firstPoint.x + 0.01, firstPoint.y + 0.01);
  } else {
    stroke.points.slice(1).forEach((point) => {
      const screenPoint = worldToScreen(point, viewport);
      context.lineTo(screenPoint.x, screenPoint.y);
    });
  }

  context.stroke();
  context.restore();
}

function drawTextAction(context, action, viewport) {
  if (action.type !== "text" || !action.text.trim()) {
    return;
  }

  const lines = action.text.split("\n");
  const screenPoint = worldToScreen(action, viewport);
  const textSize = Math.max(14, action.size * Math.max(viewport.scale, 0.2));

  context.save();
  context.font = `700 ${textSize}px "Space Grotesk", sans-serif`;
  context.fillStyle = action.color;
  context.textBaseline = "top";
  lines.forEach((line, index) => {
    context.fillText(line, screenPoint.x, screenPoint.y + index * textSize * 1.2);
  });
  context.restore();
}

function ToolButton({ active = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-[16px] border px-3 py-2 font-public text-[10px] font-bold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-45 sm:text-[11px]",
        active
          ? "border-lime-300/30 bg-lime-300/16 text-lime-100"
          : "border-white/8 bg-white/[0.03] text-stone-300 hover:bg-white/[0.06]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function PlannerIcon({ name, className = "h-4 w-4" }) {
  const sharedProps = {
    className,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (name === "draw") {
    return (
      <svg {...sharedProps}>
        <path d="m4.5 14.5 7.9-7.9 3 3-7.9 7.9H4.5v-3Z" />
        <path d="m11.8 5.2 1.9-1.9 2.1 2.1-1.9 1.9Z" />
        <path d="m4.5 14.5 3 3" />
      </svg>
    );
  }

  if (name === "text") {
    return (
      <svg {...sharedProps}>
        <path d="M4 5h12" />
        <path d="M10 5v10" />
        <path d="M7 15h6" />
      </svg>
    );
  }

  if (name === "save") {
    return (
      <svg {...sharedProps}>
        <path d="M5 4.5h8l2.5 2.5v8.5H5z" />
        <path d="M7 4.5V9h6V4.5" />
        <path d="M7.5 14h5" />
      </svg>
    );
  }

  if (name === "focus") {
    return (
      <svg {...sharedProps}>
        <path d="M7 4H4v3" />
        <path d="M13 4h3v3" />
        <path d="M16 13v3h-3" />
        <path d="M4 13v3h3" />
      </svg>
    );
  }

  if (name === "zoom-in") {
    return (
      <svg {...sharedProps}>
        <circle cx="8.5" cy="8.5" r="4.5" />
        <path d="M8.5 6v5" />
        <path d="M6 8.5h5" />
        <path d="m12 12 4 4" />
      </svg>
    );
  }

  if (name === "zoom-out") {
    return (
      <svg {...sharedProps}>
        <circle cx="8.5" cy="8.5" r="4.5" />
        <path d="M6 8.5h5" />
        <path d="m12 12 4 4" />
      </svg>
    );
  }

  if (name === "reset") {
    return (
      <svg {...sharedProps}>
        <path d="M4 10a6 6 0 1 0 2-4.47" />
        <path d="M4 4v4h4" />
      </svg>
    );
  }

  if (name === "undo") {
    return (
      <svg {...sharedProps}>
        <path d="M7 6 3.5 9.5 7 13" />
        <path d="M16 15a5.5 5.5 0 0 0-5.5-5.5H3.5" />
      </svg>
    );
  }

  if (name === "redo") {
    return (
      <svg {...sharedProps}>
        <path d="m13 6 3.5 3.5L13 13" />
        <path d="M4 15a5.5 5.5 0 0 1 5.5-5.5h7" />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg {...sharedProps}>
        <path d="M4.5 5.5h11" />
        <path d="M7 5.5V4h6v1.5" />
        <path d="M6 5.5 6.8 16h6.4L14 5.5" />
      </svg>
    );
  }

  if (name === "fullscreen-enter") {
    return (
      <svg {...sharedProps}>
        <path d="M7 4H4v3" />
        <path d="M13 4h3v3" />
        <path d="M16 13v3h-3" />
        <path d="M4 13v3h3" />
        <path d="M7 4 4 7" />
        <path d="M13 4 16 7" />
        <path d="M16 13 13 16" />
        <path d="M4 13 7 16" />
      </svg>
    );
  }

  if (name === "fullscreen-exit") {
    return (
      <svg {...sharedProps}>
        <path d="M8 4H4v4" />
        <path d="M12 4h4v4" />
        <path d="M16 12v4h-4" />
        <path d="M4 12v4h4" />
        <path d="M8 8 4 4" />
        <path d="M12 8 16 4" />
        <path d="M12 12 16 16" />
        <path d="M8 12 4 16" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <circle cx="10" cy="10" r="6" />
    </svg>
  );
}

function ToolbarIconButton({
  active = false,
  disabled = false,
  icon,
  label,
  onClick,
  sizeClass = "h-11 w-11",
  className = "",
}) {
  return (
    <motion.button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.(event);
      }}
      whileHover={disabled ? undefined : { scale: 1.05, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className={[
        "group relative grid place-items-center overflow-hidden border transition disabled:cursor-not-allowed disabled:opacity-40",
        sizeClass,
        className,
        active
          ? "border-lime-300/35 bg-lime-300 text-[#0b100e] shadow-[0_0_24px_rgba(190,242,100,0.16)]"
          : "border-white/8 bg-white/[0.04] text-stone-300 hover:border-white/12 hover:bg-white/[0.08]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 group-active:opacity-100 bg-[linear-gradient(135deg,rgba(103,232,249,0.16),rgba(190,242,100,0.08),rgba(244,63,94,0.14))]" />
      <span className="pointer-events-none absolute inset-x-2 top-1 h-px bg-[linear-gradient(90deg,rgba(103,232,249,0),rgba(103,232,249,0.9),rgba(244,63,94,0.6),rgba(103,232,249,0))] opacity-0 blur-[1px] transition duration-200 group-hover:opacity-100 group-active:opacity-100" />
      <span className="pointer-events-none absolute inset-x-3 bottom-2 h-[2px] bg-lime-300/30 opacity-0 blur-[2px] transition duration-200 group-active:opacity-100" />
      <span className="relative z-10">
        <PlannerIcon name={icon} className="h-4 w-4" />
      </span>
    </motion.button>
  );
}

function CustomMapSaveModal({ draft, onChange, onClose, onSubmit, sourceTitle }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[280] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.form
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-xl rounded-[30px] border border-white/8 bg-[#121618]/92 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/6 pb-4">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.28em] text-lime-300">
              Strategy Vault
            </p>
            <h3 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
              Save Custom Snapshot
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 font-public text-[10px] uppercase tracking-[0.18em] text-stone-300 transition hover:bg-white/[0.08]"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Strategy Title
            </span>
            <input
              autoFocus
              value={draft.title}
              onChange={(event) => onChange("title", event.target.value)}
              className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/30"
              placeholder={`Snapshot ${sourceTitle}`}
            />
          </label>

          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Strategic Note
            </span>
            <textarea
              rows={4}
              value={draft.note}
              onChange={(event) => onChange("note", event.target.value)}
              className="resize-none rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm leading-6 text-stone-100 outline-none transition focus:border-lime-300/30"
              placeholder="Catatan briefing, rute, atau objective map custom ini."
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/6 pt-4">
          <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
            Snapshot akan tersimpan di Strategic Saves akun ini.
          </p>
          <button
            type="submit"
            className="rounded-full border border-lime-300/20 bg-lime-300 px-4 py-2 font-public text-[10px] font-bold uppercase tracking-[0.2em] text-[#0a100e] transition hover:brightness-105"
          >
            Save Strategy
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

function FullscreenCustomMapToolbar({
  activeTool,
  selectedColor,
  brushSize,
  zoomPercent,
  boardActionsCount,
  redoStackCount,
  hasTextDraft,
  onSetTool,
  onSetColor,
  onSetBrushSize,
  onSave,
  onZoomIn,
  onZoomOut,
  onFitMap,
  onUndo,
  onRedo,
  onClearBoard,
  onToggleFullscreen,
}) {
  return (
    <div className="absolute inset-y-4 right-3 z-[65] flex items-center sm:right-5">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 16 }}
        className="w-[80px] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[22px] border border-white/10 bg-[#0f1518]/78 p-2.5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:w-[84px] sm:rounded-[26px] sm:p-3"
      >
        <div className="space-y-2">
          {DRAW_TOOL_OPTIONS.map((tool) => (
            <ToolbarIconButton
              key={`custom-fullscreen-${tool.id}`}
              active={activeTool === tool.id}
              icon={tool.icon}
              label={tool.label}
              onClick={() => onSetTool(tool.id)}
              sizeClass="h-10 w-10"
              className="mx-auto rounded-[14px]"
            />
          ))}
        </div>

        <div className="mt-3 border-t border-white/8 pt-3">
          <p className="text-center font-public text-[8px] uppercase tracking-[0.22em] text-stone-500">
            Color
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {COLOR_SWATCHES.map((color) => (
              <motion.button
                key={`custom-fullscreen-color-${color}`}
                type="button"
                onClick={() => onSetColor(color)}
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
                className={[
                  "group relative h-8 w-8 overflow-hidden rounded-[10px] border transition",
                  selectedColor === color
                    ? "border-stone-100 scale-105"
                    : "border-white/10 hover:border-white/30",
                ].join(" ")}
                style={{ backgroundColor: color }}
              >
                <span className="pointer-events-none absolute inset-x-1 top-1 h-px bg-white/60 opacity-0 blur-[1px] transition group-hover:opacity-100" />
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mt-3 border-t border-white/8 pt-3">
          <p className="text-center font-public text-[8px] uppercase tracking-[0.22em] text-stone-500">
            Size
          </p>
          <p className="mt-1 text-center font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
            {brushSize}
          </p>
          <input
            type="range"
            min="4"
            max="28"
            value={brushSize}
            onChange={(event) => onSetBrushSize(Number(event.target.value))}
            className="mt-2 h-2 w-full accent-[#E9C349]"
          />
        </div>

        <div className="mt-3 border-t border-white/8 pt-3">
          <p className="text-center font-public text-[8px] uppercase tracking-[0.22em] text-stone-500">
            Zoom
          </p>
          <p className="mt-1 text-center font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
            {zoomPercent}%
          </p>
          <div className="mt-2 space-y-2">
            <ToolbarIconButton icon="zoom-in" label="Zoom In" onClick={onZoomIn} sizeClass="h-10 w-10" className="mx-auto rounded-[14px]" />
            <ToolbarIconButton icon="zoom-out" label="Zoom Out" onClick={onZoomOut} sizeClass="h-10 w-10" className="mx-auto rounded-[14px]" />
            <ToolbarIconButton icon="reset" label="Fit Map" onClick={onFitMap} sizeClass="h-10 w-10" className="mx-auto rounded-[14px]" />
          </div>
        </div>

        <div className="mt-3 border-t border-white/8 pt-3">
          <div className="space-y-2">
            <ToolbarIconButton icon="save" label="Save Strategy" onClick={onSave} sizeClass="h-10 w-10" className="mx-auto rounded-[14px]" />
            <ToolbarIconButton icon="undo" label="Undo" disabled={boardActionsCount === 0} onClick={onUndo} sizeClass="h-10 w-10" className="mx-auto rounded-[14px]" />
            <ToolbarIconButton icon="redo" label="Redo" disabled={redoStackCount === 0} onClick={onRedo} sizeClass="h-10 w-10" className="mx-auto rounded-[14px]" />
            <ToolbarIconButton icon="trash" label="Clear Board" disabled={boardActionsCount === 0 && !hasTextDraft} onClick={onClearBoard} sizeClass="h-10 w-10" className="mx-auto rounded-[14px]" />
            <ToolbarIconButton icon="fullscreen-exit" label="Exit Fullscreen" onClick={onToggleFullscreen} sizeClass="h-10 w-10" className="mx-auto rounded-[14px]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CustomMapIntroOverlay({ progress, title }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(18px)" }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#06090b]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(190,242,100,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_34%),linear-gradient(180deg,rgba(7,10,12,0.94),rgba(4,6,8,0.98))]" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(190,242,100,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(190,242,100,0.18) 1px, transparent 1px)",
          backgroundSize: "116px 116px",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-[0.12]" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg px-5"
      >
        <div className="rounded-[30px] border border-white/10 bg-white/[0.05] p-7 text-center shadow-[0_30px_120px_rgba(0,0,0,0.46)] backdrop-blur-3xl">
          <motion.img
            src={paskusLightGif}
            alt="Paskus intro"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="mx-auto h-28 w-28 rounded-full object-contain shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:h-32 sm:w-32"
          />

          <p className="mt-7 font-public text-[10px] uppercase tracking-[0.42em] text-lime-300/80">
            Strategic Custom Map
          </p>
          <h2 className="mt-4 font-sans text-3xl font-bold uppercase text-stone-100">
            Opening Planner
          </h2>
          <p className="mt-4 text-sm leading-7 text-stone-400">
            Menyiapkan viewport dan board untuk {title || "custom map"} sebelum
            planner dibuka.
          </p>

          <div className="mt-9">
            <div className="flex items-center justify-between font-public text-[10px] uppercase tracking-[0.22em] text-stone-500">
              <span>Intro Phase</span>
              <span className="text-lime-300">{progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="h-full rounded-full bg-[linear-gradient(90deg,#a7f3d0,#bef264,#facc15)] shadow-[0_0_24px_rgba(190,242,100,0.28)]"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function StrategicCustomMapPlannerPage() {
  const navigate = useNavigate();
  const { mapId } = useParams();
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
  const strategicAccess = useMemo(() => getStrategicAccessForUser(user), [user]);
  const { data: strategicSaves, setData: setStrategicSaves } = useSyncedResource(
    RESOURCE_KEYS.strategicStrategicSaves,
    {
      defaultValue: [],
      saveDelay: 550,
      normalize: normalizeStrategicSaves,
      enabled: strategicAccess.saves,
    },
  );
  const mapEntry = useMemo(
    () => customMaps.find((entry) => entry.id === mapId) ?? null,
    [customMaps, mapId],
  );
  const viewportRef = useRef(null);
  const mapImageRef = useRef(null);
  const boardCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const strokeRef = useRef(null);
  const panSessionRef = useRef(null);
  const hydrationSignatureRef = useRef("");
  const pendingViewportRef = useRef(null);
  const introStartedAtRef = useRef(0);
  const fullscreenFitPendingRef = useRef(false);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ scale: 0.1, offsetX: 0, offsetY: 0 });
  const [boardActions, setBoardActions] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [activeTool, setActiveTool] = useState("pen");
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0]);
  const [brushSize, setBrushSize] = useState(14);
  const [hasFittedMap, setHasFittedMap] = useState(false);
  const [textDraft, setTextDraft] = useState(null);
  const [saveNotice, setSaveNotice] = useState("");
  const [saveFeedback, setSaveFeedback] = useState("");
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveDraft, setSaveDraft] = useState({
    title: "",
    note: "",
  });
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isPanDragging, setIsPanDragging] = useState(false);
  const [isMapImageLoaded, setIsMapImageLoaded] = useState(false);
  const [isMapIntroVisible, setIsMapIntroVisible] = useState(true);
  const [mapIntroProgress, setMapIntroProgress] = useState(8);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleteBurstVisible, setIsDeleteBurstVisible] = useState(false);

  useEffect(() => {
    const element = viewportRef.current;

    if (!element || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setViewportSize({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mapEntry) {
      return;
    }

    const nextViewport = mapEntry.board?.viewport;
    const nextSignature = getBoardSignature(
      mapEntry.board?.actions ?? [],
      nextViewport ?? null,
    );

    if (hydrationSignatureRef.current === nextSignature) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      hydrationSignatureRef.current = nextSignature;
      pendingViewportRef.current = nextViewport ?? null;
      setBoardActions(Array.isArray(mapEntry.board?.actions) ? mapEntry.board.actions : []);
      setRedoStack([]);
      setTextDraft(null);
      strokeRef.current = null;
      panSessionRef.current = null;
      setHasFittedMap(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [mapEntry]);

  useEffect(() => {
    if (
      !mapDimensions.width ||
      !mapDimensions.height ||
      !viewportSize.width ||
      !viewportSize.height
    ) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (!hasFittedMap) {
        const shouldForceFit = fullscreenFitPendingRef.current;
        fullscreenFitPendingRef.current = false;

        setViewport(
          (shouldForceFit
            ? null
            : resolveSavedViewport(
                pendingViewportRef.current,
                viewportSize.width,
                viewportSize.height,
                mapDimensions.width,
                mapDimensions.height,
              )) ??
            createFittedViewport(
              viewportSize.width,
              viewportSize.height,
              mapDimensions.width,
              mapDimensions.height,
            ),
        );
        setHasFittedMap(true);
        return;
      }

      setViewport((currentViewport) =>
        constrainViewport(
          currentViewport,
          viewportSize.width,
          viewportSize.height,
          mapDimensions.width,
          mapDimensions.height,
        ),
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [hasFittedMap, mapDimensions.height, mapDimensions.width, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (
      !mapEntry ||
      !mapDimensions.width ||
      !mapDimensions.height ||
      !viewportSize.width ||
      !viewportSize.height ||
      !hasFittedMap
    ) {
      return;
    }

    const nextSignature = getBoardSignature(boardActions, viewport);

    if (hydrationSignatureRef.current === nextSignature) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      hydrationSignatureRef.current = nextSignature;
      setCustomMaps((currentMaps) =>
        currentMaps.map((entry) =>
          entry.id === mapEntry.id
            ? {
                ...entry,
                updatedAt: new Date().toISOString(),
                board: {
                  actions: boardActions,
                  viewport,
                },
              }
            : entry,
        ),
      );
      setSaveNotice("Map custom tersimpan otomatis.");
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    boardActions,
    hasFittedMap,
    mapDimensions.height,
    mapDimensions.width,
    mapEntry,
    setCustomMaps,
    viewport,
    viewportSize.height,
    viewportSize.width,
  ]);

  useEffect(() => {
    if (!saveNotice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSaveNotice(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [saveNotice]);

  useEffect(() => {
    if (!saveFeedback) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSaveFeedback(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [saveFeedback]);

  const forceFitViewportToElement = useCallback(
    (viewportElement) => {
      if (
        !viewportElement ||
        !mapDimensions.width ||
        !mapDimensions.height
      ) {
        return false;
      }

      const bounds = viewportElement.getBoundingClientRect();

      if (bounds.width <= 0 || bounds.height <= 0) {
        return false;
      }

      const nextViewportSize = {
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };

      pendingViewportRef.current = null;
      setViewportSize(nextViewportSize);
      setViewport(
        createFittedViewport(
          nextViewportSize.width,
          nextViewportSize.height,
          mapDimensions.width,
          mapDimensions.height,
        ),
      );
      setHasFittedMap(true);
      return true;
    },
    [mapDimensions.height, mapDimensions.width],
  );

  useEffect(() => {
    const handleFullscreenChange = () => {
      const viewportElement = viewportRef.current;
      const isFullscreen = document.fullscreenElement === viewportElement;

      setIsMapFullscreen(isFullscreen);

      if (viewportElement) {
        const refit = () => {
          if (forceFitViewportToElement(viewportElement)) {
            fullscreenFitPendingRef.current = false;
          }
        };

        window.requestAnimationFrame(refit);
        window.setTimeout(refit, 90);
        window.setTimeout(refit, 220);
      }

      fullscreenFitPendingRef.current = true;
      pendingViewportRef.current = null;
      setHasFittedMap(false);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [forceFitViewportToElement]);

  useEffect(() => {
    if (
      !fullscreenFitPendingRef.current ||
      !mapDimensions.width ||
      !mapDimensions.height ||
      !viewportSize.width ||
      !viewportSize.height
    ) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setViewport(
        createFittedViewport(
          viewportSize.width,
          viewportSize.height,
          mapDimensions.width,
          mapDimensions.height,
        ),
      );
      setHasFittedMap(true);
      fullscreenFitPendingRef.current = false;
    }, 90);

    return () => window.clearTimeout(timeout);
  }, [
    mapDimensions.height,
    mapDimensions.width,
    viewportSize.height,
    viewportSize.width,
  ]);

  useEffect(() => {
    if (!isMapIntroVisible) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setMapIntroProgress((currentProgress) => {
        if (isMapImageLoaded && hasFittedMap) {
          return currentProgress >= 100 ? 100 : Math.min(100, currentProgress + 10);
        }

        return currentProgress >= 88 ? currentProgress : currentProgress + 6;
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, [hasFittedMap, isMapImageLoaded, isMapIntroVisible]);

  useEffect(() => {
    if (!isMapIntroVisible || !isMapImageLoaded || !hasFittedMap) {
      return undefined;
    }

    const elapsed = Date.now() - introStartedAtRef.current;
    const remaining = Math.max(0, CUSTOM_MAP_INTRO_MIN_DURATION - elapsed) + 180;
    const timeout = window.setTimeout(() => {
      setMapIntroProgress(100);
      setIsMapIntroVisible(false);
    }, remaining);

    return () => window.clearTimeout(timeout);
  }, [hasFittedMap, isMapImageLoaded, isMapIntroVisible]);

  const syncLoadedMapImage = useCallback((imageElement) => {
    const nextWidth = imageElement.naturalWidth || imageElement.width || 1;
    const nextHeight = imageElement.naturalHeight || imageElement.height || 1;
    const viewportElement = viewportRef.current;

    setMapDimensions((currentDimensions) => {
      if (
        currentDimensions.width === nextWidth &&
        currentDimensions.height === nextHeight
      ) {
        return currentDimensions;
      }

      return {
        width: nextWidth,
        height: nextHeight,
      };
    });

    if (viewportElement) {
      const bounds = viewportElement.getBoundingClientRect();

      if (bounds.width > 0 && bounds.height > 0) {
        const nextViewportSize = {
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
        };
        const nextViewport =
          resolveSavedViewport(
            pendingViewportRef.current,
            nextViewportSize.width,
            nextViewportSize.height,
            nextWidth,
            nextHeight,
          ) ??
          createFittedViewport(
            nextViewportSize.width,
            nextViewportSize.height,
            nextWidth,
            nextHeight,
          );

        setViewportSize({
          width: nextViewportSize.width,
          height: nextViewportSize.height,
        });
        setViewport(nextViewport);
        setIsMapImageLoaded(true);
        setHasFittedMap(true);
        return;
      }
    }

    setIsMapImageLoaded(true);
    setHasFittedMap(false);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      introStartedAtRef.current = Date.now();
      setIsMapIntroVisible(true);
      setMapIntroProgress(8);

      const currentImage = mapImageRef.current;

      if (currentImage?.complete && currentImage.naturalWidth > 0) {
        syncLoadedMapImage(currentImage);
        return;
      }

      setIsMapImageLoaded(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [mapEntry?.id, syncLoadedMapImage]);

  const handleMapImageLoad = useCallback((event) => {
    syncLoadedMapImage(event.currentTarget);
  }, [syncLoadedMapImage]);

  const renderBoardCanvas = useCallback(() => {
    const canvas = boardCanvasRef.current;

    if (!canvas || !viewportSize.width || !viewportSize.height) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    boardActions.forEach((action) => {
      if (action.type === "stroke") {
        drawStrokePath(context, action, viewport);
      } else {
        drawTextAction(context, action, viewport);
      }
    });
  }, [boardActions, viewport, viewportSize.height, viewportSize.width]);

  const renderPreviewCanvas = useCallback(() => {
    const canvas = previewCanvasRef.current;

    if (!canvas || !viewportSize.width || !viewportSize.height) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    if (!strokeRef.current) {
      return;
    }

    drawStrokePath(context, strokeRef.current, viewport);
  }, [viewport, viewportSize.height, viewportSize.width]);

  useLayoutEffect(() => {
    const canvases = [boardCanvasRef.current, previewCanvasRef.current].filter(Boolean);

    if (!canvases.length || !viewportSize.width || !viewportSize.height) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvases.forEach((canvas) => {
      canvas.width = Math.floor(viewportSize.width * devicePixelRatio);
      canvas.height = Math.floor(viewportSize.height * devicePixelRatio);
      canvas.style.width = `${viewportSize.width}px`;
      canvas.style.height = `${viewportSize.height}px`;
    });
  }, [viewportSize.height, viewportSize.width]);

  useLayoutEffect(() => {
    renderBoardCanvas();
  }, [renderBoardCanvas]);

  useLayoutEffect(() => {
    renderPreviewCanvas();
  }, [renderPreviewCanvas]);

  const fitMap = useCallback(() => {
    if (
      !mapDimensions.width ||
      !mapDimensions.height ||
      !viewportSize.width ||
      !viewportSize.height
    ) {
      return;
    }

    setViewport(
      createFittedViewport(
        viewportSize.width,
        viewportSize.height,
        mapDimensions.width,
        mapDimensions.height,
      ),
    );
    setHasFittedMap(true);
  }, [mapDimensions.height, mapDimensions.width, viewportSize.height, viewportSize.width]);

  const toggleMapFullscreen = useCallback(async () => {
    if (typeof document === "undefined") {
      return;
    }

    const mapElement = viewportRef.current;

    if (!mapElement) {
      return;
    }

    try {
      if (document.fullscreenElement === mapElement) {
        await document.exitFullscreen();
        return;
      }

      await mapElement.requestFullscreen();
    } catch {
      // Ignore fullscreen API failures silently.
    }
  }, []);

  const adjustZoom = useCallback(
    (factor) => {
      if (
        !mapDimensions.width ||
        !mapDimensions.height ||
        !viewportSize.width ||
        !viewportSize.height
      ) {
        return;
      }

      setViewport((currentViewport) => {
        const zoomAnchor = {
          x: viewportSize.width / 2,
          y: viewportSize.height / 2,
        };
        const worldPoint = screenToWorld(zoomAnchor, currentViewport);
        return constrainViewport(
          {
            scale: clamp(currentViewport.scale * factor, MIN_SCALE, MAX_SCALE),
            offsetX: zoomAnchor.x - worldPoint.x * clamp(currentViewport.scale * factor, MIN_SCALE, MAX_SCALE),
            offsetY: zoomAnchor.y - worldPoint.y * clamp(currentViewport.scale * factor, MIN_SCALE, MAX_SCALE),
          },
          viewportSize.width,
          viewportSize.height,
          mapDimensions.width,
          mapDimensions.height,
        );
      });
    },
    [mapDimensions.height, mapDimensions.width, viewportSize.height, viewportSize.width],
  );

  const handleWheel = useCallback(
    (event) => {
      if (
        !isMapFullscreen ||
        !viewportRef.current ||
        !mapDimensions.width ||
        !mapDimensions.height ||
        !viewportSize.width ||
        !viewportSize.height
      ) {
        return;
      }

      event.preventDefault();

      const point = getRelativePoint(event, viewportRef.current);
      const factor = event.deltaY < 0 ? 1.08 : 0.92;

      setViewport((currentViewport) => {
        const nextScale = clamp(currentViewport.scale * factor, MIN_SCALE, MAX_SCALE);
        const worldPoint = screenToWorld(point, currentViewport);

        return constrainViewport(
          {
            scale: nextScale,
            offsetX: point.x - worldPoint.x * nextScale,
            offsetY: point.y - worldPoint.y * nextScale,
          },
          viewportSize.width,
          viewportSize.height,
          mapDimensions.width,
          mapDimensions.height,
        );
      });
    },
    [
      isMapFullscreen,
      mapDimensions.height,
      mapDimensions.width,
      viewportSize.height,
      viewportSize.width,
    ],
  );

  const finalizeStroke = useCallback(() => {
    const stroke = strokeRef.current;

    if (!stroke) {
      return;
    }

    strokeRef.current = null;
    renderPreviewCanvas();

    if (!stroke.points.length) {
      return;
    }

    setBoardActions((currentActions) => [...currentActions, stroke]);
    setRedoStack([]);
  }, [renderPreviewCanvas]);

  const handleUndo = useCallback(() => {
    setBoardActions((currentActions) => {
      if (!currentActions.length) {
        return currentActions;
      }

      const removedAction = currentActions[currentActions.length - 1];
      setRedoStack((currentRedo) => [removedAction, ...currentRedo]);
      return currentActions.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setRedoStack((currentRedo) => {
      if (!currentRedo.length) {
        return currentRedo;
      }

      const [restoredAction, ...restoredQueue] = currentRedo;
      setBoardActions((currentActions) => [...currentActions, restoredAction]);
      return restoredQueue;
    });
  }, []);

  const handleOpenSaveModal = useCallback(() => {
    if (!strategicAccess.saves) {
      setSaveFeedback("Akses strategic save tidak tersedia untuk akun ini.");
      return;
    }

    const timestamp = new Date().toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    setSaveDraft({
      title: `${mapEntry?.title || "Custom Map"} Snapshot ${timestamp}`,
      note: "",
    });
    setIsSaveModalOpen(true);
  }, [strategicAccess.saves, mapEntry?.title]);

  const handleSaveStrategy = useCallback(
    async (event) => {
      event.preventDefault();

      if (!strategicAccess.saves) {
        setIsSaveModalOpen(false);
        setSaveFeedback("Akun ini tidak memiliki izin menyimpan strategic save.");
        return;
      }

      const title = saveDraft.title.trim();

      if (!title || !mapEntry) {
        return;
      }

      const nextSave = {
        id: createActionId("custom-strategy"),
        ownerId: user?.id ?? null,
        ownerUsername: user?.username ?? "",
        ownerLabel: user?.label ?? "Strategic User",
        sourceType: "custom-map",
        sourceMapId: mapEntry.id,
        sourceMapTitle: mapEntry.title,
        title,
        note: saveDraft.note.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        actionCount: boardActions.length,
        categoryCount: 0,
        snapshot: {
          actions: boardActions,
          enabledCategoryIds: [],
          viewport: {
            ...viewport,
          },
          frame: {
            width: viewportSize.width,
            height: viewportSize.height,
          },
          customMap: {
            mapId: mapEntry.id,
            title: mapEntry.title,
            imageDataUrl: mapEntry.imageDataUrl,
            width: mapDimensions.width,
            height: mapDimensions.height,
          },
        },
      };

      const thumbnailDataUrl = await renderStrategySnapshotDataUrl(nextSave, {
        width: 720,
        height: 430,
        includeHeader: false,
      });
      nextSave.thumbnailDataUrl = thumbnailDataUrl;

      const nextSaves = [nextSave, ...strategicSaves].slice(0, 64);
      setStrategicSaves(nextSaves);
      setIsSaveModalOpen(false);
      setSaveFeedback(`Strategy saved: ${title}`);
    },
    [
      boardActions,
      strategicAccess.saves,
      mapDimensions.height,
      mapDimensions.width,
      mapEntry,
      saveDraft.note,
      saveDraft.title,
      setStrategicSaves,
      strategicSaves,
      user?.id,
      user?.label,
      user?.username,
      viewport,
      viewportSize.height,
      viewportSize.width,
    ],
  );

  const linkedSaveCount = useMemo(
    () => countCustomMapLinkedSaves(strategicSaves, mapEntry?.id),
    [mapEntry?.id, strategicSaves],
  );

  const handleDeleteMap = useCallback(() => {
    if (!mapEntry || !isPrimaryAdmin) {
      return;
    }

    const feedbackMessage =
      linkedSaveCount > 0
        ? `${mapEntry.title} dihapus bersama ${linkedSaveCount} strategic save terkait.`
        : `${mapEntry.title} berhasil dihapus dari custom map vault.`;

    setCustomMaps((currentMaps) => removeCustomMapEntries(currentMaps, mapEntry.id));
    setStrategicSaves((currentSaves) =>
      removeCustomMapLinkedSaves(currentSaves, mapEntry.id),
    );
    setIsDeleteModalOpen(false);
    navigate("/dashboard/custom-maps", {
      replace: true,
      state: {
        customMapFeedback: feedbackMessage,
      },
    });
  }, [
    isPrimaryAdmin,
    linkedSaveCount,
    mapEntry,
    navigate,
    setCustomMaps,
    setStrategicSaves,
  ]);

  const commitTextDraft = () => {
    if (!textDraft) {
      return;
    }

    const textValue = textDraft.text.trim();
    setTextDraft(null);

    if (!textValue) {
      return;
    }

    setBoardActions((currentActions) => [
      ...currentActions,
      {
        id: createActionId("text"),
        type: "text",
        x: textDraft.x,
        y: textDraft.y,
        text: textValue,
        color: selectedColor,
        size: clamp(Math.round(brushSize * 1.6), 14, 44),
      },
    ]);
    setRedoStack([]);
  };

  const releasePointerCapture = (event) => {
    const currentTarget = event.currentTarget;

    if (currentTarget?.hasPointerCapture?.(event.pointerId)) {
      currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerDown = (event) => {
    if (
      !viewportRef.current ||
      !mapDimensions.width ||
      !mapDimensions.height ||
      textDraft
    ) {
      return;
    }

    const point = getRelativePoint(event, viewportRef.current);
    event.currentTarget.setPointerCapture?.(event.pointerId);

    if (event.button === 2 || activeTool === "pan") {
      panSessionRef.current = {
        startX: point.x,
        startY: point.y,
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY,
        scale: viewport.scale,
      };
      setIsPanDragging(true);
      return;
    }

    if (activeTool === "text") {
      const worldPoint = screenToWorld(point, viewport);
      setTextDraft({
        x: worldPoint.x,
        y: worldPoint.y,
        text: "",
      });
      return;
    }

    if (activeTool !== "pen" && activeTool !== "eraser") {
      return;
    }

    const worldPoint = screenToWorld(point, viewport);
    strokeRef.current = {
      id: createActionId("stroke"),
      type: "stroke",
      tool: activeTool,
      color: selectedColor,
      size: brushSize,
      points: [
        {
          x: worldPoint.x,
          y: worldPoint.y,
        },
      ],
    };
    renderPreviewCanvas();
  };

  const handlePointerMove = (event) => {
    if (!viewportRef.current || !mapDimensions.width || !mapDimensions.height) {
      return;
    }

    const point = getRelativePoint(event, viewportRef.current);

    if (panSessionRef.current) {
      const session = panSessionRef.current;
      setViewport((currentViewport) =>
        constrainViewport(
          {
            scale: session.scale ?? currentViewport.scale,
            offsetX: session.offsetX + point.x - session.startX,
            offsetY: session.offsetY + point.y - session.startY,
          },
          viewportSize.width,
          viewportSize.height,
          mapDimensions.width,
          mapDimensions.height,
        ),
      );
      return;
    }

    if (!strokeRef.current) {
      return;
    }

    const worldPoint = screenToWorld(point, viewport);
    strokeRef.current = {
      ...strokeRef.current,
      points: [
        ...strokeRef.current.points,
        {
          x: worldPoint.x,
          y: worldPoint.y,
        },
      ],
    };
    renderPreviewCanvas();
  };

  const handlePointerUp = (event) => {
    releasePointerCapture(event);
    panSessionRef.current = null;
    setIsPanDragging(false);
    if (strokeRef.current) {
      finalizeStroke();
    }
  };

  const handlePointerCancel = (event) => {
    releasePointerCapture(event);
    panSessionRef.current = null;
    setIsPanDragging(false);
    strokeRef.current = null;
    renderPreviewCanvas();
  };

  const textDraftScreenPosition = textDraft ? worldToScreen(textDraft, viewport) : null;
  const textDraftLeft = textDraftScreenPosition
    ? clamp(textDraftScreenPosition.x, 12, Math.max(12, viewportSize.width - 244))
    : 12;
  const textDraftTop = textDraftScreenPosition
    ? clamp(textDraftScreenPosition.y, 12, Math.max(12, viewportSize.height - 190))
    : 12;
  const zoomPercent = Math.round(viewport.scale * 100);

  if (loading) {
    return (
      <section className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-xl">
        <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
          Loading Custom Planner
        </p>
        <p className="mt-4 text-sm leading-7 text-stone-400">
          Memuat map custom dari database...
        </p>
      </section>
    );
  }

  if (!mapEntry) {
    return (
      <section className="rounded-[28px] border border-white/8 bg-white/[0.035] p-8 text-center backdrop-blur-xl">
        <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
          Custom Map
        </p>
        <h2 className="mt-3 font-sans text-3xl font-bold uppercase text-stone-100">
          Map tidak ditemukan
        </h2>
        <p className="mt-4 text-sm leading-7 text-stone-400">
          Map custom yang kamu buka tidak ada di database atau sudah dihapus.
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard/custom-maps")}
          className="mt-5 rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.18em] text-stone-200 transition hover:bg-white/[0.08]"
        >
          Kembali ke Map Custom
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.32em] text-lime-300/80">
              Draw-Only Planner
            </p>
            <h1 className="mt-3 font-sans text-2xl font-bold uppercase leading-none text-stone-100 sm:text-3xl 2xl:text-4xl">
              {mapEntry.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">
              {mapEntry.description || "Planner custom tanpa marker intel. Gunakan untuk coretan, rute, dan note cepat."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {saveNotice ? (
              <span className="rounded-full border border-lime-300/18 bg-lime-300/10 px-4 py-2 font-public text-[10px] uppercase tracking-[0.18em] text-lime-200">
                {saveNotice}
              </span>
            ) : null}
            {saveFeedback ? (
              <span className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-4 py-2 font-public text-[10px] uppercase tracking-[0.18em] text-cyan-100">
                {saveFeedback}
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleOpenSaveModal}
              className="rounded-[18px] border border-lime-300/18 bg-lime-300 px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.18em] text-[#0b100e] transition hover:brightness-105"
            >
              Save Snapshot
            </button>
            {isPrimaryAdmin ? (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="rounded-[18px] border border-rose-400/14 bg-rose-500/10 px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.18em] text-rose-200 transition hover:border-rose-400/22 hover:bg-rose-500/16"
              >
                Hapus Map
              </button>
            ) : null}
            <button
              type="button"
              onClick={toggleMapFullscreen}
              className="rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.18em] text-stone-200 transition hover:bg-white/[0.08]"
            >
              {isMapFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/custom-maps")}
              className="rounded-[18px] border border-white/8 bg-white/[0.04] px-4 py-3 font-public text-[10px] font-bold uppercase tracking-[0.18em] text-stone-200 transition hover:bg-white/[0.08]"
            >
              Kembali
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            onWheel={handleWheel}
            onDoubleClick={(event) => event.preventDefault()}
            onContextMenu={(event) => event.preventDefault()}
            onDragStart={(event) => event.preventDefault()}
            className={[
              "relative overflow-hidden bg-[#080b0d] touch-none select-none",
              isMapFullscreen
                ? "h-screen min-h-screen rounded-none border-0 shadow-none"
                : "h-[clamp(360px,58vh,760px)] rounded-[24px] border border-white/8 md:h-[clamp(400px,62vh,820px)] xl:h-[clamp(430px,66vh,880px)] 2xl:h-[clamp(470px,70vh,940px)]",
              isPanDragging
                ? "cursor-grabbing"
                : activeTool === "pan"
                  ? "cursor-grab active:cursor-grabbing"
                  : activeTool === "text"
                    ? "cursor-copy"
                    : "cursor-crosshair",
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-[10px] z-[1] rounded-[22px] border border-white/6 bg-black/8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]" />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(190,242,100,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(190,242,100,0.14) 1px, transparent 1px)",
                backgroundSize: "92px 92px",
              }}
            />

            <img
              ref={mapImageRef}
              key={mapEntry.id}
              src={mapEntry.imageDataUrl}
              alt={mapEntry.title}
              onLoad={handleMapImageLoad}
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 select-none"
              style={{
                width: mapDimensions.width || undefined,
                height: mapDimensions.height || undefined,
                transformOrigin: "top left",
                transform: `translate3d(${viewport.offsetX}px, ${viewport.offsetY}px, 0) scale(${viewport.scale})`,
                willChange: "transform",
                backfaceVisibility: "hidden",
              }}
            />

            <canvas ref={boardCanvasRef} className="pointer-events-none absolute inset-0 z-20" />
            <canvas
              ref={previewCanvasRef}
              className="pointer-events-none absolute inset-0 z-30"
            />

            <AnimatePresence>
              {textDraft ? (
                <motion.div
                  initial={{ opacity: 0, y: 22, scale: 0.92, filter: "blur(12px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 12, scale: 0.96, filter: "blur(8px)" }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute z-40 w-56 rounded-[18px] border border-lime-300/16 bg-[#11161a]/96 p-3 shadow-[0_20px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl"
                  style={{
                    left: `${textDraftLeft}px`,
                    top: `${textDraftTop}px`,
                  }}
                >
                  <div className="pointer-events-none absolute inset-x-3 top-6 h-5 bg-[linear-gradient(90deg,rgba(103,232,249,0.18),rgba(190,242,100,0.14),rgba(244,63,94,0.16))] blur-sm" />
                  <p className="relative z-10 font-public text-[9px] uppercase tracking-[0.2em] text-lime-300/80">
                    Add Tactical Note
                  </p>
                  <textarea
                    autoFocus
                    rows={4}
                    value={textDraft.text}
                    onChange={(event) =>
                      setTextDraft((currentDraft) =>
                        currentDraft
                          ? {
                              ...currentDraft,
                              text: event.target.value,
                            }
                          : currentDraft,
                      )
                    }
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault();
                        commitTextDraft();
                      }
                    }}
                    className="relative z-10 mt-3 w-full resize-none rounded-[14px] border border-white/8 bg-black/20 px-3 py-2 text-sm text-stone-100 outline-none transition focus:border-lime-300/24"
                    placeholder="Tulis note..."
                  />
                  <div className="relative z-10 mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setTextDraft(null)}
                      className="rounded-[14px] border border-white/8 bg-white/[0.04] px-3 py-2 font-public text-[9px] font-bold uppercase tracking-[0.18em] text-stone-300"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={commitTextDraft}
                      className="rounded-[14px] border border-lime-300/18 bg-lime-300 px-3 py-2 font-public text-[9px] font-bold uppercase tracking-[0.18em] text-[#0b100e]"
                    >
                      Simpan
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="pointer-events-none absolute left-4 top-4 z-40 rounded-[18px] border border-white/8 bg-[#161b1d]/88 px-4 py-3 backdrop-blur-md">
              <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                Active Tool
              </p>
              <p className="mt-2 font-mono text-sm text-stone-100">
                {activeTool.toUpperCase()}
              </p>
            </div>

            <AnimatePresence>
              {isMapFullscreen ? (
                <FullscreenCustomMapToolbar
                  activeTool={activeTool}
                  selectedColor={selectedColor}
                  brushSize={brushSize}
                  zoomPercent={zoomPercent}
                  boardActionsCount={boardActions.length}
                  redoStackCount={redoStack.length}
                  hasTextDraft={Boolean(textDraft)}
                  onSetTool={setActiveTool}
                  onSetColor={setSelectedColor}
                  onSetBrushSize={setBrushSize}
                  onSave={handleOpenSaveModal}
                  onZoomIn={() => adjustZoom(1.18)}
                  onZoomOut={() => adjustZoom(0.84)}
                  onFitMap={fitMap}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onClearBoard={() => {
                    setBoardActions([]);
                    setRedoStack([]);
                    setTextDraft(null);
                  }}
                  onToggleFullscreen={toggleMapFullscreen}
                />
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
              {isMapIntroVisible ? (
                <CustomMapIntroOverlay
                  progress={mapIntroProgress}
                  title={mapEntry.title}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
              Tools
            </p>
            <div className="mt-4 grid gap-2">
              <ToolButton active={activeTool === "pan"} onClick={() => setActiveTool("pan")}>
                Pan
              </ToolButton>
              <ToolButton active={activeTool === "pen"} onClick={() => setActiveTool("pen")}>
                Pencil
              </ToolButton>
              <ToolButton
                active={activeTool === "eraser"}
                onClick={() => setActiveTool("eraser")}
              >
                Delete
              </ToolButton>
              <ToolButton active={activeTool === "text"} onClick={() => setActiveTool("text")}>
                Text
              </ToolButton>
            </div>

            <div className="mt-4 border-t border-white/8 pt-4">
              <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Warna
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={[
                      "h-11 rounded-[14px] border transition",
                      selectedColor === color
                        ? "border-lime-300/30 ring-2 ring-lime-300/30"
                        : "border-white/8",
                    ].join(" ")}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-white/8 pt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  Size
                </p>
                <p className="font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
                  {brushSize}
                </p>
              </div>
              <input
                type="range"
                min="4"
                max="40"
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
                className="mt-3 h-2 w-full accent-[#E9C349]"
              />
            </div>

            <div className="mt-4 border-t border-white/8 pt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  Zoom
                </p>
                <p className="font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
                  {zoomPercent}%
                </p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <ToolButton onClick={() => adjustZoom(1.15)}>+</ToolButton>
                <ToolButton onClick={() => adjustZoom(0.87)}>-</ToolButton>
                <ToolButton onClick={fitMap}>Fit</ToolButton>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl">
            <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
              Board Actions
            </p>
            <div className="mt-4 grid gap-2">
              <ToolButton
                onClick={handleUndo}
              >
                Undo
              </ToolButton>
              <ToolButton
                disabled={redoStack.length === 0}
                onClick={handleRedo}
              >
                Redo
              </ToolButton>
              <ToolButton
                onClick={() => {
                  setBoardActions([]);
                  setRedoStack([]);
                  setTextDraft(null);
                }}
              >
                Clear Board
              </ToolButton>
              <ToolButton onClick={handleOpenSaveModal}>
                Save Snapshot
              </ToolButton>
              {isPrimaryAdmin ? (
                <ToolButton onClick={() => setIsDeleteModalOpen(true)}>
                  Hapus Map
                </ToolButton>
              ) : null}
              <ToolButton onClick={toggleMapFullscreen}>
                {isMapFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </ToolButton>
            </div>

            <div className="mt-4 border-t border-white/8 pt-4 text-sm leading-7 text-stone-400">
              <p>
                Dibuat oleh:{" "}
                <span className="font-semibold text-stone-200">
                  {mapEntry.createdBy?.label || user?.label || "Strategic"}
                </span>
              </p>
              <p className="mt-1">
                Coretan aktif:{" "}
                <span className="font-semibold text-stone-200">{boardActions.length}</span>
              </p>
              <p className="mt-1">
                Strategic Saves:{" "}
                <span className="font-semibold text-stone-200">
                  {strategicAccess.saves ? "Enabled" : "No Access"}
                </span>
              </p>
            </div>
          </section>
        </aside>
      </section>

      <AnimatePresence>
        {isSaveModalOpen ? (
          <CustomMapSaveModal
            draft={saveDraft}
            onChange={(field, value) =>
              setSaveDraft((currentDraft) => ({
                ...currentDraft,
                [field]: value,
              }))
            }
            onClose={() => setIsSaveModalOpen(false)}
            onSubmit={handleSaveStrategy}
            sourceTitle={mapEntry.title}
          />
        ) : null}

      {isDeleteModalOpen ? (
          <CustomMapDeleteModal
            mapTitle={mapEntry.title}
            saveCount={linkedSaveCount}
            onCancel={() => setIsDeleteModalOpen(false)}
            onConfirm={() => {
              setIsDeleteModalOpen(false);
              setIsDeleteBurstVisible(true);
            }}
          />
        ) : null}

        <DeleteBurstOverlay
          visible={isDeleteBurstVisible}
          onComplete={() => {
            setIsDeleteBurstVisible(false);
            handleDeleteMap();
          }}
        />
      </AnimatePresence>
    </div>
  );
}
