const router = require("express").Router();
const eqData = require("../models/equipments");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const equipments = await eqData.model.find();
    res.status(200).send(equipments);
  } catch (err) {}
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const equipment = await eqData.model.findById(id);
    res.status(200).send(equipment);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let { plateNumber, eqtype, eqOwner, eqStatus } = req.body;
  try {
    const eqToCreate = new eqData.model({
      plateNumber,
      eqtype,
      eqOwner,
      eqStatus,
    });
    const eqCreated = await eqToCreate.save();
    res.status(201).send(eqCreated);
  } catch (err) {
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    res.send({
      error,
      key,
    });
  }
});

module.exports = router;
