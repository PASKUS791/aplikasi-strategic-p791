/*
 * Team DUKUN PASKUS 791 - Strategic Resource Model
 */

const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    scope: {
      type: String,
      default: "strategic",
      enum: ["strategic"],
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("StrategicResource", resourceSchema);
