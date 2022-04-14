const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  prjDescription: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  customer: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "customers",
  },
  startDate: {
    type: Date, // can refer to vendors
  },
  endDate: {
    type: Date, // can refer to vendors
  },
  status: {
    type: String,
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("projects", ProjectSchema),
  schema: ProjectSchema,
};
