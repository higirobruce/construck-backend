const router = require("express").Router();
const eqData = require("../models/equipments");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const equipments = await eqData.model.find();
    res.status(200).send({ equipments, nrecords: equipments.length });
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

router.get("/type/:type", async (req, res) => {
  let { type } = req.params;
  try {
    const equipment = await eqData.model.find({
      eqtype: type,
      eqStatus: "available",
    });
    res.status(200).send(equipment);
  } catch (err) {
    res.send(err);
  }
});

router.get("/type/:type/:date/:shift", async (req, res) => {
  let { type, date, shift } = req.params;
  try {
    const equipment = await eqData.model.find({
      eqtype: type,
      $or: [
        { eqStatus: "available" },
        {
          eqStatus: "assigned to job",
          assignedShift: { $ne: shift },
        },
        {
          eqStatus: "assigned to job",
          assignedDate: { $ne: date },
        },
        {
          eqStatus: "dispatched",
          assignedShift: { $ne: shift },
        },
        {
          eqStatus: "dispatched",
          assignedDate: { $ne: date },
        },
      ],
    });
    res.status(200).send(equipment);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    eqData.model.findOne(
      {
        plateNumber: req.body.plateNumber,
      },
      async (err, eq) => {
        if (err) console.log(err);
        if (eq) {
          res.send({
            error: "Duplicate key",
            key: "Plate number",
          });
        } else {
          try {
            const eqToCreate = new eqData.model(req.body);
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
        }
      }
    );
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

router.put("/makeAvailable/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);

    equipment.eqStatus = "available";

    let savedRecord = await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/assignToJob/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);

    equipment.eqStatus = "assigned to work";

    let savedRecord = await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/sendToWorkshop/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);

    equipment.eqStatus = "workshop";

    let savedRecord = await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/release/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let equipment = await eqData.model.findById(id);

    equipment.eqStatus = "available";

    let savedRecord = await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
