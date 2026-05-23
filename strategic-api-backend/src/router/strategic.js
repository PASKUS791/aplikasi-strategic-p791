const express = require("express");
const { dispatchStrategicSave } = require("../controller/dispatch");
const {
  deleteServerAddress,
  dispatchServerAddress,
  updateServerAddress,
} = require("../controller/serverAddress");
const { createUser, deleteUser, listUsers } = require("../controller/users");
const { requireAuth, requirePermission, requirePrimaryAdmin } = require("../middleware/authuser");

const router = express.Router();

router.get("/users", requireAuth, requirePrimaryAdmin, listUsers);
router.post("/users", requireAuth, requirePrimaryAdmin, createUser);
router.delete("/users/:username", requireAuth, requirePrimaryAdmin, deleteUser);
router.post(
  "/strategic-saves/:id/dispatch",
  requireAuth,
  requirePermission("saves"),
  dispatchStrategicSave,
);
router.post("/server-addresses/dispatch", requireAuth, dispatchServerAddress);
router.put("/server-addresses/:messageId", requireAuth, updateServerAddress);
router.delete("/server-addresses/:messageId", requireAuth, deleteServerAddress);

module.exports = router;
