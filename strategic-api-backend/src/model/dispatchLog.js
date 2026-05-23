/*
 * Team DUKUN PASKUS 791 - Strategic Dispatch Log
 */

const mongoose = require("mongoose");

const dispatchLogSchema = new mongoose.Schema(
  {
    saveId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("StrategicDispatchLog", dispatchLogSchema);
