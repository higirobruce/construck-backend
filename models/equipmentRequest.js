const mongoose = require("mongoose");
const prSchema = require("./projects");

const EquipmentRequestSchema = new mongoose.Schema({
  referenceNumber:{
    type: String
  },
  project: Object,
  location:{
    type: String
  },
  equipmentType:{
    type: String
  },
  quantity:{
    type: Number
  },
  dispatchDate:{
    type: Date
  }
});

module.exports = {
  model: mongoose.model("requests", EquipmentRequestSchema),
  schema: EquipmentRequestSchema,
};
