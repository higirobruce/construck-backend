const mongoose = require("mongoose");
const DowntimeSchema = mongoose.Schema({
  date: {
    type: mongoose.SchemaTypes.Date,
  },
  dateToWorkshop: {
    type: mongoose.SchemaTypes.Date,
  },
  dateFromWorkshop: {
    type: mongoose.SchemaTypes.Date,
  },
  durationInWorkshop: {
    type: Number,
    default: 0,
  },
  equipment: {
    type: mongoose.SchemaTypes.ObjectId,
    transform: (v) => (v === "" ? null : v),
    ref: "equipments",
  },
});

module.exports = {
  model: mongoose.model("downtimes", DowntimeSchema),
  schema: DowntimeSchema,
};
