const mongoose = require("mongoose");
const JobTypeSchema = mongoose.Schema({
  jobDescription: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  eqType: {
    type: String,
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("jobTypes", JobTypeSchema),
  schema: JobTypeSchema,
};
