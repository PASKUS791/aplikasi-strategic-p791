const express = require("express");
const { getResource, saveResource } = require("../controller/resource");
const { requireAuth } = require("../middleware/authuser");

const router = express.Router();

router.get("/:resourceKey", requireAuth, getResource);
router.put("/:resourceKey", requireAuth, saveResource);

module.exports = router;
