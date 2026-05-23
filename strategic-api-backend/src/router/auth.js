const express = require("express");
const { login, logout, me, session } = require("../controller/auth");

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/session", session);
router.get("/me", me);

module.exports = router;
