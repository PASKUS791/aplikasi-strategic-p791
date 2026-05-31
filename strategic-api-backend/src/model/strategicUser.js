/*
 * Team DUKUN PASKUS 791 - Strategic User Model
 */

const mongoose = require("mongoose");

const accessSchema = new mongoose.Schema(
  {
    mainPlanner: {
      type: Boolean,
      default: true,
    },
    customMaps: {
      type: Boolean,
      default: true,
    },
    saves: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const strategicUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    nama: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      default: "Strategic Command",
      trim: true,
    },
    scope: {
      type: String,
      default: "strategic",
      enum: ["strategic"],
    },
    role: {
      type: String,
      enum: ["admin", "scout", "user"],
      default: "user",
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    access: {
      type: accessSchema,
      default: () => ({
        mainPlanner: true,
        customMaps: true,
        saves: true,
      }),
    },
    isPrimaryAdmin: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

strategicUserSchema.index({ scope: 1, username: 1 }, { unique: true });

module.exports = mongoose.model("StrategicUser", strategicUserSchema);
