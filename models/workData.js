const mongoose = require("mongoose");

const WorkSchema = new mongoose.Schema({
  project: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "projects",
  },
  equipment: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "equipments",
  },
  workDone: {
    type: String,
  },
  startIndex: {
    type: Number,
  },
  endIndex: {
    type: Number,
  },
  startTime: {
    type: mongoose.SchemaTypes.Date,
  },
  endTime: {
    type: mongoose.SchemaTypes.Date,
  },
  rate: {
    type: Number,
  },
  driver: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  status: {
    type: String,
  },
  appovedBy: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("work", WorkSchema),
  schema: WorkSchema,
};
