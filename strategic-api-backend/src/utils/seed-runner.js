/*
 * Team DUKUN PASKUS 791 - Manual Seed Runner
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const { bootstrapStrategicData, resolveSeedFilePath } = require("./seed");

async function main() {
  await mongoose.connect(process.env.DB);
  await bootstrapStrategicData();
  console.log(`Seed Strategic selesai diproses dari ${resolveSeedFilePath()}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Seed Strategic gagal:", error);
  process.exitCode = 1;
});
