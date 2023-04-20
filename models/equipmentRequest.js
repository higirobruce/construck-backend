const mongoose = require("mongoose");
const prSchema = require("./projects");

const EquipmentRequestSchema = new mongoose.Schema({
  referenceNumber:{
    type: String
  },
  project: String,
  equipmentType:{
    type: mongoose.Types.ObjectId,
    ref: 'equipmenttypes'
  },
  quantity:{
    type: Number
  },
  startDate:{
    type: Date
  },
  endDate:{
    type: Date
  },
  shift: {
    type: String
  },
  status: {
    type: String,
    default: 'pending'
  }
});

module.exports = {
  model: mongoose.model("requests", EquipmentRequestSchema),
  schema: EquipmentRequestSchema,
};
