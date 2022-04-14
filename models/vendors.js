const mongoose = require("mongoose");
const VendorSchema = mongoose.Schema({
  fistName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  tinNumber: {
    type: String,
  },
  createdOn: {
    type: mongoose.SchemaTypes.Date,
    default: Date.now(),
  },
});

module.exports = {
  model: mongoose.model("vendors", VendorSchema),
  schema: VendorSchema,
};
