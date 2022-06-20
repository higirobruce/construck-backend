const mongoose = require("mongoose");
const prSchema = require("./projects");

const EquipmentSchema = new mongoose.Schema({
  plateNumber: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  eqDescription: {
    type: String,
  },
  assetClass: {
    type: String,
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
  rate: {
    type: Number,
    default: 0,
  },
  supplierRate: {
    type: Number,
    default: 0,
  },
  uom: {
    type: String,
    required: true,
  },
  assignedDate: {
    type: Date,
  },
  assignedShift: {
    type: String,
  },
  millage: {
    type: Number,
  },
  assignedToSiteWork: { type: Boolean, default: false },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("equipments", EquipmentSchema),
  schema: EquipmentSchema,
};
