/*
 * Team DUKUN PASKUS 791 - Strategic Dispatch Controller
 */

const StrategicResource = require("../model/resource");
const StrategicDispatchLog = require("../model/dispatchLog");
const { broadcastResourceEvent } = require("../utils/sse");

const STRATEGIC_WEBHOOK_NAME = "Strategic Admin";
const SNAPSHOT_DATA_URL_PATTERN = /^data:(image\/[^;,]+)(?:;[^,]+)*;base64,([\s\S]+)$/i;
const MIME_EXTENSION_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const STRATEGIC_WEBHOOK_URL = String(
  process.env.DISCORD_STRATEGIC_WEBHOOK_URL || "",
).trim();

function withWaitQuery(webhookUrl) {
  return webhookUrl.includes("?") ? `${webhookUrl}&wait=true` : `${webhookUrl}?wait=true`;
}

function readWebhookAvatarUrl() {
  const explicitUrl = String(process.env.Strategic_WEBHOOK_AVATAR_URL || "").trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  const publicAppUrl = String(
    process.env.PUBLIC_APP_URL ||
      process.env.Strategic_PUBLIC_APP_URL ||
      process.env.Strategic_SITE_URL ||
      "https://strategic.so791.com",
  )
    .trim()
    .replace(/\/$/, "");

  return `${publicAppUrl}/paskus-logo.webp`;
}

function readSaveSourceLabel(save) {
  if (save?.sourceType === "custom-map") {
    return `Custom Map • ${save?.sourceMapTitle || "Custom Board"}`;
  }

  return "Map Planner • Ronograd";
}

function readStrategicSnapshotDataUrl(save, options = {}) {
  const optionSnapshotDataUrl = String(options.snapshotDataUrl || "").trim();

  if (optionSnapshotDataUrl) {
    return optionSnapshotDataUrl;
  }

  const saveSnapshotDataUrl = String(
    save?.thumbnailDataUrl || save?.snapshotThumbnailDataUrl || save?.snapshot?.thumbnailDataUrl || "",
  ).trim();

  return saveSnapshotDataUrl;
}

function parseSnapshotDataUrl(dataUrl) {
  const rawDataUrl = String(dataUrl || "").trim();
  const matched = SNAPSHOT_DATA_URL_PATTERN.exec(rawDataUrl);

  if (!matched) {
    return null;
  }

  const mimeType = String(matched[1] || "").toLowerCase();
  const extension = MIME_EXTENSION_MAP[mimeType];

  if (!extension) {
    return null;
  }

  try {
    const encodedBody = String(matched[2] || "").replace(/\s+/g, "");
    const binaryBuffer = Buffer.from(encodedBody, "base64");

    if (!binaryBuffer.length) {
      return null;
    }

    return {
      mimeType,
      extension,
      binaryBuffer,
    };
  } catch {
    return null;
  }
}

function buildSnapshotFileName(save, extension) {
  const normalizedTitle = String(save?.title || "strategic-save")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalizedTitle || "strategic-save"}.${extension}`;
}

function buildStrategicWebhookPayload(save, options = {}) {
  const snapshotAttachmentName = String(options.snapshotAttachmentName || "").trim();
  const avatarUrl = readWebhookAvatarUrl();
  const zoomValue = Math.max(
    0,
    Math.round((Number(save?.snapshot?.viewport?.scale) || 0) * 100),
  );
  const embed = {
    title: save?.title || "Strategic Save",
    description: save?.note || "Snapshot strategi dikirim dari Strategic Center.",
    color: 12646984,
    author: {
      name: STRATEGIC_WEBHOOK_NAME,
      icon_url: avatarUrl,
    },
    thumbnail: {
      url: avatarUrl,
    },
    footer: {
      text: "Strategic Channel • Ronograd Planning Dispatch",
    },
    timestamp: save?.updatedAt || save?.createdAt || new Date().toISOString(),
    fields: [
      {
        name: "Actions",
        value: String(save?.actionCount || 0),
        inline: true,
      },
      {
        name: "Categories",
        value: String(save?.categoryCount || 0),
        inline: true,
      },
      {
        name: "Zoom",
        value: `${zoomValue}%`,
        inline: true,
      },
      {
        name: "Source",
        value: readSaveSourceLabel(save),
        inline: false,
      },
    ],
  };

  if (snapshotAttachmentName) {
    embed.image = {
      url: `attachment://${snapshotAttachmentName}`,
    };
  }

  return {
    username: STRATEGIC_WEBHOOK_NAME,
    avatar_url: avatarUrl,
    content: `Strategic dispatch untuk ${save?.title || "snapshot taktis"}.`,
    embeds: [embed],
    allowed_mentions: { parse: [] },
  };
}

async function readWebhookError(response) {
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();

  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || payload?.error;
    return message ? String(message) : "";
  }

  return String(await response.text().catch(() => "")).trim();
}

async function dispatchStrategicSaveToDiscord(save, options = {}) {
  if (!STRATEGIC_WEBHOOK_URL) {
    const configError = new Error(
      "DISCORD_STRATEGIC_WEBHOOK_URL belum diatur di environment server.",
    );
    configError.status = 503;
    throw configError;
  }

  let response;
  const snapshotDataUrl = readStrategicSnapshotDataUrl(save, options);
  const snapshot = parseSnapshotDataUrl(snapshotDataUrl);
  const snapshotAttachmentName = snapshot
    ? buildSnapshotFileName(save, snapshot.extension)
    : "";
  const payload = buildStrategicWebhookPayload(save, {
    snapshotAttachmentName,
  });

  try {
    if (snapshot) {
      const formData = new FormData();
      formData.append("payload_json", JSON.stringify(payload));
      formData.append(
        "files[0]",
        new Blob([snapshot.binaryBuffer], { type: snapshot.mimeType }),
        snapshotAttachmentName,
      );

      response = await fetch(withWaitQuery(STRATEGIC_WEBHOOK_URL), {
        method: "POST",
        body: formData,
      });
    } else {
      response = await fetch(withWaitQuery(STRATEGIC_WEBHOOK_URL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    const networkError = new Error(
      "Gagal terhubung ke Discord webhook. Cek koneksi jaringan server.",
    );
    networkError.status = 502;
    throw networkError;
  }

  if (!response.ok) {
    const webhookError = await readWebhookError(response);
    const sendError = new Error(
      webhookError
        ? `Discord webhook menolak request: ${webhookError}`
        : "Discord webhook menolak request.",
    );
    sendError.status = 502;
    throw sendError;
  }

  return response.json().catch(() => null);
}

exports.dispatchStrategicSave = async (req, res) => {
  const saveId = String(req.params.id || "").trim();
  const resource = await StrategicResource.findOne({ name: "strategic.strategicSaves" });

  if (!resource || !Array.isArray(resource.value)) {
    return res.status(404).json({ message: "Strategic save belum tersedia." });
  }

  const saveIndex = resource.value.findIndex((entry) => String(entry?.id || "") === saveId);

  if (saveIndex === -1) {
    return res.status(404).json({ message: "Strategic save tidak ditemukan." });
  }

  const currentSave = resource.value[saveIndex];
  const requestSnapshotDataUrl = String(
    req.body?.thumbnailDataUrl || req.body?.snapshotDataUrl || "",
  ).trim();
  let webhookPayload = null;

  try {
    webhookPayload = await dispatchStrategicSaveToDiscord(currentSave, {
      snapshotDataUrl: requestSnapshotDataUrl,
    });
  } catch (dispatchError) {
    return res.status(dispatchError.status || 502).json({
      message: dispatchError.message || "Gagal mengirim strategi ke Discord.",
    });
  }

  const nextSave = {
    ...currentSave,
    dispatchedAt: new Date().toISOString(),
    dispatchedBy: {
      id: req.user.id,
      username: req.user.username,
      label: req.user.label,
    },
  };

  resource.value.splice(saveIndex, 1, nextSave);
  resource.markModified("value");
  resource.updatedBy = {
    id: req.user.id,
    username: req.user.username,
    label: req.user.label,
  };
  await resource.save();

  await StrategicDispatchLog.create({
    saveId,
    title: currentSave?.title || "",
    dispatchedBy: {
      id: req.user.id,
      username: req.user.username,
      label: req.user.label,
    },
    note: currentSave?.note || "",
  });

  broadcastResourceEvent("strategic.strategicSaves");

  return res.status(200).json({
    message: "Strategi berhasil dikirim ke Strategic Channel.",
    messageId: String(webhookPayload?.id || ""),
    save: nextSave,
  });
};
