const mongoose = require("mongoose");

const ReasonSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  descriptionRw: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("reasons", ReasonSchema),
  schema: ReasonSchema,
};
