/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { RONOGRAD_MAP_DATA } from "./ronogradMapData";

const MAP_WIDTH = RONOGRAD_MAP_DATA.mapBounds[1][0];
const MAP_HEIGHT = RONOGRAD_MAP_DATA.mapBounds[1][1];
const DEFAULT_FRAME = {
  width: 1280,
  height: 760,
};
const imageCache = new Map();

function getSnapshotMapConfig(save) {
  const customMap = save?.snapshot?.customMap;

  if (
    customMap &&
    typeof customMap.imageDataUrl === "string" &&
    customMap.imageDataUrl.startsWith("data:image/") &&
    Number.isFinite(customMap.width) &&
    Number.isFinite(customMap.height) &&
    customMap.width > 0 &&
    customMap.height > 0
  ) {
    return {
      sourceType: "custom-map",
      width: customMap.width,
      height: customMap.height,
      imageSource: customMap.imageDataUrl,
      includeMarkers: false,
    };
  }

  return {
    sourceType: "main-planner",
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    imageSource: RONOGRAD_MAP_DATA.mapImage,
    includeMarkers: true,
  };
}

function loadImage(source) {
  if (imageCache.has(source)) {
    return imageCache.get(source);
  }

  const imagePromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });

  imageCache.set(source, imagePromise);
  return imagePromise;
}

function roundRectPath(context, x, y, width, height, radius) {
  const nextRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + nextRadius, y);
  context.lineTo(x + width - nextRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + nextRadius);
  context.lineTo(x + width, y + height - nextRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - nextRadius,
    y + height,
  );
  context.lineTo(x + nextRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - nextRadius);
  context.lineTo(x, y + nextRadius);
  context.quadraticCurveTo(x, y, x + nextRadius, y);
  context.closePath();
}

function worldToScreen(point, viewport) {
  return {
    x: viewport.offsetX + point.x * viewport.scale,
    y: viewport.offsetY + point.y * viewport.scale,
  };
}

function getViewport(snapshot) {
  const mapConfig = getSnapshotMapConfig({ snapshot });

  if (
    snapshot?.viewport &&
    Number.isFinite(snapshot.viewport.scale) &&
    Number.isFinite(snapshot.viewport.offsetX) &&
    Number.isFinite(snapshot.viewport.offsetY)
  ) {
    return {
      scale: snapshot.viewport.scale,
      offsetX: snapshot.viewport.offsetX,
      offsetY: snapshot.viewport.offsetY,
    };
  }

  const fittedScale = Math.min(
    DEFAULT_FRAME.width / mapConfig.width,
    DEFAULT_FRAME.height / mapConfig.height,
  );

  return {
    scale: fittedScale,
    offsetX: (DEFAULT_FRAME.width - mapConfig.width * fittedScale) / 2,
    offsetY: (DEFAULT_FRAME.height - mapConfig.height * fittedScale) / 2,
  };
}

function getFrame(snapshot) {
  if (
    snapshot?.frame &&
    Number.isFinite(snapshot.frame.width) &&
    Number.isFinite(snapshot.frame.height)
  ) {
    return {
      width: Math.max(320, snapshot.frame.width),
      height: Math.max(240, snapshot.frame.height),
    };
  }

  return DEFAULT_FRAME;
}

function getActionLineWidth(action, viewport) {
  return Math.max(2.4, action.size * Math.max(viewport.scale, 0.18));
}

function getTextSize(action, viewport) {
  return Math.max(14, action.size * Math.max(viewport.scale, 0.2));
}

async function renderViewportCanvas(save) {
  const snapshot = save?.snapshot ?? {};
  const frame = getFrame(snapshot);
  const viewport = getViewport(snapshot);
  const mapConfig = getSnapshotMapConfig(save);
  const enabledCategoryIds = Array.isArray(snapshot.enabledCategoryIds)
    ? snapshot.enabledCategoryIds
    : [];
  const mapImage = await loadImage(mapConfig.imageSource);
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(frame.width);
  canvas.height = Math.round(frame.height);

  const context = canvas.getContext("2d");

  context.fillStyle = "#0b0f11";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.translate(viewport.offsetX, viewport.offsetY);
  context.scale(viewport.scale, viewport.scale);
  context.drawImage(mapImage, 0, 0, mapConfig.width, mapConfig.height);
  context.restore();

  context.save();
  context.strokeStyle = "rgba(167,243,208,0.08)";
  context.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 96) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y < canvas.height; y += 96) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }
  context.restore();

  if (mapConfig.includeMarkers) {
    const categoriesById = new Map(
      RONOGRAD_MAP_DATA.categories.map((category) => [category.id, category]),
    );

    RONOGRAD_MAP_DATA.markers.forEach((marker) => {
      if (!enabledCategoryIds.includes(marker.categoryId)) {
        return;
      }

      const category = categoriesById.get(marker.categoryId);
      const position = worldToScreen(
        {
          x: marker.position[0],
          y: mapConfig.height - marker.position[1],
        },
        viewport,
      );

      if (
        position.x < -24 ||
        position.x > canvas.width + 24 ||
        position.y < -24 ||
        position.y > canvas.height + 24
      ) {
        return;
      }

      context.save();
      context.fillStyle = category?.color ?? "#E9C349";
      context.strokeStyle = "rgba(248,250,252,0.92)";
      context.lineWidth = 1.4;
      context.shadowColor = "rgba(0,0,0,0.45)";
      context.shadowBlur = 16;
      context.beginPath();
      context.arc(position.x, position.y, 7.5, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.restore();
    });
  }

  const actions = Array.isArray(snapshot.actions) ? snapshot.actions : [];

  actions.forEach((action) => {
    if (action.type === "stroke" && Array.isArray(action.points) && action.points.length) {
      context.save();
      context.globalCompositeOperation =
        action.tool === "eraser" ? "destination-out" : "source-over";
      context.strokeStyle = action.color ?? "#E9C349";
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = getActionLineWidth(action, viewport);
      context.beginPath();

      const firstPoint = worldToScreen(action.points[0], viewport);
      context.moveTo(firstPoint.x, firstPoint.y);

      action.points.slice(1).forEach((point) => {
        const screenPoint = worldToScreen(point, viewport);
        context.lineTo(screenPoint.x, screenPoint.y);
      });

      if (action.points.length === 1) {
        context.lineTo(firstPoint.x + 0.01, firstPoint.y + 0.01);
      }

      context.stroke();
      context.restore();
      return;
    }

    if (action.type === "text" && typeof action.text === "string" && action.text.trim()) {
      const position = worldToScreen(action, viewport);
      const textSize = getTextSize(action, viewport);
      const lines = action.text.split("\n");

      context.save();
      context.font = `700 ${textSize}px "Space Grotesk", sans-serif`;
      context.fillStyle = action.color ?? "#E9C349";
      context.textBaseline = "top";
      context.shadowColor = "rgba(0,0,0,0.35)";
      context.shadowBlur = 8;
      lines.forEach((line, index) => {
        context.fillText(line, position.x, position.y + index * textSize * 1.2);
      });
      context.restore();
    }
  });

  return {
    canvas,
    frame,
  };
}

export async function renderStrategySnapshotCanvas(
  save,
  {
    width = 1280,
    height = 900,
    includeHeader = true,
  } = {},
) {
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const context = outputCanvas.getContext("2d");
  const { canvas: viewportCanvas, frame } = await renderViewportCanvas(save);
  const contentX = 28;
  const contentY = includeHeader ? 108 : 18;
  const contentWidth = width - contentX * 2;
  const contentHeight = height - contentY - 24;
  const drawWidth = contentWidth;
  const drawHeight = Math.min(
    contentHeight,
    drawWidth * (frame.height / frame.width),
  );
  const drawY = contentY + (contentHeight - drawHeight) / 2;

  const backgroundGradient = context.createLinearGradient(0, 0, width, height);
  backgroundGradient.addColorStop(0, "#090d0f");
  backgroundGradient.addColorStop(1, "#111618");
  context.fillStyle = backgroundGradient;
  context.fillRect(0, 0, width, height);

  if (includeHeader) {
    context.fillStyle = "rgba(190,242,100,0.9)";
    context.font = '700 18px "Public Sans", sans-serif';
    context.fillText("Strategic STRATEGIC SAVE", 34, 40);

    context.fillStyle = "#F5F5F4";
    context.font = '700 46px "Space Grotesk", sans-serif';
    context.fillText(save?.title ?? "Untitled Strategy", 34, 86);

    context.fillStyle = "rgba(231,229,228,0.7)";
    context.font = '400 20px "Public Sans", sans-serif';
    context.fillText(
      save?.note?.trim() || "Ronograd tactical board snapshot",
      34,
      114,
    );
  }

  roundRectPath(context, contentX, drawY, drawWidth, drawHeight, 26);
  context.save();
  context.clip();
  context.fillStyle = "#0b0f11";
  context.fillRect(contentX, drawY, drawWidth, drawHeight);
  context.drawImage(viewportCanvas, contentX, drawY, drawWidth, drawHeight);
  context.restore();

  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1.2;
  roundRectPath(context, contentX, drawY, drawWidth, drawHeight, 26);
  context.stroke();

  return outputCanvas;
}

export async function renderStrategySnapshotDataUrl(
  save,
  {
    type = "image/webp",
    quality = 0.86,
    ...options
  } = {},
) {
  const canvas = await renderStrategySnapshotCanvas(save, options);
  return canvas.toDataURL(type, quality);
}

export async function renderStrategySnapshotBlob(save, options) {
  const canvas = await renderStrategySnapshotCanvas(save, options);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Failed to create snapshot blob."));
    }, "image/png");
  });
}
