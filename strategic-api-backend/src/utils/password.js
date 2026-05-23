/*
 * Team DUKUN PASKUS 791 - Password Helpers
 */

const bcrypt = require("bcrypt");

function getSaltRounds() {
  const parsed = Number.parseInt(process.env.SALT_ROUNDS || "10", 10);
  return Number.isFinite(parsed) && parsed > 3 ? parsed : 10;
}

async function hashPassword(password) {
  return bcrypt.hash(String(password || ""), getSaltRounds());
}

async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(String(password || ""), String(hashedPassword || ""));
}

module.exports = {
  comparePassword,
  hashPassword,
};
