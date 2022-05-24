const mongoose = require("mongoose");
const prjSchema = require("./projects").schema;
const DispatchSchema = mongoose.Schema({
  dispatchDescription: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  project: {
    type: prjSchema,
  },
  jobType: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    transform: (v) => (v === "" ? null : v),
    ref: "jobTypes",
  },

  status: {
    type: String,
    default: "on going",
  },
  fromSite: {
    type: String,
  },
  toSite: {
    type: String,
  },
  targetTrips: {
    type: Number,
    default: 1,
  },
  equipments: {
    type: Array,
  },
  shift: {
    type: String,
    required: true,
  },
  drivers: {
    type: Array,
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("dispatches", DispatchSchema),
  schema: DispatchSchema,
};
