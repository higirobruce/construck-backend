const mongoose = require("mongoose");

const EquipmentSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  eqtype: {
    type: String,
  },
  eqOwner: {
    type: String, // can refer to vendors
  },
  eqStatus: {
    type: String,
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("equipments", EquipmentSchema),
  schema: EquipmentSchema,
};
