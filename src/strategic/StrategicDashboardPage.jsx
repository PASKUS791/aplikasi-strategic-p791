/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import RotatingPaskusLogo from "../components/RotatingPaskusLogo";
import { useAuth } from "../lib/strategicAuth";
import { RESOURCE_KEYS, useSyncedResource } from "../lib/resources";
import { canStrategicUserAddMarkers, getStrategicAccessForUser } from "./strategicAccess";
import { MarkerCategoryGlyph } from "./markerIcons";
import { getSupplementalMarkerIntel } from "./markerSupplementalIntel";
import {
  RONOGRAD_MAP_DATA,
  SUPPLEMENTAL_ENEMY_CATEGORIES_FOR_MARKERS,
  SUPPLEMENTAL_ENEMY_CATEGORY_IDS_FOR_MARKERS,
} from "./ronogradMapData";
import { renderStrategySnapshotDataUrl } from "./snapshotRenderer";

const ENEMY_INTEL_ROOT_CATEGORY_ID = "enemy-intel";

function getEffectiveCategoryId(categoryId) {
  return SUPPLEMENTAL_ENEMY_CATEGORY_IDS_FOR_MARKERS.includes(categoryId)
    ? ENEMY_INTEL_ROOT_CATEGORY_ID
    : categoryId;
}

function isMarkerCategoryEnabled(categoryId, enabledCategoryIds) {
  if (enabledCategoryIds.includes(categoryId)) {
    return true;
  }

  const effectiveCategoryId = getEffectiveCategoryId(categoryId);
  return effectiveCategoryId !== categoryId && enabledCategoryIds.includes(effectiveCategoryId);
}

import {
  DEFAULT_PLANNER_STATE,
  normalizePlannerState,
  normalizeStrategicSaves,
} from "./strategicSaves";
import {
  getThreatIntelForMarker,
  isThreatIntelMarker,
} from "./threatIntelData";
const MAP_WIDTH = RONOGRAD_MAP_DATA.mapBounds[1][0];
const MAP_HEIGHT = RONOGRAD_MAP_DATA.mapBounds[1][1];
const DEFAULT_ENABLED_CATEGORY_IDS = RONOGRAD_MAP_DATA.categories.map(
  (category) => category.id,
);
const COLOR_SWATCHES = [
  "#E9C349",
  "#A7F3D0",
  "#67E8F9",
  "#F97316",
  "#FA005A",
  "#FA0000",
  "#E5E7EB",
];
const DRAW_TOOL_OPTIONS = [
  { id: "pan", label: "Pan" },
  { id: "pen", label: "Pencil" },
  { id: "eraser", label: "Delete" },
  { id: "text", label: "Text" },
  { id: "marker", label: "Add Marker" },
];
const MIN_SCALE = 0.05;
const MAX_SCALE = 3.4;
const MAP_INTRO_MIN_DURATION = 8000;
const QUICK_INTEL_PAGE_SIZE = 10;
const PANEL_SHELL_CLASS =
  "rounded-[28px] border border-white/8 bg-white/[0.035] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:border-lime-300/16 sm:p-5";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function constrainViewport(nextViewport, width, height) {
  const scale = clamp(nextViewport.scale, MIN_SCALE, MAX_SCALE);
  const scaledWidth = MAP_WIDTH * scale;
  const scaledHeight = MAP_HEIGHT * scale;

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

function createFittedViewport(width, height) {
  const nextScale = clamp(
    Math.min(width / MAP_WIDTH, height / MAP_HEIGHT) * 0.98,
    MIN_SCALE,
    MAX_SCALE,
  );

  return constrainViewport(
    {
      scale: nextScale,
      offsetX: (width - MAP_WIDTH * nextScale) / 2,
      offsetY: (height - MAP_HEIGHT * nextScale) / 2,
    },
    width,
    height,
  );
}

function normalizeViewportForFrame(nextViewport, viewportSize) {
  if (!viewportSize.width || !viewportSize.height) {
    return {
      scale: clamp(nextViewport.scale, MIN_SCALE, MAX_SCALE),
      offsetX: nextViewport.offsetX,
      offsetY: nextViewport.offsetY,
    };
  }

  return constrainViewport(nextViewport, viewportSize.width, viewportSize.height);
}

function areViewportsEqual(firstViewport, secondViewport, epsilon = 0.0001) {
  if (!firstViewport || !secondViewport) {
    return false;
  }

  return (
    Math.abs(firstViewport.scale - secondViewport.scale) < epsilon &&
    Math.abs(firstViewport.offsetX - secondViewport.offsetX) < epsilon &&
    Math.abs(firstViewport.offsetY - secondViewport.offsetY) < epsilon
  );
}

function getViewportSignature(viewport) {
  if (!viewport) {
    return "null";
  }

  return [
    Number(viewport.scale).toFixed(5),
    Number(viewport.offsetX).toFixed(2),
    Number(viewport.offsetY).toFixed(2),
  ].join(":");
}

function getBoardActionsSignature(actions = []) {
  return JSON.stringify(
    actions.map((action) => ({
      id: action.id ?? "",
      type: action.type ?? "",
      color: action.color ?? "",
      size: Number(action.size) || 0,
      x: Number(action.x) || 0,
      y: Number(action.y) || 0,
      text: action.text ?? "",
      points: Array.isArray(action.points)
        ? action.points.map((point) => [
            Number(point?.x) || 0,
            Number(point?.y) || 0,
          ])
        : [],
    })),
  );
}

function createActionId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatInteger(value) {
  return new Intl.NumberFormat("id-ID").format(Math.round(value));
}

function normalizeBoardAction(action, index) {
  if (!action || typeof action !== "object") {
    return null;
  }

  if (action.type === "text") {
    return {
      id: action.id ?? `text-${index}`,
      type: "text",
      x: clamp(Number(action.x) || 0, 0, MAP_WIDTH),
      y: clamp(Number(action.y) || 0, 0, MAP_HEIGHT),
      text: typeof action.text === "string" ? action.text : "",
      color: typeof action.color === "string" ? action.color : COLOR_SWATCHES[0],
      size: clamp(Number(action.size) || 18, 10, 48),
    };
  }

  if (!Array.isArray(action.points) || action.points.length === 0) {
    return null;
  }

  return {
    id: action.id ?? `stroke-${index}`,
    type: "stroke",
    tool: action.tool === "eraser" ? "eraser" : "pen",
    color: typeof action.color === "string" ? action.color : COLOR_SWATCHES[0],
    size: clamp(Number(action.size) || 12, 2, 40),
    points: action.points.map((point) => ({
      x: clamp(Number(point.x) || 0, 0, MAP_WIDTH),
      y: clamp(Number(point.y) || 0, 0, MAP_HEIGHT),
    })),
  };
}

function loadStoredPlannerState(value = DEFAULT_PLANNER_STATE) {
  const plannerState = normalizePlannerState(value);
  const actions = Array.isArray(plannerState.actions)
    ? plannerState.actions
        .map((action, index) => normalizeBoardAction(action, index))
        .filter(Boolean)
    : [];
  const storedViewport =
    plannerState.viewport &&
    typeof plannerState.viewport === "object" &&
    Number.isFinite(plannerState.viewport.scale) &&
    Number.isFinite(plannerState.viewport.offsetX) &&
    Number.isFinite(plannerState.viewport.offsetY)
      ? {
          scale: clamp(plannerState.viewport.scale, MIN_SCALE, MAX_SCALE),
          offsetX: plannerState.viewport.offsetX,
          offsetY: plannerState.viewport.offsetY,
        }
      : null;

  return {
    actions,
    enabledCategoryIds: plannerState.enabledCategoryIds,
    viewport: storedViewport,
    customMarkers: plannerState.customMarkers || [],
  };
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

function getMarkerAbbreviation(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getMarkerBadgeText(category) {
  if (typeof category?.symbol === "string" && category.symbol.trim()) {
    return category.symbol.trim().toUpperCase();
  }

  return getMarkerAbbreviation(category?.name ?? "MR");
}

function areCategoryIdListsEqual(firstList = [], secondList = []) {
  if (firstList === secondList) {
    return true;
  }

  if (firstList.length !== secondList.length) {
    return false;
  }

  return firstList.every((value, index) => value === secondList[index]);
}

function MarkerBadge({
  category,
  sizeClass = "h-10 w-10",
  glyphClass = "h-[18px] w-[18px]",
  roundedClass = "rounded-full",
  bordered = true,
  className = "",
}) {
  const fallbackText = getMarkerBadgeText(category);

  return (
    <span
      className={[
        "grid place-items-center",
        roundedClass,
        bordered ? "border" : "",
        sizeClass,
        className,
      ].join(" ")}
      style={{
        backgroundColor: category?.color ?? "#E9C349",
        borderColor: bordered ? `${category?.color ?? "#E9C349"}66` : "transparent",
        color: category?.symbolColor ?? "#05080a",
      }}
    >
      <MarkerCategoryGlyph
        category={category}
        fallbackText={fallbackText}
        className={glyphClass}
      />
    </span>
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

  if (name === "erase") {
    return (
      <svg {...sharedProps}>
        <path d="M5 6h10" />
        <path d="M7.5 6V4.5h5V6" />
        <path d="M6.3 6 7 15.5h6L13.7 6" />
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

  if (name === "search") {
    return (
      <svg {...sharedProps}>
        <circle cx="8.5" cy="8.5" r="4.5" />
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

  if (name === "layers") {
    return (
      <svg {...sharedProps}>
        <path d="m10 4 6 3-6 3-6-3 6-3Z" />
        <path d="m4 10 6 3 6-3" />
        <path d="m4 13 6 3 6-3" />
      </svg>
    );
  }

  if (name === "marker") {
    return (
      <svg {...sharedProps}>
        <path d="M10 16s4-3.9 4-7.5a4 4 0 1 0-8 0C6 12.1 10 16 10 16Z" />
        <circle cx="10" cy="8.5" r="1.4" />
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

function PlannerButton({ active, disabled = false, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex items-center gap-2 border px-3 py-2 font-public text-[10px] font-bold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-45 sm:text-[11px]",
        active
          ? "border-lime-300/30 bg-lime-300/16 text-lime-100 shadow-[0_0_30px_rgba(190,242,100,0.12)]"
          : "border-white/6 bg-white/[0.03] text-stone-300 hover:border-white/10 hover:bg-white/[0.05]",
      ].join(" ")}
    >
      <PlannerIcon name={icon} className="h-4 w-4" />
      {label}
    </button>
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
      data-map-toolbar="true"
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

function FullscreenMapToolbar({
  isVisible,
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
  onReveal,
  onScheduleHide,
  onHoverChange,
  canAddMarkers,
}) {
  return (
    <div className="pointer-events-none absolute inset-y-4 right-0 z-[65] flex items-center overflow-visible">
      <motion.div
        data-map-toolbar="true"
        initial={false}
        animate={{ x: isVisible ? 0 : 108 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onPointerEnter={() => {
          onHoverChange(true);
          onReveal();
        }}
        onPointerLeave={() => {
          onHoverChange(false);
          onScheduleHide();
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
        className="pointer-events-auto mr-2 w-[80px] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[22px] border border-white/10 bg-[#0f1518]/78 p-2.5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:mr-3 sm:w-[84px] sm:rounded-[26px] sm:p-3"
      >
        <div className="space-y-2">
          {DRAW_TOOL_OPTIONS.filter((tool) => tool.id !== "marker" || canAddMarkers).map((tool) => (
            <ToolbarIconButton
              key={`fullscreen-${tool.id}`}
              active={activeTool === tool.id}
              icon={
                tool.id === "pan"
                  ? "focus"
                  : tool.id === "pen"
                    ? "draw"
                    : tool.id === "eraser"
                      ? "trash"
                      : tool.id
              }
              label={tool.label}
              onClick={() => {
                onSetTool(tool.id);
              }}
            />
          ))}
        </div>
        <FullscreenMapToolbarSections
          selectedColor={selectedColor}
          brushSize={brushSize}
          zoomPercent={zoomPercent}
          boardActionsCount={boardActionsCount}
          redoStackCount={redoStackCount}
          hasTextDraft={hasTextDraft}
          onSetColor={onSetColor}
          onSetBrushSize={onSetBrushSize}
          onSave={onSave}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFitMap={onFitMap}
          onUndo={onUndo}
          onRedo={onRedo}
          onClearBoard={onClearBoard}
          onToggleFullscreen={onToggleFullscreen}
        />
      </motion.div>

      <motion.button
          type="button"
          data-map-toolbar="true"
          title="Show tools"
          aria-label="Show tools"
          initial={false}
          animate={{
            opacity: isVisible ? 0.64 : 1,
            x: isVisible ? 0 : -6,
          }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onPointerEnter={() => {
            onHoverChange(true);
            onReveal();
          }}
          onPointerLeave={() => {
            onHoverChange(false);
            onScheduleHide();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onReveal();
            onScheduleHide(2400);
          }}
          whileHover={{ x: -8 }}
          whileTap={{ scale: 0.96 }}
          className="pointer-events-auto group absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-l-[18px] border border-r-0 border-lime-300/18 bg-[#11181c]/86 px-3 py-3 text-stone-200 shadow-[0_14px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl"
        >
        <span className="pointer-events-none absolute inset-x-2 top-1 h-px bg-[linear-gradient(90deg,rgba(103,232,249,0),rgba(103,232,249,0.85),rgba(244,63,94,0.55),rgba(103,232,249,0))] opacity-0 blur-[1px] transition duration-200 group-hover:opacity-100" />
        <PlannerIcon name="layers" className="h-4 w-4 text-lime-300" />
        <span className="font-public text-[9px] uppercase tracking-[0.22em] text-stone-300">
          Tools
        </span>
      </motion.button>
    </div>
  );
}

function FullscreenMapToolbarSections({
  selectedColor,
  brushSize,
  zoomPercent,
  boardActionsCount,
  redoStackCount,
  hasTextDraft,
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
    <>
      <div className="mt-3 border-t border-white/8 pt-3">
        <p className="text-center font-public text-[8px] uppercase tracking-[0.22em] text-stone-500">
          Color
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {COLOR_SWATCHES.map((color) => (
            <motion.button
              key={`fullscreen-color-${color}`}
              type="button"
              data-map-toolbar="true"
              title={`Pilih ${color}`}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onSetColor(color);
              }}
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
          data-map-toolbar="true"
          min="4"
          max="28"
          value={brushSize}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onWheel={(event) => event.stopPropagation()}
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
          <ToolbarIconButton
            icon="zoom-in"
            label="Zoom In"
            onClick={onZoomIn}
            sizeClass="h-10 w-10"
            className="mx-auto rounded-[14px]"
          />
          <ToolbarIconButton
            icon="zoom-out"
            label="Zoom Out"
            onClick={onZoomOut}
            sizeClass="h-10 w-10"
            className="mx-auto rounded-[14px]"
          />
          <ToolbarIconButton
            icon="reset"
            label="Fit Map"
            onClick={onFitMap}
            sizeClass="h-10 w-10"
            className="mx-auto rounded-[14px]"
          />
        </div>
      </div>

      <div className="mt-3 border-t border-white/8 pt-3">
        <div className="space-y-2">
          <ToolbarIconButton
            icon="save"
            label="Save Strategy"
            onClick={onSave}
            sizeClass="h-10 w-10"
            className="mx-auto rounded-[14px]"
          />
          <ToolbarIconButton
            icon="undo"
            label="Undo"
            disabled={boardActionsCount === 0}
            onClick={onUndo}
            sizeClass="h-10 w-10"
            className="mx-auto rounded-[14px]"
          />
          <ToolbarIconButton
            icon="redo"
            label="Redo"
            disabled={redoStackCount === 0}
            onClick={onRedo}
            sizeClass="h-10 w-10"
            className="mx-auto rounded-[14px]"
          />
          <ToolbarIconButton
            icon="trash"
            label="Clear Board"
            disabled={boardActionsCount === 0 && !hasTextDraft}
            onClick={onClearBoard}
            sizeClass="h-10 w-10"
            className="mx-auto rounded-[14px]"
          />
          <ToolbarIconButton
            icon="fullscreen-exit"
            label="Exit Fullscreen"
            onClick={onToggleFullscreen}
            sizeClass="h-10 w-10"
            className="mx-auto rounded-[14px]"
          />
        </div>
      </div>
    </>
  );
}

function StrategySaveModal({
  draft,
  onChange,
  onClose,
  onSubmit,
}) {
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
              Save Strategic Snapshot
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
              placeholder="Operation Ronograd Alpha"
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
              placeholder="Ringkasan strategi, fase serangan, atau catatan koordinasi."
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/6 pt-4">
          <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
            Snapshot akan menyimpan coretan, text note, filter kategori, dan zoom view.
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

function MapIntroOverlay({ progress }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: "blur(18px)" }}
      transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-[80] flex items-center justify-center overflow-hidden rounded-[28px] bg-[#06090b]"
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
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg px-5"
      >
        <div className="rounded-[30px] border border-white/10 bg-white/[0.05] p-7 text-center shadow-[0_30px_120px_rgba(0,0,0,0.46)] backdrop-blur-3xl">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto flex w-full justify-center"
          >
            <RotatingPaskusLogo
              sizeClassName="h-28 w-28 sm:h-32 sm:w-32"
              glowClassName="bg-lime-300/22"
              imageClassName="shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            />
          </motion.div>

          <p className="mt-7 font-public text-[10px] uppercase tracking-[0.42em] text-lime-300/80">
            Strategic Center
          </p>
          <h2 className="mt-4 font-sans text-3xl font-bold uppercase text-stone-100">
            Opening Map
          </h2>
          <p className="mt-4 text-sm leading-7 text-stone-400">
            Memuat layer Ronograd dan menyiapkan area planner sebelum peta
            dibuka.
          </p>

          <div className="mt-9">
            <div className="flex items-center justify-between font-public text-[10px] uppercase tracking-[0.22em] text-stone-500">
              <span>Map Intro</span>
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

function translateThreatClassification(classification) {
  if (classification === "Hostile Location") {
    return "Lokasi Musuh";
  }

  if (classification === "Hostile Outpost") {
    return "Pos Musuh";
  }

  if (classification === "Hidden Hostile Entity") {
    return "Entitas Musuh Tersembunyi";
  }

  return classification;
}

function translateKitLine(line) {
  return line
    .replace(/^Primary:/i, "Utama:")
    .replace(/^Support:/i, "Pendukung:")
    .replace(/^Reason:/i, "Alasan:");
}

function ThreatIntelModal({ marker, intel, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[290] flex items-start justify-center overflow-y-auto bg-black/66 px-5 pb-8 pt-6 backdrop-blur-md md:px-8 md:pb-10 md:pt-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97, filter: "blur(16px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 18, scale: 0.98, filter: "blur(10px)" }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-2xl rounded-[28px] border border-lime-300/14 bg-[#101518]/72 shadow-[0_28px_120px_rgba(0,0,0,0.54)] backdrop-blur-2xl"
      >
        <div className="border-b border-white/6 bg-[linear-gradient(135deg,rgba(190,242,100,0.09),rgba(16,21,24,0.4),rgba(16,21,24,0.9))] px-5 py-4 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-public text-[10px] uppercase tracking-[0.3em] text-lime-300/85">
                Intel Ancaman BRM5
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <MarkerBadge
                  category={marker.category}
                  sizeClass="h-10 w-10"
                  glyphClass="h-4 w-4"
                  roundedClass="rounded-[14px]"
                  className="shadow-[0_0_18px_rgba(0,0,0,0.24)]"
                />
                <div className="min-w-0">
                  <h3 className="truncate font-sans text-xl font-bold uppercase text-stone-100 md:text-2xl">
                    {marker.popup.title}
                  </h3>
                  <p className="mt-1 font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
                    {translateThreatClassification(intel.classification)} • X{" "}
                    {formatInteger(marker.position[0])} • Y{" "}
                    {formatInteger(marker.position[1])}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 font-public text-[10px] uppercase tracking-[0.18em] text-stone-300 transition hover:bg-white/[0.08]"
            >
              Tutup
            </button>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300/90">
            {intel.summary}
          </p>
        </div>

        <div className="grid gap-3 px-5 py-4 md:px-6 lg:grid-cols-[1.14fr_0.96fr]">
          <div className="grid gap-3">
            <div className="rounded-[20px] border border-white/7 bg-black/16 p-3.5 backdrop-blur-xl">
              <p className="font-public text-[10px] uppercase tracking-[0.22em] text-lime-300/80">
                Poin Penting
              </p>
              <div className="mt-3 space-y-2">
                {intel.keyPoints.map((point, index) => (
                  <div
                    key={`${marker.id}-point-${index}`}
                    className="flex items-start gap-3 rounded-[16px] border border-white/6 bg-black/18 px-3 py-2.5"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.5)]" />
                    <p className="text-sm leading-6 text-stone-300">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/7 bg-black/16 p-3.5 backdrop-blur-xl">
              <p className="font-public text-[10px] uppercase tracking-[0.22em] text-amber-300/85">
                Intel Tersembunyi
              </p>
              <div className="mt-3 space-y-2">
                {intel.hiddenIntel.map((point, index) => (
                  <div
                    key={`${marker.id}-hidden-${index}`}
                    className="flex items-start gap-3 rounded-[16px] border border-white/6 bg-black/18 px-3 py-2.5"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.4)]" />
                    <p className="text-sm leading-6 text-stone-300">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[20px] border border-white/7 bg-black/16 p-3.5 backdrop-blur-xl">
              <p className="font-public text-[10px] uppercase tracking-[0.22em] text-cyan-300/85">
                Saran Senjata
              </p>
              <div className="mt-3 space-y-2">
                {intel.suggestedKit.map((point, index) => (
                  <div
                    key={`${marker.id}-kit-${index}`}
                    className="rounded-[16px] border border-white/6 bg-black/18 px-3 py-2.5"
                  >
                    <p className="text-sm leading-6 text-stone-300">
                      {translateKitLine(point)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/7 bg-black/16 p-3.5 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="font-public text-[10px] uppercase tracking-[0.22em] text-stone-400">
                  Sumber Intel
                </p>
                {intel.inferred ? (
                  <span className="rounded-full border border-amber-300/18 bg-amber-300/12 px-2.5 py-1 font-public text-[9px] uppercase tracking-[0.18em] text-amber-200">
                    Sebagian Inferensi
                  </span>
                ) : null}
              </div>

              <div className="mt-3 grid gap-2">
                {intel.sources.map((source) => (
                  <a
                    key={`${marker.id}-${source.url}`}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[16px] border border-white/6 bg-black/18 px-3 py-3 transition hover:border-lime-300/18 hover:bg-lime-300/[0.05]"
                  >
                    <p className="font-sans text-sm font-semibold uppercase text-stone-100">
                      {source.label}
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-stone-500">
                      {source.url}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-white/7 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(0,0,0,0.12))] p-3.5 backdrop-blur-xl">
              <p className="font-public text-[10px] uppercase tracking-[0.22em] text-stone-500">
                Catatan Planner
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-400">
                Gunakan intel ini sebagai ringkasan cepat sebelum menandai rute,
                overwatch, breach lane, atau support drop di board utama.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AddMarkerModal({ draft, onChange, onClose, onSubmit, categories }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        className="w-full max-w-md rounded-[30px] border border-white/8 bg-[#121618]/92 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.48)] backdrop-blur-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/6 pb-4">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.28em] text-lime-300">
              Tactical Planner
            </p>
            <h3 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
              Add New Marker
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
              Marker Title
            </span>
            <input
              autoFocus
              required
              value={draft.title}
              onChange={(event) => onChange("title", event.target.value)}
              className="rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/30"
              placeholder="e.g. Enemy Sniper Nest"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Category
            </span>
            <select
              value={draft.categoryId}
              onChange={(event) => onChange("categoryId", event.target.value)}
              className="rounded-[18px] border border-white/8 bg-[#161b1d] px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/30"
            >
              <option value="">Select a category...</option>
              {categories
                .filter(
                  (cat) =>
                    cat.id === "enemy-intel" ||
                    !SUPPLEMENTAL_ENEMY_CATEGORY_IDS_FOR_MARKERS.includes(cat.id),
                )
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </label>

          {draft.categoryId === "enemy-intel" ? (
            <label className="grid gap-2">
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
                Enemy Intel Type
              </span>
              <select
                value={draft.categoryId === "enemy-intel" ? draft.enemyIntelType || "" : ""}
                onChange={(event) => onChange("enemyIntelType", event.target.value)}
                className="rounded-[18px] border border-white/8 bg-[#161b1d] px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/30"
              >
                <option value="">Select enemy type...</option>
                {SUPPLEMENTAL_ENEMY_CATEGORIES_FOR_MARKERS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-400">
              Description / Notes
            </span>
            <textarea
              rows={3}
              value={draft.description}
              onChange={(event) => onChange("description", event.target.value)}
              className="resize-none rounded-[18px] border border-white/8 bg-black/20 px-4 py-3 text-sm leading-6 text-stone-100 outline-none transition focus:border-lime-300/30"
              placeholder="Detail intel, jumlah unit musuh, atau catatan taktis..."
            />
          </label>

          <div className="rounded-[18px] border border-white/6 bg-black/10 px-4 py-3">
            <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
              Coordinates
            </p>
            <p className="mt-1 font-mono text-xs text-stone-300">
              X: {Math.round(draft.x)} | Y: {Math.round(draft.y)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-white/6 pt-4">
          <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
            Marker will be visible to all operators.
          </p>
          <button
            type="submit"
            disabled={
              !draft.title.trim() ||
              !draft.categoryId ||
              (draft.categoryId === "enemy-intel" && !draft.enemyIntelType)
            }
            className="rounded-full border border-lime-300/20 bg-lime-300 px-5 py-2.5 font-public text-[10px] font-bold uppercase tracking-[0.2em] text-[#0a100e] transition hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Marker
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

export default function StrategicDashboardPage() {
  // Function Group: synced resources, runtime refs, and UI state.
  const { user } = useAuth();
  const {
    data: plannerResource,
    setData: setPlannerResource,
    loading: plannerLoading,
    error: plannerError,
  } = useSyncedResource(RESOURCE_KEYS.strategicPlannerState, {
    defaultValue: DEFAULT_PLANNER_STATE,
    saveDelay: 700,
    normalize: loadStoredPlannerState,
  });
  const strategicAccess = useMemo(() => getStrategicAccessForUser(user), [user]);
  const canAddMarkers = useMemo(() => canStrategicUserAddMarkers(user), [user]);
  const {
    data: strategicSaves,
    setData: setStrategicSaves,
  } = useSyncedResource(RESOURCE_KEYS.strategicStrategicSaves, {
    defaultValue: [],
    saveDelay: 550,
    normalize: normalizeStrategicSaves,
    enabled: strategicAccess.saves,
  });
  const viewportRef = useRef(null);
  const boardCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const boardCanvasRenderFrameRef = useRef(null);
  const renderBoardCanvasRef = useRef(() => {});
  const panSessionRef = useRef(null);
  const strokeRef = useRef(null);
  const fullscreenToolbarHideTimeoutRef = useRef(null);
  const fullscreenToolbarHoveredRef = useRef(false);
  const plannerHydratedRef = useRef(false);
  const lastHydratedViewportSignatureRef = useRef("uninitialized");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [enabledCategoryIds, setEnabledCategoryIds] = useState(
    plannerResource.enabledCategoryIds,
  );
  const [boardActions, setBoardActions] = useState(plannerResource.actions);
  const [redoStack, setRedoStack] = useState([]);
  const [activeTool, setActiveTool] = useState("pan");
  const [selectedColor, setSelectedColor] = useState(COLOR_SWATCHES[0]);
  useEffect(() => {
    if (activeTool === "marker" && !canAddMarkers) {
      setActiveTool("pan");
    }
  }, [activeTool, canAddMarkers]);
  const [brushSize, setBrushSize] = useState(14);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState(
    plannerResource.viewport ?? {
      scale: 0.1,
      offsetX: 0,
      offsetY: 0,
    },
  );
  const [hasFittedMap, setHasFittedMap] = useState(Boolean(plannerResource.viewport));
  const [textDraft, setTextDraft] = useState(null);
  const [markerDraft, setMarkerDraft] = useState(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveDraft, setSaveDraft] = useState({
    title: "",
    note: "",
  });
  const [saveFeedback, setSaveFeedback] = useState("");
  const [intelModalMarkerId, setIntelModalMarkerId] = useState(null);
  const [isDashboardBooting, setIsDashboardBooting] = useState(true);
  const [dashboardBootProgress, setDashboardBootProgress] = useState(8);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isFullscreenToolbarVisible, setIsFullscreenToolbarVisible] = useState(true);
  const [isFullscreenToolbarHovered, setIsFullscreenToolbarHovered] = useState(false);
  const [isTemporaryPanActive, setIsTemporaryPanActive] = useState(false);
  const [quickIntelPage, setQuickIntelPage] = useState(1);
  const boardActionsSignatureRef = useRef("");

  const categoriesById = useMemo(
    () =>
      new Map(
        RONOGRAD_MAP_DATA.categories.map((category) => [category.id, category]),
      ),
    [],
  );

  const allMarkers = useMemo(() => {
    const staticMarkers = RONOGRAD_MAP_DATA.markers || [];
    const dynamicMarkers = Array.isArray(plannerResource.customMarkers) ? plannerResource.customMarkers : [];
    return [...staticMarkers, ...dynamicMarkers];
  }, [plannerResource.customMarkers]);

  const normalizedMarkers = useMemo(
    () =>
      allMarkers.map((marker) => {
        const filterCategory = categoriesById.get(marker.categoryId);
        const category = marker.visualCategory ?? filterCategory;
        const supplementalIntel = getSupplementalMarkerIntel(marker);

        return {
          ...marker,
          category,
          filterCategory,
          resolvedDescription:
            marker.popup?.description?.trim() ||
            supplementalIntel.resolvedDescription ||
            "Tidak ada deskripsi intel yang terekam untuk node ini.",
          secretIntel: supplementalIntel.secretIntel,
          mapX: marker.position[0],
          mapY: MAP_HEIGHT - marker.position[1],
          searchText: [
            marker.popup.title,
            supplementalIntel.resolvedDescription,
            marker.popup.link?.label,
            marker.popup.link?.url,
            marker.popup.image,
            category?.name ?? "",
            filterCategory?.name ?? "",
            category?.symbol ?? "",
            supplementalIntel.secretIntel.join(" "),
          ]
            .join(" ")
            .toLowerCase(),
        };
      }),
    [allMarkers, categoriesById],
  );

  const filteredMarkers = useMemo(() => {
    const normalizedSearchTerm = deferredSearchTerm.trim().toLowerCase();

    return normalizedMarkers.filter((marker) => {
      if (!isMarkerCategoryEnabled(marker.categoryId, enabledCategoryIds)) {
        return false;
      }

      if (!normalizedSearchTerm) {
        return true;
      }

      return marker.searchText.includes(normalizedSearchTerm);
    });
  }, [deferredSearchTerm, enabledCategoryIds, normalizedMarkers]);

  const screenMarkers = useMemo(
    () =>
      filteredMarkers.map((marker) => ({
        ...marker,
        screenPosition: worldToScreen(
          { x: marker.mapX, y: marker.mapY },
          viewport,
        ),
      })),
    [filteredMarkers, viewport],
  );
  const boardActionsSignature = useMemo(
    () => getBoardActionsSignature(boardActions),
    [boardActions],
  );
  const plannerResourceActionsSignature = useMemo(
    () => getBoardActionsSignature(plannerResource.actions),
    [plannerResource.actions],
  );

  useEffect(() => {
    boardActionsSignatureRef.current = boardActionsSignature;
  }, [boardActionsSignature]);

  const selectedMarker =
    normalizedMarkers.find((marker) => marker.id === selectedMarkerId) ?? null;

  const selectedMarkerScreenPosition =
    screenMarkers.find((marker) => marker.id === selectedMarkerId)?.screenPosition ??
    (selectedMarker
      ? worldToScreen(
          { x: selectedMarker.mapX, y: selectedMarker.mapY },
          viewport,
        )
      : null);

  const hoveredMarker = hoveredMarkerId
    ? normalizedMarkers.find((marker) => marker.id === hoveredMarkerId) ?? null
    : null;
  const intelModalMarker = intelModalMarkerId
    ? normalizedMarkers.find((marker) => marker.id === intelModalMarkerId) ?? null
    : null;
  const activeThreatIntel = intelModalMarker
    ? getThreatIntelForMarker(intelModalMarker)
    : null;

  const categoryCounts = useMemo(() => {
    const counts = new Map();

    normalizedMarkers.forEach((marker) => {
      const categoryId = getEffectiveCategoryId(marker.categoryId);
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    });

    return counts;
  }, [normalizedMarkers]);

  const visibleCategoryCounts = useMemo(() => {
    const counts = new Map();

    filteredMarkers.forEach((marker) => {
      const categoryId = getEffectiveCategoryId(marker.categoryId);
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    });

    return counts;
  }, [filteredMarkers]);
  const quickIntelTotalPages = Math.max(
    1,
    Math.ceil(filteredMarkers.length / QUICK_INTEL_PAGE_SIZE),
  );
  const normalizedQuickIntelPage = clamp(quickIntelPage, 1, quickIntelTotalPages);
  const pagedQuickIntelMarkers = useMemo(() => {
    const startIndex = (normalizedQuickIntelPage - 1) * QUICK_INTEL_PAGE_SIZE;
    return filteredMarkers.slice(startIndex, startIndex + QUICK_INTEL_PAGE_SIZE);
  }, [filteredMarkers, normalizedQuickIntelPage]);

  const renderBoardCanvasNow = useCallback(() => {
    if (boardCanvasRenderFrameRef.current) {
      window.cancelAnimationFrame(boardCanvasRenderFrameRef.current);
      boardCanvasRenderFrameRef.current = null;
    }

    renderBoardCanvasRef.current?.();
  }, []);

  const renderPreviewCanvasNow = useCallback(() => {
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
    context.globalAlpha = 1;
    context.imageSmoothingEnabled = true;

    const stroke = strokeRef.current;

    if (!stroke || stroke.type !== "stroke" || stroke.points.length === 0) {
      return;
    }

    context.save();
    context.globalCompositeOperation = "source-over";
    context.strokeStyle =
      stroke.tool === "eraser" ? "rgba(248,250,252,0.82)" : stroke.color;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = Math.max(2.4, stroke.size * Math.max(viewport.scale, 0.18));
    context.globalAlpha = stroke.tool === "eraser" ? 0.85 : 1;
    if (stroke.tool === "eraser") {
      context.setLineDash([8, 6]);
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
  }, [viewport, viewportSize.height, viewportSize.width]);

  const commitStrokeToBoardCanvas = useCallback(
    (stroke) => {
      const canvas = boardCanvasRef.current;

      if (
        !canvas ||
        !stroke ||
        stroke.type !== "stroke" ||
        stroke.points.length === 0 ||
        !viewportSize.width ||
        !viewportSize.height
      ) {
        return;
      }

      const context = canvas.getContext("2d");
      const devicePixelRatio = window.devicePixelRatio || 1;

      if (!context) {
        return;
      }

      context.save();
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
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
    },
    [viewport, viewportSize.height, viewportSize.width],
  );

  useEffect(
    () => () => {
      if (boardCanvasRenderFrameRef.current) {
        window.cancelAnimationFrame(boardCanvasRenderFrameRef.current);
      }
    },
    [],
  );

  const fitMapToViewport = () => {
    if (!viewportSize.width || !viewportSize.height) {
      return;
    }

    setViewport((currentViewport) => {
      const nextViewport = createFittedViewport(
        viewportSize.width,
        viewportSize.height,
      );

      return areViewportsEqual(currentViewport, nextViewport)
        ? currentViewport
        : nextViewport;
    });
    setHasFittedMap(true);
  };

  const toggleMapFullscreen = async () => {
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
  };

  const centerOnMarker = useCallback(
    (marker, targetScale = viewport.scale) => {
      if (!viewportSize.width || !viewportSize.height) {
        return;
      }

      const nextScale = clamp(targetScale, MIN_SCALE, MAX_SCALE);

      setViewport((currentViewport) => {
        const nextViewport = constrainViewport(
          {
            scale: nextScale,
            offsetX: viewportSize.width / 2 - marker.mapX * nextScale,
            offsetY: viewportSize.height / 2 - marker.mapY * nextScale,
          },
          viewportSize.width,
          viewportSize.height,
        );

        return areViewportsEqual(currentViewport, nextViewport)
          ? currentViewport
          : nextViewport;
      });
    },
    [viewport.scale, viewportSize.height, viewportSize.width],
  );

  const adjustZoom = (factor, focusPoint) => {
    if (!viewportSize.width || !viewportSize.height) {
      return;
    }

    const zoomAnchor = focusPoint ?? {
      x: viewportSize.width / 2,
      y: viewportSize.height / 2,
    };

    setViewport((currentViewport) => {
      const worldPoint = screenToWorld(zoomAnchor, currentViewport);
      const nextScale = clamp(currentViewport.scale * factor, MIN_SCALE, MAX_SCALE);
      const nextViewport = constrainViewport(
        {
          scale: nextScale,
          offsetX: zoomAnchor.x - worldPoint.x * nextScale,
          offsetY: zoomAnchor.y - worldPoint.y * nextScale,
        },
        viewportSize.width,
        viewportSize.height,
      );

      return areViewportsEqual(currentViewport, nextViewport)
        ? currentViewport
        : nextViewport;
    });
  };

  const clearFullscreenToolbarHide = useCallback(() => {
    if (fullscreenToolbarHideTimeoutRef.current) {
      window.clearTimeout(fullscreenToolbarHideTimeoutRef.current);
      fullscreenToolbarHideTimeoutRef.current = null;
    }
  }, []);

  const revealFullscreenToolbar = useCallback(() => {
    clearFullscreenToolbarHide();
    setIsFullscreenToolbarVisible(true);
  }, [clearFullscreenToolbarHide]);

  const scheduleFullscreenToolbarHide = useCallback(
    (delay = 1800) => {
      clearFullscreenToolbarHide();

      if (
        !isMapFullscreen ||
        isDashboardBooting ||
        fullscreenToolbarHoveredRef.current
      ) {
        return;
      }

      fullscreenToolbarHideTimeoutRef.current = window.setTimeout(() => {
        if (!fullscreenToolbarHoveredRef.current) {
          setIsFullscreenToolbarVisible(false);
        }
      }, delay);
    },
    [clearFullscreenToolbarHide, isDashboardBooting, isMapFullscreen],
  );

  useEffect(() => {
    const element = viewportRef.current;

    if (!element || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const updateViewportDimensions = () => {
      const bounds = element.getBoundingClientRect();

      setViewportSize((currentSize) => {
        const nextWidth = Math.round(bounds.width);
        const nextHeight = Math.round(bounds.height);

        if (
          currentSize.width === nextWidth &&
          currentSize.height === nextHeight
        ) {
          return currentSize;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setViewportSize((currentSize) => {
        const nextWidth = Math.round(entry.contentRect.width);
        const nextHeight = Math.round(entry.contentRect.height);

        if (
          currentSize.width === nextWidth &&
          currentSize.height === nextHeight
        ) {
          return currentSize;
        }

        return {
          width: nextWidth,
          height: nextHeight,
        };
      });
    });

    updateViewportDimensions();
    observer.observe(element);
    window.addEventListener("resize", updateViewportDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateViewportDimensions);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    const handleFullscreenChange = () => {
      setIsMapFullscreen(document.fullscreenElement === viewportRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange();

    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!hasFittedMap && viewportSize.width && viewportSize.height) {
      setViewport((currentViewport) => {
        const nextViewport = createFittedViewport(
          viewportSize.width,
          viewportSize.height,
        );

        return areViewportsEqual(currentViewport, nextViewport)
          ? currentViewport
          : nextViewport;
      });
      setHasFittedMap(true);
      return;
    }

    if (viewportSize.width && viewportSize.height) {
      setViewport((currentViewport) => {
        const nextViewport = normalizeViewportForFrame(currentViewport, {
          width: viewportSize.width,
          height: viewportSize.height,
        });

        return areViewportsEqual(currentViewport, nextViewport)
          ? currentViewport
          : nextViewport;
      });
    }
  }, [hasFittedMap, viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let isActive = true;
    let hasMapLoaded = false;
    let hasFinalized = false;
    let rafId = 0;
    let finishTimeout = 0;
    const startTime = performance.now();
    const mapImage = new window.Image();

    const updateProgress = () => {
      if (!isActive) {
        return;
      }

      const elapsed = performance.now() - startTime;
      const target = hasMapLoaded
        ? 100
        : Math.min(92, 8 + Math.floor(elapsed / 22));

      setDashboardBootProgress((currentProgress) =>
        target > currentProgress ? target : currentProgress,
      );

      if (!hasMapLoaded) {
        rafId = window.requestAnimationFrame(updateProgress);
      }
    };

    const finalizeBoot = () => {
      if (!isActive || hasFinalized) {
        return;
      }

      hasFinalized = true;
      hasMapLoaded = true;
      setDashboardBootProgress(100);
      finishTimeout = window.setTimeout(() => {
        if (isActive) {
          setIsDashboardBooting(false);
        }
      }, 280);
    };

    mapImage.onload = finalizeBoot;
    mapImage.onerror = finalizeBoot;
    mapImage.src = RONOGRAD_MAP_DATA.mapImage;
    rafId = window.requestAnimationFrame(updateProgress);

    const minimumDelay = window.setTimeout(() => {
      if (mapImage.complete) {
        finalizeBoot();
      }
    }, MAP_INTRO_MIN_DURATION);

    return () => {
      isActive = false;
      mapImage.onload = null;
      mapImage.onerror = null;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(minimumDelay);
      window.clearTimeout(finishTimeout);
    };
  }, []);

  useEffect(() => {
    // Function Group: hydrate server planner state into local interactive state.
    if (plannerLoading) {
      return;
    }

    plannerHydratedRef.current = true;
    if (boardActionsSignatureRef.current !== plannerResourceActionsSignature) {
      setBoardActions(plannerResource.actions);
      setRedoStack([]);
    }
    setEnabledCategoryIds((currentCategoryIds) =>
      areCategoryIdListsEqual(
        currentCategoryIds,
        plannerResource.enabledCategoryIds,
      )
        ? currentCategoryIds
        : plannerResource.enabledCategoryIds,
    );
    const nextViewportSignature = getViewportSignature(plannerResource.viewport);

    if (
      plannerResource.viewport &&
      nextViewportSignature !== lastHydratedViewportSignatureRef.current
    ) {
      setViewport((currentViewport) => {
        const normalizedViewport =
          viewportSize.width && viewportSize.height
            ? normalizeViewportForFrame(plannerResource.viewport, viewportSize)
            : plannerResource.viewport;

        return areViewportsEqual(currentViewport, normalizedViewport)
          ? currentViewport
          : normalizedViewport;
      });
      setHasFittedMap(true);
    }

    lastHydratedViewportSignatureRef.current = nextViewportSignature;
  }, [
    plannerLoading,
    plannerResource,
    plannerResourceActionsSignature,
    viewportSize,
  ]);

  useEffect(() => {
    const isVisibleCategory = (marker) =>
      marker && isMarkerCategoryEnabled(marker.categoryId, enabledCategoryIds);

    if (selectedMarker && !isVisibleCategory(selectedMarker)) {
      setSelectedMarkerId(null);
    }

    if (hoveredMarker && !isVisibleCategory(hoveredMarker)) {
      setHoveredMarkerId(null);
    }

    if (intelModalMarker && !isVisibleCategory(intelModalMarker)) {
      setIntelModalMarkerId(null);
    }
  }, [enabledCategoryIds, hoveredMarker, intelModalMarker, selectedMarker]);

  useEffect(() => {
    setQuickIntelPage(1);
  }, [deferredSearchTerm, enabledCategoryIds]);

  useEffect(() => {
    if (quickIntelPage > quickIntelTotalPages) {
      setQuickIntelPage(quickIntelTotalPages);
    }
  }, [quickIntelPage, quickIntelTotalPages]);

  useEffect(() => {
    // Function Group: persist local planner changes back to synced resource storage.
    if (!plannerHydratedRef.current) {
      return;
    }

    setPlannerResource((currentPlannerResource) => {
      const currentActions = currentPlannerResource?.actions ?? [];
      const currentCategoryIds =
        currentPlannerResource?.enabledCategoryIds ?? DEFAULT_ENABLED_CATEGORY_IDS;

      if (
        getBoardActionsSignature(currentActions) === boardActionsSignature &&
        areCategoryIdListsEqual(currentCategoryIds, enabledCategoryIds)
      ) {
        return currentPlannerResource;
      }

      return {
        ...currentPlannerResource,
        actions: boardActions,
        enabledCategoryIds,
        viewport: currentPlannerResource?.viewport ?? null,
      };
    });
  }, [boardActions, boardActionsSignature, enabledCategoryIds, setPlannerResource]);

  useLayoutEffect(() => {
    // Function Group: canvas sizing only, kept separate to avoid draw/erase blink.
    const canvases = [boardCanvasRef.current, previewCanvasRef.current].filter(Boolean);

    if (canvases.length === 0 || !viewportSize.width || !viewportSize.height) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvases.forEach((canvas) => {
      canvas.width = Math.floor(viewportSize.width * devicePixelRatio);
      canvas.height = Math.floor(viewportSize.height * devicePixelRatio);
      canvas.style.width = `${viewportSize.width}px`;
      canvas.style.height = `${viewportSize.height}px`;
    });
    renderBoardCanvasNow();
    renderPreviewCanvasNow();
  }, [renderBoardCanvasNow, renderPreviewCanvasNow, viewportSize.height, viewportSize.width]);

  useLayoutEffect(() => {
    // Function Group: committed board canvas renderer.
    renderBoardCanvasRef.current = () => {
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
      context.globalAlpha = 1;
      context.imageSmoothingEnabled = true;

      const drawStroke = (stroke) => {
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
      };

      const drawText = (textAction) => {
        if (textAction.type !== "text" || !textAction.text.trim()) {
          return;
        }

        const lines = textAction.text.split("\n");
        const screenPoint = worldToScreen(textAction, viewport);
        const textSize = Math.max(14, textAction.size * Math.max(viewport.scale, 0.2));

        context.save();
        context.font = `700 ${textSize}px "Space Grotesk", sans-serif`;
        context.fillStyle = textAction.color;
        context.textBaseline = "top";
        lines.forEach((line, index) => {
          context.fillText(line, screenPoint.x, screenPoint.y + index * textSize * 1.22);
        });
        context.restore();
      };

      boardActions.forEach((action) => {
        if (action.type === "stroke") {
          drawStroke(action);
        } else {
          drawText(action);
        }
      });
    };

    renderBoardCanvasNow();
  }, [boardActions, renderBoardCanvasNow, viewport, viewportSize.height, viewportSize.width]);

  useLayoutEffect(() => {
    renderPreviewCanvasNow();
  }, [renderPreviewCanvasNow]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isMetaUndo = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z";
      const isMetaRedo =
        (event.metaKey || event.ctrlKey) &&
        (event.key.toLowerCase() === "y" ||
          (event.shiftKey && event.key.toLowerCase() === "z"));

      if (isMetaUndo) {
        event.preventDefault();
        setBoardActions((currentActions) => {
          if (currentActions.length === 0) {
            return currentActions;
          }

          const removedAction = currentActions[currentActions.length - 1];
          setRedoStack((currentRedo) => [removedAction, ...currentRedo]);
          return currentActions.slice(0, -1);
        });
      }

      if (isMetaRedo) {
        event.preventDefault();
        setRedoStack((currentRedo) => {
          if (currentRedo.length === 0) {
            return currentRedo;
          }

          const [restoredAction, ...restoredQueue] = currentRedo;
          setBoardActions((currentActions) => [...currentActions, restoredAction]);
          return restoredQueue;
        });
      }

      if (event.key === "Escape") {
        strokeRef.current = null;
        panSessionRef.current = null;
        setIsTemporaryPanActive(false);
        renderPreviewCanvasNow();
        setTextDraft(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [renderPreviewCanvasNow]);

  useEffect(() => {
    if (!saveFeedback) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSaveFeedback(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [saveFeedback]);

  useEffect(() => {
    fullscreenToolbarHoveredRef.current = isFullscreenToolbarHovered;
  }, [isFullscreenToolbarHovered]);

  useEffect(() => {
    if (!isMapFullscreen || isDashboardBooting) {
      clearFullscreenToolbarHide();
      setIsFullscreenToolbarVisible(true);
      setIsFullscreenToolbarHovered(false);
      return undefined;
    }

    revealFullscreenToolbar();
    scheduleFullscreenToolbarHide(2400);

    return () => clearFullscreenToolbarHide();
  }, [
    clearFullscreenToolbarHide,
    isDashboardBooting,
    isMapFullscreen,
    revealFullscreenToolbar,
    scheduleFullscreenToolbarHide,
  ]);

  useEffect(
    () => () => {
      clearFullscreenToolbarHide();
    },
    [clearFullscreenToolbarHide],
  );

  const handleUndo = () => {
    setBoardActions((currentActions) => {
      if (currentActions.length === 0) {
        return currentActions;
      }

      const removedAction = currentActions[currentActions.length - 1];
      setRedoStack((currentRedo) => [removedAction, ...currentRedo]);
      return currentActions.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack((currentRedo) => {
      if (currentRedo.length === 0) {
        return currentRedo;
      }

      const [restoredAction, ...restoredQueue] = currentRedo;
      setBoardActions((currentActions) => [...currentActions, restoredAction]);
      return restoredQueue;
    });
  };

  const handleOpenSaveModal = () => {
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
      title: `Ronograd Snapshot ${timestamp}`,
      note: "",
    });
    setIsSaveModalOpen(true);
  };

  const handleDeleteCustomMarker = (markerId) => {
    if (!canAddMarkers) {
      return;
    }

    const shouldDelete = window.confirm(
      "Hapus marker ini? Tindakan ini tidak dapat dibatalkan.",
    );

    if (!shouldDelete) {
      return;
    }

    setPlannerResource((currentPlannerResource) => {
      const currentMarkers = currentPlannerResource?.customMarkers ?? [];
      const nextMarkers = currentMarkers.filter((m) => m.id !== markerId);
      return {
        ...currentPlannerResource,
        customMarkers: nextMarkers,
      };
    });

    setSelectedMarkerId((currentSelected) =>
      currentSelected === markerId ? null : currentSelected,
    );
    setHoveredMarkerId((currentHovered) =>
      currentHovered === markerId ? null : currentHovered,
    );
    setIntelModalMarkerId((currentIntel) =>
      currentIntel === markerId ? null : currentIntel,
    );
  };

  const openThreatIntel = (marker) => {
    if (!isThreatIntelMarker(marker)) {
      return;
    }

    viewportRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setIntelModalMarkerId(marker.id);
  };

  const handleSaveStrategy = async (event) => {
    event.preventDefault();

    if (!strategicAccess.saves) {
      setIsSaveModalOpen(false);
      setSaveFeedback("Akun ini tidak memiliki izin menyimpan strategic save.");
      return;
    }

    const title = saveDraft.title.trim();

    if (!title) {
      return;
    }

    const nextSave = {
      id: createActionId("strategy"),
      ownerId: user?.id ?? null,
      ownerUsername: user?.username ?? "",
      ownerLabel: user?.label ?? "Strategic User",
      title,
      note: saveDraft.note.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actionCount: boardActions.length,
      categoryCount: enabledCategoryIds.length,
      snapshot: {
        actions: boardActions,
        enabledCategoryIds,
        viewport: {
          ...viewport,
          width: viewportSize.width,
          height: viewportSize.height,
        },
        frame: {
          width: viewportSize.width,
          height: viewportSize.height,
        },
        customMarkers: plannerResource.customMarkers || [],
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
  };

  const commitTextDraft = () => {
    if (!textDraft) {
      return;
    }

    const normalizedText = textDraft.text.trim();
    setTextDraft(null);

    if (!normalizedText) {
      return;
    }

    setBoardActions((currentActions) => [
      ...currentActions,
      {
        id: createActionId("text"),
        type: "text",
        x: textDraft.x,
        y: textDraft.y,
        text: normalizedText,
        color: selectedColor,
        size: clamp(Math.round(brushSize * 1.6), 14, 44),
      },
    ]);
    setRedoStack([]);
  };

  const finalizeStroke = () => {
    const stroke = strokeRef.current;

    if (!stroke) {
      return;
    }

    const points =
      stroke.points.length === 1
        ? [
            stroke.points[0],
            {
              x: clamp(stroke.points[0].x + 0.15, 0, MAP_WIDTH),
              y: clamp(stroke.points[0].y + 0.15, 0, MAP_HEIGHT),
            },
          ]
        : stroke.points;

    const committedStroke = {
      ...stroke,
      points,
    };

    commitStrokeToBoardCanvas(committedStroke);
    strokeRef.current = null;
    renderPreviewCanvasNow();

    setBoardActions((currentActions) => [
      ...currentActions,
      committedStroke,
    ]);
    setRedoStack([]);
  };

  const focusMarkerOnMap = useCallback(
    (marker, targetScale = viewport.scale < 0.18 ? 0.18 : viewport.scale) => {
      centerOnMarker(marker, targetScale);

      if (viewportRef.current) {
        window.requestAnimationFrame(() => {
          viewportRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    },
    [centerOnMarker, viewport.scale],
  );

  const handleViewportPointerDown = (event) => {
    // Function Group: map navigation interactions.
    const isTemporaryPan = event.button === 2;

    if (
      !viewportRef.current ||
      (!isTemporaryPan && activeTool !== "pan") ||
      (![0, 2].includes(event.button)) ||
      event.isPrimary === false ||
      event.target.closest?.("[data-map-toolbar='true']")
    ) {
      return;
    }

    const point = getRelativePoint(event, viewportRef.current);

    panSessionRef.current = {
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY,
      mode: isTemporaryPan ? "context-pan" : "pan",
    };
    setIsTemporaryPanActive(isTemporaryPan);

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleViewportPointerMove = (event) => {
    if (isMapFullscreen && viewportRef.current) {
      const point = getRelativePoint(event, viewportRef.current);
      const isNearToolbarEdge =
        event.target.closest?.("[data-map-toolbar='true']") ||
        point.x >= Math.max(0, viewportSize.width - 132);

      if (isNearToolbarEdge) {
        revealFullscreenToolbar();
        if (!isFullscreenToolbarHovered) {
          scheduleFullscreenToolbarHide(2100);
        }
      } else if (
        isFullscreenToolbarVisible &&
        !isFullscreenToolbarHovered &&
        !panSessionRef.current
      ) {
        scheduleFullscreenToolbarHide();
      }
    }

    const panSession = panSessionRef.current;

    if (
      !panSession ||
      (!["pan", "context-pan"].includes(panSession.mode)) ||
      (panSession.mode !== "context-pan" && activeTool !== "pan") ||
      !viewportRef.current
    ) {
      return;
    }

    const point = getRelativePoint(event, viewportRef.current);

    setViewport((currentViewport) =>
      normalizeViewportForFrame(
        {
          ...currentViewport,
          offsetX:
            panSession.offsetX + point.x - panSession.startX,
          offsetY:
            panSession.offsetY + point.y - panSession.startY,
        },
        viewportSize,
      ),
    );
  };

  const handleViewportPointerUp = (event) => {
    if (panSessionRef.current?.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setIsTemporaryPanActive(false);
      panSessionRef.current = null;
    }
  };

  const handleViewportWheel = (event) => {
    if (
      !isMapFullscreen ||
      !viewportRef.current ||
      event.target.closest?.("[data-map-toolbar='true']")
    ) {
      return;
    }

    event.preventDefault();
    const point = getRelativePoint(event, viewportRef.current);
    adjustZoom(event.deltaY < 0 ? 1.12 : 0.88, point);
  };

  const handleCanvasPointerDown = (event) => {
    // Function Group: drawing, erasing, and tactical note input interactions.
    if (event.button === 2) {
      return;
    }

    if (!viewportRef.current) {
      return;
    }

    const point = getRelativePoint(event, viewportRef.current);
    const worldPoint = screenToWorld(point, viewport);
    const clampedPoint = {
      x: clamp(worldPoint.x, 0, MAP_WIDTH),
      y: clamp(worldPoint.y, 0, MAP_HEIGHT),
    };

    if (activeTool === "marker") {
      if (!canAddMarkers) {
        setActiveTool("pan");
        return;
      }

      setMarkerDraft({
        x: clampedPoint.x,
        y: MAP_HEIGHT - clampedPoint.y,
        title: "",
        categoryId: "2",
        description: "",
        enemyIntelType: "",
      });
      return;
    }

    if (activeTool === "text") {
      setTextDraft({
        x: clampedPoint.x,
        y: clampedPoint.y,
        text: "",
      });
      return;
    }

    if (activeTool === "pan") {
      return;
    }

    const nextStroke = {
      id: createActionId(activeTool),
      type: "stroke",
      tool: activeTool,
      color: selectedColor,
      size: brushSize,
      points: [clampedPoint],
    };

    strokeRef.current = nextStroke;
    event.preventDefault();
    renderPreviewCanvasNow();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCanvasPointerMove = (event) => {
    if (panSessionRef.current?.mode === "context-pan" && viewportRef.current) {
      const point = getRelativePoint(event, viewportRef.current);
      const panSession = panSessionRef.current;

      setViewport((currentViewport) =>
        normalizeViewportForFrame(
          {
            ...currentViewport,
            offsetX: panSession.offsetX + point.x - panSession.startX,
            offsetY: panSession.offsetY + point.y - panSession.startY,
          },
          viewportSize,
        ),
      );
      return;
    }

    if (!strokeRef.current || !viewportRef.current) {
      return;
    }

    const point = getRelativePoint(event, viewportRef.current);
    const worldPoint = screenToWorld(point, viewport);
    const clampedPoint = {
      x: clamp(worldPoint.x, 0, MAP_WIDTH),
      y: clamp(worldPoint.y, 0, MAP_HEIGHT),
    };
    const latestPoint =
      strokeRef.current.points[strokeRef.current.points.length - 1] ?? clampedPoint;
    const distance = Math.hypot(
      latestPoint.x - clampedPoint.x,
      latestPoint.y - clampedPoint.y,
    );

    if (distance < 2) {
      return;
    }

    const nextStroke = {
      ...strokeRef.current,
      points: [...strokeRef.current.points, clampedPoint],
    };

    strokeRef.current = nextStroke;
    renderPreviewCanvasNow();
  };

  const handleCanvasPointerUp = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (isTemporaryPanActive) {
      setIsTemporaryPanActive(false);
      panSessionRef.current = null;
      return;
    }

    finalizeStroke();
  };

  const handleCanvasPointerCancel = (event) => {
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    strokeRef.current = null;
    if (isTemporaryPanActive) {
      setIsTemporaryPanActive(false);
      panSessionRef.current = null;
    }
    renderPreviewCanvasNow();
  };

  const textDraftScreenPosition = textDraft
    ? worldToScreen({ x: textDraft.x, y: textDraft.y }, viewport)
    : null;
  const notePanelLeft = textDraftScreenPosition
    ? clamp(textDraftScreenPosition.x, 12, Math.max(12, viewportSize.width - 272))
    : 12;
  const notePanelTop = textDraftScreenPosition
    ? clamp(textDraftScreenPosition.y, 12, Math.max(12, viewportSize.height - 190))
    : 12;
  const noteFxLeft = textDraftScreenPosition
    ? clamp(textDraftScreenPosition.x - 88, 0, Math.max(0, viewportSize.width - 176))
    : 0;
  const noteFxTop = textDraftScreenPosition
    ? clamp(textDraftScreenPosition.y - 96, 0, Math.max(0, viewportSize.height - 188))
    : 0;
  const zoomPercent = Math.round(viewport.scale * 100);
  const zoomSliderValue = Math.round(viewport.scale * 1000);

  return (
    <div className="space-y-6">
      <section className={`${PANEL_SHELL_CLASS} p-4 sm:p-5 xl:p-6`}>
        <div className="flex flex-col gap-4 border-b border-white/6 pb-5 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <p className="font-public text-[10px] uppercase tracking-[0.32em] text-lime-300/80">
              Ronograd Theater
            </p>
            <h2 className="mt-3 font-sans text-2xl font-bold uppercase leading-none text-stone-100 sm:text-3xl 2xl:text-4xl">
              Interactive Map Planner
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">
              {RONOGRAD_MAP_DATA.description
                ? `${RONOGRAD_MAP_DATA.description} Tactical board ini tetap mendukung layer filter, zoom, intel popup, dan board annotation di atas source map Ronograd.`
                : "Mengacu ke style interactive maps BRM5, dengan layer filter, zoom, intel popup, dan board annotation di atas source map asli Ronograd."}
            </p>

            {plannerError ? (
              <div className="mt-4 rounded-[20px] border border-rose-500/22 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {plannerError}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            <div className="rounded-[20px] border border-white/8 bg-black/18 px-4 py-3 backdrop-blur-xl transition hover:border-lime-300/16">
              <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                Map Size
              </p>
              <p className="mt-2 font-mono text-sm text-stone-100">
                {MAP_WIDTH} x {MAP_HEIGHT}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-black/18 px-4 py-3 backdrop-blur-xl transition hover:border-lime-300/16">
              <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                Categories
              </p>
              <p className="mt-2 font-mono text-sm text-stone-100">
                {RONOGRAD_MAP_DATA.categories.length}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-black/18 px-4 py-3 backdrop-blur-xl transition hover:border-lime-300/16">
              <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                Total Markers
              </p>
              <p className="mt-2 font-mono text-sm text-stone-100">
                {normalizedMarkers.length}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-black/18 px-4 py-3 backdrop-blur-xl transition hover:border-lime-300/16">
              <p className="font-public text-[9px] uppercase tracking-[0.18em] text-stone-500">
                Active Tool
              </p>
              <p className="mt-2 font-mono text-sm text-stone-100">
                {activeTool.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <div
          ref={viewportRef}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerUp}
          onPointerCancel={handleViewportPointerUp}
          onWheel={handleViewportWheel}
          onDoubleClick={(event) => event.preventDefault()}
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
          className={[
            "relative overflow-hidden bg-[#0b0f11]/92 backdrop-blur-xl select-none",
            isMapFullscreen
              ? "mt-0 h-screen min-h-screen rounded-none border-0 shadow-none"
              : "mt-5 h-[clamp(360px,56vh,760px)] rounded-[24px] border border-white/8 shadow-[0_24px_90px_rgba(0,0,0,0.32)] md:h-[clamp(400px,60vh,800px)] xl:h-[clamp(430px,64vh,860px)] 2xl:h-[clamp(480px,70vh,960px)]",
            isTemporaryPanActive
              ? "cursor-grabbing"
              : activeTool === "pan"
                ? "cursor-grab active:cursor-grabbing"
                : activeTool === "text"
                  ? "cursor-copy"
                  : "cursor-crosshair",
          ].join(" ")}
          style={{ touchAction: "none" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.985, filter: "blur(16px)" }}
            animate={{
              opacity: isDashboardBooting ? 0 : 1,
              scale: isDashboardBooting ? 0.99 : 1,
              filter: isDashboardBooting ? "blur(12px)" : "blur(0px)",
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <div className="pointer-events-none absolute inset-[10px] z-[1] rounded-[22px] border border-white/6 bg-black/8 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(167,243,208,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(167,243,208,0.5) 1px, transparent 1px)",
                backgroundSize: "96px 96px",
              }}
            />

            <div
              className="absolute left-0 top-0"
              style={{
                width: `${MAP_WIDTH}px`,
                height: `${MAP_HEIGHT}px`,
                transform: `translate3d(${viewport.offsetX}px, ${viewport.offsetY}px, 0) scale(${viewport.scale})`,
                transformOrigin: "top left",
                willChange: "transform",
                backfaceVisibility: "hidden",
              }}
            >
              <div
                aria-hidden="true"
                onContextMenu={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
                className="pointer-events-none h-full w-full select-none bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${RONOGRAD_MAP_DATA.mapImage})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  WebkitUserDrag: "none",
                  userSelect: "none",
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                }}
              />
            </div>

            <div className="pointer-events-none absolute inset-0 z-10">
              {screenMarkers.map((marker) => {
                const markerSize = selectedMarkerId === marker.id ? 24 : 20;

                return (
                  <button
                    key={marker.id}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedMarkerId(marker.id);
                      centerOnMarker(
                        marker,
                        viewport.scale < 0.16 ? 0.16 : viewport.scale,
                      );
                      openThreatIntel(marker);
                    }}
                    onMouseEnter={() => setHoveredMarkerId(marker.id)}
                    onMouseLeave={() => setHoveredMarkerId(null)}
                    className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${marker.screenPosition.x}px`,
                      top: `${marker.screenPosition.y}px`,
                    }}
                  >
                    <span
                      className={[
                        "relative grid place-items-center rounded-full border text-[9px] font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_18px_rgba(0,0,0,0.52)] transition",
                        selectedMarkerId === marker.id ? "scale-110" : "hover:scale-105",
                      ].join(" ")}
                      style={{
                        width: `${markerSize}px`,
                        height: `${markerSize}px`,
                        backgroundColor: marker.category?.color ?? "#E9C349",
                        borderColor:
                          selectedMarkerId === marker.id
                            ? "#F8FAFC"
                            : `${marker.category?.color ?? "#E9C349"}66`,
                        color: marker.category?.symbolColor ?? "#05080a",
                      }}
                    >
                      <MarkerCategoryGlyph
                        category={marker.category}
                        fallbackText={getMarkerBadgeText(marker.category)}
                        className="h-3.5 w-3.5"
                      />
                      {selectedMarkerId === marker.id ? (
                        <span className="absolute inset-[-8px] rounded-full border border-white/55" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>

            <canvas
              ref={boardCanvasRef}
              className="pointer-events-none absolute inset-0 z-[13]"
              style={{ touchAction: "none" }}
            />

            <canvas
              ref={previewCanvasRef}
              onPointerDown={handleCanvasPointerDown}
              onPointerMove={handleCanvasPointerMove}
              onPointerUp={handleCanvasPointerUp}
              onPointerCancel={handleCanvasPointerCancel}
              onContextMenu={(event) => event.preventDefault()}
              className={[
                "absolute inset-0 z-[14]",
                activeTool === "pan" ? "pointer-events-none" : "pointer-events-auto",
              ].join(" ")}
              style={{ touchAction: "none" }}
            />

            <AnimatePresence>
              {selectedMarker && selectedMarkerScreenPosition ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="pointer-events-auto absolute z-20 w-[280px] max-w-[70vw] border border-white/10 bg-[#0f1517]/96 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.4)] backdrop-blur-xl rounded-[24px]"
                  style={{
                    left: `${clamp(selectedMarkerScreenPosition.x + 20, 16, Math.max(16, viewportSize.width - 296))}px`,
                    top: `${clamp(selectedMarkerScreenPosition.y - 30, 16, Math.max(16, viewportSize.height - 150))}px`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-lime-300/12 text-lime-300">
                        <MarkerCategoryGlyph
                          category={selectedMarker.category}
                          fallbackText={selectedMarker.category?.symbol ?? selectedMarker.category?.name?.slice(0, 1)}
                          className="h-4 w-4"
                        />
                      </span>
                      <p className="font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
                        {selectedMarker.category?.name ?? "Intel Node"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedMarkerId(null);
                        setIntelModalMarkerId(null);
                      }}
                      className="text-stone-500 hover:text-stone-300 transition"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="15" y1="5" x2="5" y2="15"></line>
                        <line x1="5" y1="5" x2="15" y2="15"></line>
                      </svg>
                    </button>
                  </div>

                  <p className="mt-3 font-sans text-lg font-bold uppercase tracking-[0.02em] text-stone-100">
                    {selectedMarker.popup.title}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-stone-500">
                    {selectedMarker.category?.name ?? "Intel Node"}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-stone-300">
                    {selectedMarker.resolvedDescription}
                  </p>
                  <div className="mt-4 rounded-[16px] border border-white/8 bg-white/[0.04] px-3 py-2 text-[10px] text-stone-400">
                    Coordinates: {formatInteger(selectedMarker.position[0])}, {formatInteger(selectedMarker.position[1])}
                  </div>
                  {selectedMarker.popup.link?.label || selectedMarker.popup.link?.url ? (
                    <div className="mt-3 rounded-[16px] border border-white/8 bg-white/[0.04] px-3 py-2 text-[10px] text-stone-400">
                      Link: {selectedMarker.popup.link?.label || selectedMarker.popup.link?.url}
                    </div>
                  ) : null}

                  {canAddMarkers && selectedMarker.id.startsWith("custom-") ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteCustomMarker(selectedMarker.id);
                      }}
                      className="mt-4 flex items-center gap-1.5 w-full justify-center rounded-[14px] border border-rose-500/30 bg-rose-500/10 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300 transition hover:bg-rose-500/20"
                    >
                      <PlannerIcon name="trash" className="h-3 w-3" />
                      Delete Marker
                    </button>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {hoveredMarker && !selectedMarker ? (
              <div className="pointer-events-none absolute left-4 top-4 max-w-[320px] rounded-[18px] border border-white/8 bg-[#161b1d]/90 px-4 py-3 text-sm text-stone-200 backdrop-blur-md shadow-[0_16px_50px_rgba(0,0,0,0.36)]">
                <p className="font-public text-[9px] uppercase tracking-[0.22em] text-lime-300">
                  {hoveredMarker.category?.name ?? "Intel Node"}
                </p>
                <p className="mt-1 font-sans text-sm font-semibold text-stone-100">
                  {hoveredMarker.popup.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-stone-400">
                  {hoveredMarker.resolvedDescription}
                </p>
                <p className="mt-2 text-[10px] text-stone-500">
                  Coord: {formatInteger(hoveredMarker.position[0])}, {formatInteger(hoveredMarker.position[1])}
                </p>
              </div>
            ) : null}

            <AnimatePresence>
              {textDraft && textDraftScreenPosition ? (
                <>
                  <motion.div
                  key={`note-fx-${textDraft.x}-${textDraft.y}`}
                  initial={{ opacity: 0, scale: 0.75, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.88 }}
                  transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none absolute z-[29] h-[188px] w-[176px]"
                  style={{
                    left: `${noteFxLeft}px`,
                    top: `${noteFxTop}px`,
                  }}
                >
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0.9, scale: 0.4 }}
                    animate={{ opacity: [0.55, 0.2, 0], scale: [0.5, 1.05, 1.22] }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="absolute inset-[16%] rounded-full bg-lime-300/18 blur-2xl"
                  />
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0.85, scaleX: 0.2 }}
                    animate={{ opacity: [0.75, 0.24, 0], scaleX: [0.15, 1, 1.18] }}
                    transition={{ duration: 0.42, ease: "easeOut" }}
                    className="absolute left-[18%] right-[18%] top-1/2 h-[2px] bg-[linear-gradient(90deg,rgba(103,232,249,0.0),rgba(103,232,249,0.75),rgba(244,63,94,0.55),rgba(103,232,249,0.0))] blur-[2px]"
                  />
                  <motion.svg
                    viewBox="0 0 176 188"
                    className="absolute inset-0 h-full w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.15, 0.95, 0.55] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.36 }}
                  >
                    <motion.path
                      d="M88 6 L90 42 L74 68 L96 88 L82 116 L108 148 L92 182"
                      stroke="rgba(190,242,100,0.92)"
                      strokeWidth="1.4"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: [0, 1, 0.55] }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                    <motion.path
                      d="M88 42 L58 28 M74 68 L42 76 M96 88 L136 78 M82 116 L48 138 M108 148 L146 162"
                      stroke="rgba(103,232,249,0.58)"
                      strokeWidth="1"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: [0, 0.85, 0.25] }}
                      transition={{ duration: 0.46, ease: "easeOut", delay: 0.06 }}
                    />
                    <motion.path
                      d="M88 42 L116 26 M96 88 L122 114 M82 116 L102 134"
                      stroke="rgba(244,63,94,0.38)"
                      strokeWidth="0.9"
                      fill="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: [0, 0.7, 0.18] }}
                      transition={{ duration: 0.38, ease: "easeOut", delay: 0.1 }}
                    />
                  </motion.svg>
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0.9, x: -22 }}
                    animate={{ opacity: [0.8, 0.2, 0], x: [0, 20, 42] }}
                    transition={{ duration: 0.34, ease: "easeOut" }}
                    className="absolute inset-x-5 top-[42%] h-3 bg-[linear-gradient(90deg,rgba(103,232,249,0.0),rgba(103,232,249,0.34),rgba(255,255,255,0.24),rgba(244,63,94,0.22),rgba(103,232,249,0.0))] blur-[3px]"
                  />
                </motion.div>

                  <motion.div
                  key={`note-${textDraft.x}-${textDraft.y}`}
                  initial={{
                    opacity: 0,
                    y: 34,
                    scale: 0.68,
                    rotateX: -18,
                    filter: "blur(16px)",
                    clipPath: "polygon(50% 52%, 50% 52%, 50% 52%, 50% 52%)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotateX: 0,
                    filter: "blur(0px)",
                    clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                  }}
                  exit={{
                    opacity: 0,
                    y: 16,
                    scale: 0.9,
                    rotateX: -8,
                    filter: "blur(10px)",
                    clipPath: "polygon(50% 52%, 50% 52%, 50% 52%, 50% 52%)",
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.08,
                  }}
                  className="absolute z-30 w-[260px] overflow-hidden rounded-[22px] border border-lime-300/20 bg-[#151a1d]/96 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl"
                  style={{
                    left: `${notePanelLeft}px`,
                    top: `${notePanelTop}px`,
                    transformOrigin: "18% 0%",
                  }}
                >
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0.92, x: -36 }}
                    animate={{ opacity: [0.74, 0.22, 0], x: [0, 34, 68] }}
                    transition={{ duration: 0.38, ease: "easeOut", delay: 0.02 }}
                    className="pointer-events-none absolute inset-x-3 top-7 h-6 bg-[linear-gradient(90deg,rgba(103,232,249,0.25),rgba(190,242,100,0.12),rgba(244,63,94,0.18))] blur-sm"
                  />
                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0.88, x: 22 }}
                    animate={{ opacity: [0.68, 0.16, 0], x: [0, -28, -52] }}
                    transition={{ duration: 0.35, ease: "easeOut", delay: 0.06 }}
                    className="pointer-events-none absolute inset-x-4 top-16 h-2 bg-lime-300/35 blur-[3px]"
                  />
                  <motion.div
                    aria-hidden="true"
                    initial={{ scaleY: 0, opacity: 0.8 }}
                    animate={{ scaleY: [0, 1, 0.35], opacity: [0.9, 0.3, 0] }}
                    transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
                    className="pointer-events-none absolute left-4 top-0 h-full w-px origin-top bg-lime-300/60"
                  />

                  <p className="relative z-10 font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
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
                    placeholder="Tuliskan catatan taktis..."
                    className="relative z-10 mt-3 w-full resize-none rounded-[16px] border border-white/8 bg-black/25 px-3 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-lime-300/40"
                  />
                  <div className="relative z-10 mt-3 flex gap-2">
                    <PlannerButton
                      active={false}
                      icon="text"
                      label="Save"
                      onClick={commitTextDraft}
                    />
                    <PlannerButton
                      active={false}
                      icon="trash"
                      label="Cancel"
                      onClick={() => setTextDraft(null)}
                    />
                  </div>
                  </motion.div>
                </>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {isDashboardBooting ? (
              <MapIntroOverlay progress={dashboardBootProgress} />
            ) : null}
          </AnimatePresence>

          {isMapFullscreen && !isDashboardBooting ? (
            <FullscreenMapToolbar
              isVisible={isFullscreenToolbarVisible}
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
              onFitMap={fitMapToViewport}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClearBoard={() => {
                setBoardActions([]);
                setRedoStack([]);
                setTextDraft(null);
              }}
              onToggleFullscreen={toggleMapFullscreen}
              onReveal={revealFullscreenToolbar}
              onScheduleHide={scheduleFullscreenToolbarHide}
              onHoverChange={setIsFullscreenToolbarHovered}
              canAddMarkers={canAddMarkers}
            />
          ) : null}
        </div>

        <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.035] px-4 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:border-lime-300/16">
          <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {DRAW_TOOL_OPTIONS.filter((tool) => tool.id !== "marker" || canAddMarkers).map((tool) => (
                <ToolbarIconButton
                  key={tool.id}
                  active={activeTool === tool.id}
                  icon={
                    tool.id === "pan"
                      ? "focus"
                      : tool.id === "pen"
                        ? "draw"
                        : tool.id === "eraser"
                          ? "trash"
                          : tool.id
                  }
                  label={tool.label}
                  onClick={() => {
                    setActiveTool(tool.id);
                  }}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={`Select ${color}`}
                  onClick={() => setSelectedColor(color)}
                  className={[
                    "h-9 w-9 border transition",
                    selectedColor === color
                      ? "border-stone-100 scale-105"
                      : "border-white/10 hover:border-white/30",
                  ].join(" ")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex w-full min-w-0 items-center gap-3 sm:w-[min(100%,360px)] 2xl:w-auto 2xl:min-w-[200px]">
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Size
              </span>
              <input
                type="range"
                min="4"
                max="28"
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
                className="h-2 flex-1 accent-[#E9C349]"
              />
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
                {brushSize}
              </span>
            </div>

            <div className="flex w-full min-w-0 items-center gap-3 sm:w-[min(100%,360px)] 2xl:w-auto 2xl:min-w-[220px]">
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Zoom
              </span>
              <input
                type="range"
                min={Math.round(MIN_SCALE * 1000)}
                max={Math.round(MAX_SCALE * 1000)}
                value={zoomSliderValue}
                onChange={(event) => {
                  const nextScale = Number(event.target.value) / 1000;
                  const centerPoint = {
                    x: viewportSize.width / 2,
                    y: viewportSize.height / 2,
                  };

                  setViewport((currentViewport) => {
                    if (!currentViewport.scale || nextScale === currentViewport.scale) {
                      return currentViewport;
                    }

                    const worldPoint = screenToWorld(centerPoint, currentViewport);
                    const normalizedViewport = constrainViewport(
                      {
                        scale: clamp(nextScale, MIN_SCALE, MAX_SCALE),
                        offsetX:
                          centerPoint.x -
                          worldPoint.x * clamp(nextScale, MIN_SCALE, MAX_SCALE),
                        offsetY:
                          centerPoint.y -
                          worldPoint.y * clamp(nextScale, MIN_SCALE, MAX_SCALE),
                      },
                      viewportSize.width,
                      viewportSize.height,
                    );

                    return areViewportsEqual(currentViewport, normalizedViewport)
                      ? currentViewport
                      : normalizedViewport;
                  });
                }}
                className="h-2 flex-1 accent-[#A7F3D0]"
              />
              <span className="font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
                {zoomPercent}%
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ToolbarIconButton
                icon="save"
                label="Save Strategy"
                onClick={handleOpenSaveModal}
              />
              <ToolbarIconButton
                icon={isMapFullscreen ? "fullscreen-exit" : "fullscreen-enter"}
                label={isMapFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                onClick={toggleMapFullscreen}
              />
              <ToolbarIconButton
                icon="zoom-in"
                label="Zoom In"
                onClick={() => adjustZoom(1.18)}
              />
              <ToolbarIconButton
                icon="zoom-out"
                label="Zoom Out"
                onClick={() => adjustZoom(0.84)}
              />
              <ToolbarIconButton
                icon="reset"
                label="Fit Map"
                onClick={fitMapToViewport}
              />
              <ToolbarIconButton
                icon="undo"
                label="Undo"
                disabled={boardActions.length === 0}
                onClick={handleUndo}
              />
              <ToolbarIconButton
                icon="redo"
                label="Redo"
                disabled={redoStack.length === 0}
                onClick={handleRedo}
              />
              <ToolbarIconButton
                icon="trash"
                label="Clear Board"
                disabled={boardActions.length === 0 && !textDraft}
                onClick={() => {
                  setBoardActions([]);
                  setRedoStack([]);
                  setTextDraft(null);
                }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-white/6 pt-3 md:flex-row md:items-center md:justify-between">
            <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Zoom sekarang hanya lewat tombol `+ / -` dan slider pada toolbar bawah map.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {saveFeedback ? (
                <span className="rounded-full border border-lime-300/18 bg-lime-300/10 px-3 py-1 font-public text-[9px] uppercase tracking-[0.18em] text-lime-200">
                  {saveFeedback}
                </span>
              ) : null}
              <p className="font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
                Drag = Pan • Klik Kanan = Pan Cepat • Pencil = Gambar • Delete = Hapus Coretan • Text = Klik Map
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[330px_minmax(0,1fr)]">
        <section className="space-y-6">
          <section className={PANEL_SHELL_CLASS}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-public text-[10px] uppercase tracking-[0.28em] text-lime-300/80">
                  Tactical Query
                </p>
                <h2 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
                  Marker Search
                </h2>
              </div>
              <PlannerIcon name="search" className="h-5 w-5 text-lime-300/70" />
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-[18px] border border-white/8 bg-black/25 px-4 py-3 backdrop-blur-xl">
              <PlannerIcon name="search" className="h-4 w-4 text-stone-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari marker, lokasi, atau kategori..."
                className="w-full bg-transparent text-sm text-stone-100 outline-none placeholder:text-stone-500"
              />
            </label>

            <div className="mt-5 max-h-[min(52vh,420px)] space-y-2 overflow-y-auto pr-1">
              {RONOGRAD_MAP_DATA.categories
                .filter(
                  (category) =>
                    category.id === ENEMY_INTEL_ROOT_CATEGORY_ID ||
                    !SUPPLEMENTAL_ENEMY_CATEGORY_IDS_FOR_MARKERS.includes(category.id),
                )
                .map((category) => {
                  const isEnabled = enabledCategoryIds.includes(category.id);
                  const totalCount = categoryCounts.get(category.id) ?? 0;
                  const visibleCount = visibleCategoryCounts.get(category.id) ?? 0;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setEnabledCategoryIds((currentIds) =>
                          currentIds.includes(category.id)
                            ? currentIds.filter((id) => id !== category.id)
                            : [...currentIds, category.id],
                        )
                      }
                      className={[
                        "flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left backdrop-blur-xl transition",
                        isEnabled
                          ? "border-lime-300/18 bg-lime-300/[0.06]"
                          : "border-white/6 bg-black/18 opacity-65 hover:opacity-100",
                      ].join(" ")}
                    >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex"
                      >
                        <MarkerBadge
                          category={category}
                          sizeClass="h-10 w-10"
                          glyphClass="h-[18px] w-[18px]"
                          roundedClass="rounded-[12px]"
                        />
                      </span>
                      <div>
                        <p className="font-sans text-base font-semibold uppercase text-stone-100">
                          {category.name}
                        </p>
                        <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                          {visibleCount} visible / {totalCount} total
                        </p>
                      </div>
                    </div>
                    <span
                      className={[
                        "h-2.5 w-2.5 rounded-full border",
                        isEnabled
                          ? "border-lime-300 bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.55)]"
                          : "border-white/20 bg-transparent",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>
          </section>

        </section>

        <section className="space-y-6">
          <section className={PANEL_SHELL_CLASS}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-public text-[10px] uppercase tracking-[0.28em] text-lime-300/80">
                  Active Intel
                </p>
                <h2 className="mt-2 font-sans text-2xl font-bold uppercase text-stone-100">
                  Marker Detail
                </h2>
              </div>
              <PlannerIcon name="marker" className="h-5 w-5 text-lime-300/70" />
            </div>

            {selectedMarker ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[20px] border border-white/8 bg-black/20 p-4 backdrop-blur-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-sans text-xl font-bold uppercase text-stone-100">
                        {selectedMarker.popup.title}
                      </p>
                      <p className="mt-2 font-public text-[10px] uppercase tracking-[0.18em] text-lime-300">
                        {selectedMarker.category?.name ?? "Unknown Category"}
                      </p>
                    </div>
                    <span
                      className="mt-1 inline-flex"
                    >
                      <MarkerBadge
                        category={selectedMarker.category}
                        sizeClass="h-9 w-9"
                        glyphClass="h-4 w-4"
                        roundedClass="rounded-full"
                        className="shadow-[0_0_18px_rgba(0,0,0,0.22)]"
                      />
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-stone-400">
                    {selectedMarker.resolvedDescription}
                  </p>
                </div>

                {selectedMarker.secretIntel?.length ? (
                  <div className="rounded-[20px] border border-amber-300/14 bg-amber-300/[0.04] p-4 backdrop-blur-xl">
                    <p className="font-public text-[10px] uppercase tracking-[0.18em] text-amber-300">
                      Intel Tersembunyi
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {selectedMarker.secretIntel.slice(0, 3).map((point, index) => (
                        <div
                          key={`${selectedMarker.id}-secret-${index}`}
                          className="flex items-start gap-3 rounded-[16px] border border-white/6 bg-black/18 px-3 py-3"
                        >
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.35)]" />
                          <p className="text-sm leading-6 text-stone-300">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(selectedMarker.popup.link?.label ||
                  selectedMarker.popup.link?.url ||
                  selectedMarker.popup.image) ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(selectedMarker.popup.link?.label ||
                      selectedMarker.popup.link?.url) ? (
                      <div className="rounded-[18px] border border-white/8 bg-black/20 p-4 backdrop-blur-xl">
                        <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                          Intel Link
                        </p>
                        <p className="mt-2 font-sans text-sm font-semibold uppercase text-stone-100">
                          {selectedMarker.popup.link?.label || "Reference Link"}
                        </p>
                        <p className="mt-2 break-all font-mono text-xs text-stone-400">
                          {selectedMarker.popup.link?.url || "No URL recorded"}
                        </p>
                      </div>
                    ) : null}

                    {selectedMarker.popup.image ? (
                      <div className="rounded-[18px] border border-white/8 bg-black/20 p-4 backdrop-blur-xl">
                        <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                          Image Reference
                        </p>
                        <p className="mt-2 break-all font-mono text-xs text-stone-300">
                          {selectedMarker.popup.image}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-white/8 bg-black/20 p-4 backdrop-blur-xl">
                    <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                      Coordinate X
                    </p>
                    <p className="mt-2 font-mono text-lg text-stone-100">
                      {formatInteger(selectedMarker.position[0])}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-black/20 p-4 backdrop-blur-xl">
                    <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                      Coordinate Y
                    </p>
                    <p className="mt-2 font-mono text-lg text-stone-100">
                      {formatInteger(selectedMarker.position[1])}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <PlannerButton
                    active={false}
                    icon="focus"
                    label="Focus Marker"
                    onClick={() => focusMarkerOnMap(selectedMarker)}
                  />
                  <PlannerButton
                    active={false}
                    icon="reset"
                    label="Clear Selection"
                    onClick={() => setSelectedMarkerId(null)}
                  />
                  {isThreatIntelMarker(selectedMarker) ? (
                    <PlannerButton
                      active={false}
                      icon="layers"
                      label="Intel Ancaman"
                      onClick={() => openThreatIntel(selectedMarker)}
                    />
                  ) : null}
                  {canAddMarkers && selectedMarker.id.startsWith("custom-") ? (
                    <PlannerButton
                      active={false}
                      icon="trash"
                      label="Delete Marker"
                      onClick={() => handleDeleteCustomMarker(selectedMarker.id)}
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-7 text-stone-500 backdrop-blur-xl">
                Pilih marker di map atau dari hasil pencarian untuk melihat detail
                titik intel.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/8 bg-white/[0.035] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:border-lime-300/16">
            <p className="font-public text-[10px] uppercase tracking-[0.24em] text-lime-300/80">
              Quick Intel List
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {pagedQuickIntelMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="rounded-[18px] border border-white/8 bg-[#151a1d]/90 px-4 py-3 backdrop-blur-xl transition hover:border-lime-300/20 hover:bg-lime-300/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIntelModalMarkerId(null);
                        setSelectedMarkerId(marker.id);
                        focusMarkerOnMap(marker);
                      }}
                      className="flex-1 text-left"
                    >
                      <p className="font-sans text-base font-semibold uppercase text-stone-100">
                        {marker.popup.title}
                      </p>
                      <p className="mt-1 font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                        {marker.category?.name ?? "Unknown"}
                      </p>
                    </button>
                    <span className="inline-flex items-center gap-2">
                      {canAddMarkers && marker.id.startsWith("custom-") ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteCustomMarker(marker.id);
                          }}
                          className="inline-flex h-9 items-center justify-center rounded-full border border-rose-400/25 bg-rose-500/10 px-3 text-[10px] uppercase tracking-[0.18em] text-rose-200 transition hover:bg-rose-500/20"
                        >
                          Delete
                        </button>
                      ) : null}
                      <MarkerBadge
                        category={marker.category}
                        sizeClass="h-8 w-8"
                        glyphClass="h-3.5 w-3.5"
                        roundedClass="rounded-full"
                      />
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
              <p className="font-public text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Page {normalizedQuickIntelPage} / {quickIntelTotalPages}
              </p>
              <div className="flex items-center gap-2">
                <PlannerButton
                  active={false}
                  icon="undo"
                  label="Prev"
                  disabled={normalizedQuickIntelPage <= 1}
                  onClick={() =>
                    setQuickIntelPage((currentPage) => Math.max(1, currentPage - 1))
                  }
                />
                <PlannerButton
                  active={false}
                  icon="redo"
                  label="Next"
                  disabled={normalizedQuickIntelPage >= quickIntelTotalPages}
                  onClick={() =>
                    setQuickIntelPage((currentPage) =>
                      Math.min(quickIntelTotalPages, currentPage + 1),
                    )
                  }
                />
              </div>
            </div>
          </section>
        </section>
      </div>

      <AnimatePresence>
        {isSaveModalOpen ? (
          <StrategySaveModal
            draft={saveDraft}
            onChange={(field, value) =>
              setSaveDraft((currentDraft) => ({
                ...currentDraft,
                [field]: value,
              }))
            }
            onClose={() => setIsSaveModalOpen(false)}
            onSubmit={handleSaveStrategy}
          />
        ) : null}
        {intelModalMarker && activeThreatIntel ? (
          <ThreatIntelModal
            marker={intelModalMarker}
            intel={activeThreatIntel}
            onClose={() => setIntelModalMarkerId(null)}
          />
        ) : null}
        {markerDraft ? (
          <AddMarkerModal
            draft={markerDraft}
            categories={RONOGRAD_MAP_DATA.categories}
            onChange={(key, value) =>
              setMarkerDraft((currentDraft) =>
                currentDraft ? { ...currentDraft, [key]: value } : currentDraft,
              )
            }
            onClose={() => setMarkerDraft(null)}
            onSubmit={(event) => {
              event.preventDefault();
              
              // Use enemyIntelType if "enemy-intel" is selected
              const finalCategoryId = markerDraft.categoryId === "enemy-intel" 
                ? (markerDraft.enemyIntelType || "enemy-intel")
                : markerDraft.categoryId;
              
              const newMarker = {
                id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                categoryId: finalCategoryId,
                position: [markerDraft.x, markerDraft.y],
                popup: {
                  title: markerDraft.title.trim() || "Custom Marker",
                  description: markerDraft.description.trim(),
                  link: { url: "", label: "" },
                },
              };

              setPlannerResource((currentPlannerResource) => {
                const currentMarkers = currentPlannerResource?.customMarkers ?? [];
                return {
                  ...currentPlannerResource,
                  customMarkers: [...currentMarkers, newMarker],
                };
              });

              setMarkerDraft(null);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
