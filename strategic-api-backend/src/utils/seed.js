/*
 * Team DUKUN PASKUS 791 - Bootstrap Seed
 */

const fs = require("fs");
const path = require("path");
const StrategicUser = require("../model/strategicUser");
const StrategicResource = require("../model/resource");
const { hashPassword } = require("./password");
const {
  buildMapPlannerUsersSnapshot,
  normalizeStrategicAccess,
  normalizeStrategicRole,
  normalizeStrategicUsername,
} = require("./strategicUsers");
const { DEFAULT_RESOURCE_VALUES, cloneValue } = require("./resources");

function resolveSeedFilePath() {
  const customPath = String(process.env.Strategic_SEED_FILE || "").trim();

  if (customPath) {
    return path.isAbsolute(customPath)
      ? customPath
      : path.resolve(process.cwd(), customPath);
  }

  return path.resolve(__dirname, "../../../backend-contract/strategic-seed.json");
}

function loadSeedPayload() {
  try {
    return JSON.parse(fs.readFileSync(resolveSeedFilePath(), "utf8"));
  } catch {
    return null;
  }
}

async function syncMapPlannerUsersResource() {
  const users = await StrategicUser.find({ scope: "strategic", active: true }).sort({
    isPrimaryAdmin: -1,
    createdAt: 1,
  });

  const nextValue = buildMapPlannerUsersSnapshot(users);

  await StrategicResource.findOneAndUpdate(
    { name: "strategic.mapPlannerUsers" },
    {
      $set: {
        scope: "strategic",
        value: nextValue,
        updatedBy: {
          username: "system",
          label: "Bootstrap",
        },
      },
    },
    {
      upsert: true,
      new: true,
    },
  );

  return nextValue;
}

async function ensurePrimaryAdmin(seedPayload) {
  const seedAdmin =
    seedPayload?.users?.find((entry) => entry.isPrimaryAdmin) || null;

  const username = normalizeStrategicUsername(
    process.env.PRIMARY_STRATEGIC_OPERATOR_ID ||
      process.env.PRIMARY_STRATEGIC_USERNAME ||
      seedAdmin?.operatorId ||
      seedAdmin?.username ||
      "strategicadmin",
  );
  const label = String(
    process.env.PRIMARY_STRATEGIC_LABEL || seedAdmin?.label || "Strategic Admin",
  ).trim();
  const unit = String(
    process.env.PRIMARY_STRATEGIC_UNIT || seedAdmin?.unit || "Strategic Command",
  ).trim();
  const password = String(
    process.env.PRIMARY_STRATEGIC_SECURITY_KEY ||
      process.env.PRIMARY_STRATEGIC_PASSWORD ||
      seedAdmin?.securityKey ||
      seedAdmin?.password ||
      "ChangeMeStrategic123!",
  );

  await StrategicUser.findOneAndUpdate(
    { scope: "strategic", username },
    {
      $set: {
        label,
        nama: label,
        unit,
        role: "admin",
        password: await hashPassword(password),
        access: {
          mainPlanner: true,
          customMaps: true,
          saves: true,
        },
        active: true,
        isPrimaryAdmin: true,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
}

async function ensureSeedUsers(seedPayload) {
  const seedUsers = Array.isArray(seedPayload?.users) ? seedPayload.users : [];

  for (const entry of seedUsers) {
    const username = normalizeStrategicUsername(entry.operatorId || entry.username);

    if (!username) {
      continue;
    }

    const existing = await StrategicUser.findOne({ scope: "strategic", username }).select("_id");
    if (existing) {
      continue;
    }

    await StrategicUser.create({
      username,
      label: String(entry.label || entry.nama || username),
      nama: String(entry.nama || entry.label || username),
      unit: String(entry.unit || "Strategic Command"),
      scope: "strategic",
      role: entry.isPrimaryAdmin ? "admin" : normalizeStrategicRole(entry.role),
      password: await hashPassword(entry.securityKey || entry.password || "ChangeMeStrategic123!"),
      access: normalizeStrategicAccess(entry.access),
      isPrimaryAdmin: entry.isPrimaryAdmin === true,
      active: true,
    });
  }
}

async function ensureResourceDefaults(seedPayload) {
  const seedResources = seedPayload?.resources || {};

  for (const [resourceKey, defaultValue] of Object.entries(DEFAULT_RESOURCE_VALUES)) {
    const existing = await StrategicResource.findOne({ name: resourceKey }).select("_id");

    if (existing) {
      continue;
    }

    await StrategicResource.create({
      name: resourceKey,
      scope: "strategic",
      value: cloneValue(seedResources[resourceKey] ?? defaultValue),
      updatedBy: {
        username: "system",
        label: "Bootstrap",
      },
    });
  }
}

async function bootstrapStrategicData() {
  const seedPayload = loadSeedPayload();

  await ensureSeedUsers(seedPayload);
  await ensurePrimaryAdmin(seedPayload);
  await ensureResourceDefaults(seedPayload);
  await syncMapPlannerUsersResource();

  return seedPayload;
}

module.exports = {
  bootstrapStrategicData,
  loadSeedPayload,
  resolveSeedFilePath,
  syncMapPlannerUsersResource,
};
