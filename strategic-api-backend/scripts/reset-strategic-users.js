/*
 * Team DUKUN PASKUS 791
 * Reset user Strategic: sisakan admin utama + tambah 1 admin baru.
 */

const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const StrategicUser = require("../src/model/strategicUser");
const { hashPassword } = require("../src/utils/password");
const { syncMapPlannerUsersResource } = require("../src/utils/seed");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const KEEP_USERNAME = String(
  process.env.PRIMARY_STRATEGIC_OPERATOR_ID ||
    process.env.PRIMARY_STRATEGIC_USERNAME ||
    "strategicadmin",
)
  .trim()
  .toLowerCase();
const KEEP_PASSWORD = String(
  process.env.PRIMARY_STRATEGIC_SECURITY_KEY ||
    process.env.PRIMARY_STRATEGIC_PASSWORD ||
    "ChangeMeStrategic123!",
);
const NEW_ADMIN_USERNAME = String(
  process.env.NEW_STRATEGIC_ADMIN_OPERATOR_ID ||
    process.env.NEW_STRATEGIC_ADMIN_USERNAME ||
    "adminstrategic",
)
  .trim()
  .toLowerCase();
const NEW_ADMIN_PASSWORD = String(
  process.env.NEW_STRATEGIC_ADMIN_SECURITY_KEY ||
    process.env.NEW_STRATEGIC_ADMIN_PASSWORD ||
    "ChangeMeAdminStrategic123!",
);

async function runReset() {
  if (!process.env.DB) {
    throw new Error("DB env belum diatur di strategic-api-backend/.env");
  }

  await mongoose.connect(process.env.DB);

  const deleteResult = await StrategicUser.deleteMany({
    scope: "strategic",
    username: { $nin: [KEEP_USERNAME, NEW_ADMIN_USERNAME] },
  });

  await StrategicUser.findOneAndUpdate(
    { scope: "strategic", username: KEEP_USERNAME },
    {
      $set: {
        label: "Strategic Admin",
        nama: "Strategic Admin",
        unit: "Strategic Command",
        password: await hashPassword(KEEP_PASSWORD),
        access: {
          mainPlanner: true,
          customMaps: true,
          saves: true,
        },
        isPrimaryAdmin: true,
        active: true,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  await StrategicUser.findOneAndUpdate(
    { scope: "strategic", username: NEW_ADMIN_USERNAME },
    {
      $set: {
        label: "Admin Strategic",
        nama: "Admin Strategic",
        unit: "Strategic Command",
        password: await hashPassword(NEW_ADMIN_PASSWORD),
        access: {
          mainPlanner: true,
          customMaps: true,
          saves: true,
        },
        isPrimaryAdmin: true,
        active: true,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  await syncMapPlannerUsersResource();

  const users = await StrategicUser.find({ scope: "strategic", active: true })
    .sort({ isPrimaryAdmin: -1, username: 1 })
    .select("username label isPrimaryAdmin active");

  console.log(
    JSON.stringify(
      {
        ok: true,
        removedUsers: deleteResult.deletedCount,
        users,
      },
      null,
      2,
    ),
  );
}

runReset()
  .catch((error) => {
    console.error("RESET_Strategic_USERS_FAILED", error?.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors during shutdown.
    }
  });
