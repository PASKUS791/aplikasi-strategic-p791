/*
 * Team DUKUN PASKUS 791 - Server Address Webhook Controller
 */

const Joi = require("joi");
const { sendSecurityBlock } = require("../utils/security");

const WEBHOOK_DISPLAY_NAME = "Administrasi Paskus";
const STATUS_ACTIVE = "Active";
const STATUS_INACTIVE = "In Active";
const FIXED_SERVER_ADDRESS_WEBHOOK_URL = String(
  process.env.Strategic_SERVER_ADDRESS_WEBHOOK_URL ||
    process.env.DISCORD_SERVER_ADDRESS_WEBHOOK_URL ||
    "https://discord.com/api/webhooks/1491364962839433218/ggJ6D8iNODfMVmO9PcxMd9z9PNES_AS4W2opcuoPxp7u3ppmlK0DVomh8xw_wZpEs2lM",
).trim();

const dispatchSchema = Joi.object({
  serverAddress: Joi.string().trim().min(1).max(220).required(),
  status: Joi.string()
    .trim()
    .min(2)
    .max(32)
    .required(),
});

const updateSchema = dispatchSchema.keys({
  messageId: Joi.string().trim().pattern(/^\d{17,24}$/).required(),
});

const deleteSchema = Joi.object({
  messageId: Joi.string().trim().pattern(/^\d{17,24}$/).required(),
});

function normalizeServerStatus(rawStatus) {
  const status = String(rawStatus || "").trim().toLowerCase();

  if (
    ["active", "aktif", "online", "on", "1", "true", "yes"].includes(status)
  ) {
    return STATUS_ACTIVE;
  }

  if (
    ["inactive", "in active", "nonaktif", "offline", "off", "0", "false", "no"].includes(
      status,
    )
  ) {
    return STATUS_INACTIVE;
  }

  throw new Error("Status server wajib Active atau In Active.");
}

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

function buildServerAddressEmbed(serverAddress, status) {
  const avatarUrl = readWebhookAvatarUrl();

  const embed = {
    title: "Administrasi Paskus",
    description: `Alamat Server :\n${serverAddress}\n\nStatus : ${status}`,
    color: status === STATUS_ACTIVE ? 3066993 : 15158332,
    author: {
      name: WEBHOOK_DISPLAY_NAME,
      icon_url: avatarUrl,
    },
    thumbnail: {
      url: avatarUrl,
    },
    footer: {
      text: "Strategic Dashboard • Administrasi Server",
    },
    timestamp: new Date().toISOString(),
  };

  return {
    avatarUrl,
    embed,
  };
}

function buildWebhookCreatePayload(serverAddress, status) {
  const { avatarUrl, embed } = buildServerAddressEmbed(serverAddress, status);

  return {
    username: WEBHOOK_DISPLAY_NAME,
    avatar_url: avatarUrl,
    embeds: [embed],
    allowed_mentions: { parse: [] },
  };
}

function buildWebhookEditPayload(serverAddress, status) {
  const { embed } = buildServerAddressEmbed(serverAddress, status);

  return {
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

function hasSuspiciousPayload(inputValues = []) {
  const combined = inputValues
    .map((value) => String(value || ""))
    .join(" ")
    .toLowerCase();

  return [
    /(\bunion\b|\bselect\b|\bdrop\b|\binsert\b|\bdelete\b|\bupdate\b|--|\/\*|\*\/)/i,
    /(<script|javascript:|onerror=|onload=|<img|<svg|%3cscript)/i,
    /(\.\.\/|\.\.\\|\/etc\/passwd|cmd\.exe|powershell|wget\s|curl\s)/i,
  ].some((pattern) => pattern.test(combined));
}

exports.dispatchServerAddress = async (req, res) => {
  if (!FIXED_SERVER_ADDRESS_WEBHOOK_URL) {
    return res.status(503).json({
      message: "Webhook administrasi server belum dikonfigurasi.",
    });
  }

  if (hasSuspiciousPayload([req.body?.serverAddress, req.body?.status])) {
    return sendSecurityBlock(res, 403, "Payload administrasi server diblokir.", {
      type: "pentest-probe",
      title: "Payload Berbahaya Diblokir",
      classification:
        "Input yang dikirim menyerupai payload probing atau command injection.",
      detail:
        "Lapisan keamanan menahan payload sebelum diteruskan ke Discord webhook.",
    });
  }

  const { error, value } = dispatchSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: "Payload administrasi server tidak valid.",
      errors: error.details.map((detail) => detail.message),
    });
  }

  let status = "";

  try {
    status = normalizeServerStatus(value.status);
  } catch (validationError) {
    return res.status(400).json({ message: validationError.message });
  }

  const response = await fetch(withWaitQuery(FIXED_SERVER_ADDRESS_WEBHOOK_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(
      buildWebhookCreatePayload(value.serverAddress.trim(), status),
    ),
  });

  if (!response.ok) {
    const webhookError = await readWebhookError(response);
    return res.status(502).json({
      message: webhookError
        ? `Discord webhook menolak request: ${webhookError}`
        : "Discord webhook menolak request.",
    });
  }

  const payload = await response.json().catch(() => null);

  return res.status(200).json({
    ok: true,
    message: "Alamat server berhasil dikirim ke channel webhook.",
    messageId: String(payload?.id || ""),
    serverAddress: value.serverAddress.trim(),
    status,
  });
};

exports.updateServerAddress = async (req, res) => {
  if (!FIXED_SERVER_ADDRESS_WEBHOOK_URL) {
    return res.status(503).json({
      message: "Webhook administrasi server belum dikonfigurasi.",
    });
  }

  if (hasSuspiciousPayload([req.body?.serverAddress, req.body?.status])) {
    return sendSecurityBlock(res, 403, "Payload administrasi server diblokir.", {
      type: "pentest-probe",
      title: "Payload Berbahaya Diblokir",
      classification:
        "Input yang dikirim menyerupai payload probing atau command injection.",
      detail:
        "Lapisan keamanan menahan payload sebelum diteruskan ke Discord webhook.",
    });
  }

  const { error, value } = updateSchema.validate(
    {
      ...req.body,
      messageId: req.params.messageId,
    },
    { abortEarly: false },
  );

  if (error) {
    return res.status(400).json({
      message: "Payload edit administrasi server tidak valid.",
      errors: error.details.map((detail) => detail.message),
    });
  }

  let status = "";

  try {
    status = normalizeServerStatus(value.status);
  } catch (validationError) {
    return res.status(400).json({ message: validationError.message });
  }

  const endpoint = `${FIXED_SERVER_ADDRESS_WEBHOOK_URL}/messages/${encodeURIComponent(value.messageId)}`;
  const response = await fetch(withWaitQuery(endpoint), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(
      buildWebhookEditPayload(value.serverAddress.trim(), status),
    ),
  });

  if (!response.ok) {
    const webhookError = await readWebhookError(response);
    return res.status(502).json({
      message: webhookError
        ? `Gagal mengedit embed webhook: ${webhookError}`
        : "Gagal mengedit embed webhook.",
    });
  }

  const payload = await response.json().catch(() => null);

  return res.status(200).json({
    ok: true,
    message: "Embed alamat server berhasil diperbarui.",
    messageId: String(payload?.id || value.messageId),
    serverAddress: value.serverAddress.trim(),
    status,
  });
};

exports.deleteServerAddress = async (req, res) => {
  if (!FIXED_SERVER_ADDRESS_WEBHOOK_URL) {
    return res.status(503).json({
      message: "Webhook administrasi server belum dikonfigurasi.",
    });
  }

  const { error, value } = deleteSchema.validate(
    {
      messageId: req.params.messageId,
    },
    { abortEarly: false },
  );

  if (error) {
    return res.status(400).json({
      message: "Payload hapus administrasi server tidak valid.",
      errors: error.details.map((detail) => detail.message),
    });
  }

  const endpoint = `${FIXED_SERVER_ADDRESS_WEBHOOK_URL}/messages/${encodeURIComponent(value.messageId)}`;
  const response = await fetch(endpoint, {
    method: "DELETE",
  });

  if (!response.ok) {
    const webhookError = await readWebhookError(response);
    return res.status(502).json({
      message: webhookError
        ? `Gagal menghapus embed webhook: ${webhookError}`
        : "Gagal menghapus embed webhook.",
    });
  }

  return res.status(200).json({
    ok: true,
    message: "Embed alamat server berhasil dihapus.",
    messageId: value.messageId,
  });
};
