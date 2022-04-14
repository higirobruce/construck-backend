const mongoose = require("mongoose");
const CustomerSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
  },
  tinNumber: {
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
  model: mongoose.model("customers", CustomerSchema),
  schema: CustomerSchema,
};
