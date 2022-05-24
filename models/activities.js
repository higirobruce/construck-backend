const mongoose = require("mongoose");
const ActivitySchema = mongoose.Schema({
  activityDescription: {
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
  model: mongoose.model("activities", ActivitySchema),
  schema: ActivitySchema,
};
