const mongoose = require("mongoose");
const AssetAvbltySchema = mongoose.Schema({
  date: {
    type: mongoose.SchemaTypes.Date,
  },
  available: {
    type: Number,
  },
  unavailable: {
    type: Number,
  },
  dispatched: {
    type: Number,
  },
  standby: {
    type: Number,
  },
});

module.exports = {
  model: mongoose.model("asset_availability", AssetAvbltySchema),
  schema: AssetAvbltySchema,
};
