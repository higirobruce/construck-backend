const { Maintenance } = require("../models/maintenance");
const moment = require("moment");
const express = require("express");
const router = express.Router();

router.get("/maintenance/repair", async (req, res) => {
  const jobCards = await Maintenance.find();

  if (!jobCards)
    return res.status(404).json({ message: "No JobCards Available" });

  res.status(200).send(jobCards);
});

router.get("/maintenance", async (req, res) => {
  let { limit, page, status, search } = req.query;

  console.log(status);
  let query = {};
  if(search){
    status='open'
  }

  query = {
    ...(status === "open" && { status: { $nin: ["pass"] } }),
    ...(status !== "open" && { status: { $eq: status } }),
    ...(search && { "plate.text": { $regex: search, $options: "i" } }),
  };

  let qStatus = status == "open" ? { $nin: ["pass"] } : { $eq: status };

  const dataCount = await Maintenance.find(query).count({});
  const openDataCount = await Maintenance.find({
    status: { $ne: "pass" },
  }).count({});
  const requisitionDataCount = await Maintenance.find({
    status: { $eq: "requisition" },
  }).count({});
  const entryDataCount = await Maintenance.find({
    status: { $eq: "entry" },
  }).count({});
  const diagnosisDataCount = await Maintenance.find({
    status: { $eq: "diagnosis" },
  }).count({});
  const repairDataCount = await Maintenance.find({
    status: { $eq: "repair" },
  }).count({});
  const testingDataCount = await Maintenance.find({
    status: { $eq: "testing" },
  }).count({});
  const closedDataCount = await Maintenance.find({
    status: { $eq: "pass" },
  }).count({});

  const jobCards =
    status !== "all"
      ? await Maintenance.find(query)
          .sort({ jobCard_Id: -1 })
          .limit(limit)
          .skip(parseInt(page - 1) * limit)
      : await Maintenance.find(query).sort({ jobCard_Id: -1 });
  if (!jobCards)
    return res.status(404).json({ message: "No JobCards Available" });

  res.status(200).send({
    jobCards,
    dataCount,
    openDataCount,
    entryDataCount,
    diagnosisDataCount,
    repairDataCount,
    testingDataCount,
    closedDataCount,
    requisitionDataCount,
  });
  // res.status(200).send(jobCards)
});
router.post("/maintenance", async (req, res) => {
  const { entryDate, driver, carPlate, mileages, location, status } =
    req.body.payload;

  const jobCards = await Maintenance.find();

  // Checking if it's still in the repair mode
  const stillInRepair = jobCards.find((item) => {
    if (item.plate.value == carPlate.value && item.status == "Checking")
      return item;
  });

  if (stillInRepair)
    return res.status(400).json({
      message: "The equipment is still in repair or Issues with Mileages",
    });

  //   const lowMileages = jobCards.find(
  //     (item) =>
  //       item.plate.value == carPlate.value && item.mileage > mileages && item
  //   );
  //   if (mileages && mileages.length > 0 && lowMileages)
  //     return res
  //       .status(400)
  //       .json({ message: "Mileages input are low to the previous" });

  // Saving the Job Card
  const jobCard = new Maintenance({
    jobCard_Id:
      (jobCards.length + 1 < 10
        ? `000${jobCards.length + 1}`
        : jobCards.length + 1 < 100
        ? `00${jobCards.length + 1}`
        : jobCards.length + 1 < 1000
        ? `0${jobCards.length + 1}`
        : `${jobCards.length + 1}`) +
      "-" +
      (new Date().getUTCMonth() < 10
        ? `0${new Date().getMonth() + 1}`
        : new Date().getUTCMonth()) +
      "-" +
      new Date().getFullYear().toString().substr(2),
    entryDate,
    driver,
    plate: carPlate,
    mileage: mileages,
    location,
    status,
    jobCard_status: "opened",
  });

  await jobCard.save();

  return res.status(200).send(jobCard);
});

router.put("/maintenance/:id", async (req, res) => {
  const {
    jobCard_id,
    entryDate,
    driver,
    plate,
    mileages,
    location,
    startRepair,
    endRepair,
    status,
    inspectionTools,
    mechanicalInspections,
    assignIssue,
    operator,
    sourceItem,
    operatorApproval,
    supervisorApproval,
    inventoryItems,
    inventoryData,
    transferData,
    teamApproval,
    transferParts,
    isViewed,
    reason,
    operatorNotApplicable,
    mileagesNotApplicable,
    requestParts,
    receivedParts,
  } = req.body.payload;

  const jobCard = await Maintenance.findByIdAndUpdate(
    req.params.id,
    {
      jobCard_Id: jobCard_id,
      entryDate,
      driver,
      plate,
      mileage: mileages,
      location,
      startRepair,
      endRepair: supervisorApproval == true ? moment() : "",
      status:
        supervisorApproval == true
          ? "pass"
          : sourceItem == "No Parts Required" && status == "repair"
          ? "repair"
          : status,
      inspectionTools,
      mechanicalInspections,
      assignIssue,
      operator,
      transferData,
      inventoryData,
      inventoryItems,
      sourceItem,
      operatorApproval,
      teamApproval,
      transferParts,
      isViewed,
      reason,
      jobCard_status: supervisorApproval == true ? "closed" : "opened",
      updated_At: moment(),
      operatorNotApplicable,
      mileagesNotApplicable,
      requestParts,
      receivedParts,
    },
    { new: true }
  );

  if (!jobCard)
    return res.status(404).send("The Job Card with the given ID was not found");

  await jobCard.save();

  return res.status(200).send(jobCard);
});

module.exports = router;
