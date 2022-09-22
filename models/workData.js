const mongoose = require("mongoose");
const prjSchema = require("./projects").schema;
const dispSchema = require("./dispatches").schema;
const eqSchema = require("./equipments").schema;

const WorkSchema = new mongoose.Schema({
  project: {
    type: Object,
  },
  equipment: {
    type: Object,
  },
  dispatch: {
    type: Object,
  },
  driver: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "employees",
  },
  workDone: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "jobTypes",
  },
  startIndex: {
    type: Number,
  },
  endIndex: {
    type: Number,
  },
  startTime: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
  endTime: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
  duration: {
    type: Number,
    default: 0,
  },
  tripsDone: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  totalExpenditure: {
    type: Number,
    default: 0,
  },
  projectedRevenue: {
    type: Number,
    default: 0,
  },
  comment: {
    type: String,
  },

  moreComment: {
    type: String,
  },
  status: {
    type: String,
  },
  uom: {
    type: String,
  },
  rate: {
    type: Number,
  },
  reasonForRejection: {
    type: String,
  },
  siteWork: {
    type: Boolean,
  },
  workStartDate: {
    type: Date,
  },
  workEndDate: {
    type: Date,
  },
  workDurationDays: { type: Number, default: 0 },
  dailyWork: {
    type: Array,
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
  createdBy: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "users",
  },
  approved_amount: {
    type: Number,
    default: 0,
  },
  approved_duration: {
    type: Number,
    default: 0,
  },
  declined_amount: {
    type: Number,
    default: 0,
  },
  declined_duration: {
    type: Number,
    default: 0,
  },
  declined_reason: {
    type: String,
    default: "",
  },
});

module.exports = {
  model: mongoose.model("work", WorkSchema),
  schema: WorkSchema,
};
