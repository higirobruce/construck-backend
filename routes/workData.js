const router = require("express").Router();
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const workData = require("../models/workData");
const eqData = require("../models/equipments");

router.get("/", async (req, res) => {
  try {
    let workList = await workData.model
      .find()
      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);
    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v2", async (req, res) => {
  try {
    let workList = await workData.model
      .find()
      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);
    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let work = await workData.model
      .findById(id)
      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone");

    res.status(200).send(work);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let workToCreate = new workData.model(req.body);

    let equipment = await eqData.model.findById(workToCreate?.equipment?._id);
    equipment.eqStatus = "dispatched";
    equipment.assignedDate = req.body?.dispatch?.date;
    equipment.assignedShift = req.body?.dispatch?.shift;
    let rate = equipment.rate;
    let uom = equipment.uom;
    let revenue = 0;

    await equipment.save();

    workToCreate.equipment = equipment;
    if (uom === "hour") revenue = rate * 5;
    if (uom === "day") revenue = rate;

    workToCreate.totalRevenue = revenue;

    let workCreated = await workToCreate.save();
    res.status(201).send(workCreated);
  } catch (err) {
    console.log(err);
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

router.post("/getAnalytics", async (req, res) => {
  let { startDate, endDate, status, customer, project, equipment, owner } =
    req.body;
  let total = 0;
  let totalRevenue = 0;
  let totalDays = 0;
  try {
    let workList = await workData.model
      .find({
        status:
          status === "approved"
            ? { $in: ["approved", "stopped"] }
            : { $in: ["created", "in progress", "stopped"] },
      })
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      // .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone")
      .and([{ createdOn: { $gte: startDate, $lte: endDate } }]);

    if (workList && workList.length > 0) {
      total = 0;

      let list = [];

      if (customer) {
        list = workList.filter((w) => {
          let nameLowerCase = w?.project?.customer?.toLowerCase();
          return nameLowerCase.includes(customer?.toLowerCase());
        });
      } else {
        list = workList;
      }

      if (project) {
        list = list.filter((w) => {
          let descLowerCase = w?.project?.prjDescription?.toLowerCase();
          return descLowerCase.includes(project.toLowerCase());
        });
      }

      if (equipment) {
        list = list.filter((w) => {
          let plateLowerCase = w?.equipment?.plateNumber?.toLowerCase();
          return plateLowerCase.includes(equipment.toLowerCase());
        });
      }

      if (owner) {
        list = list.filter((w) => {
          let ownerLowercase = w?.equipment?.eqOwner?.toLowerCase();
          if (owner.toLowerCase() === "construck")
            return ownerLowercase === "construck";
          else if (owner.toLowerCase() === "hired")
            return ownerLowercase !== "construck";
          else return true;
        });
      }

      list.map((w) => {
        totalRevenue = totalRevenue + w.totalRevenue;
      });
    }

    let workListByDay = await workData.model
      .find({ uom: "day" })
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone")
      .and([{ createdOn: { $gte: startDate, $lte: endDate } }]);
    let listDays = [];
    if (customer) {
      listDays = workListByDay.filter((w) => {
        let nameLowerCase = w?.project?.customer?.toLowerCase();
        return nameLowerCase.includes(customer?.toLowerCase());
      });
    } else {
      listDays = workListByDay;
    }

    if (project) {
      listDays = listDays.filter((w) => {
        let descLowerCase = w?.project?.prjDescription?.toLowerCase();
        return descLowerCase.includes(project.toLowerCase());
      });
    }

    if (equipment) {
      listDays = listDays.filter((w) => {
        let plateLowerCase = w?.equipment?.plateNumber?.toLowerCase();
        return plateLowerCase.includes(equipment.toLowerCase());
      });
    }

    if (owner) {
      listDays = listDays.filter((w) => {
        let ownerLowercase = w?.equipment?.eqOwner?.toLowerCase();
        if (owner.toLowerCase() === "construck")
          return ownerLowercase === "construck";
        else if (owner.toLowerCase() === "hired")
          return ownerLowercase !== "construck";
        else return true;
      });
    }

    listDays.map((w) => {
      totalDays = totalDays + w.duration;
    });

    let dispatches = await workData.model.find({
      createdOn: { $gte: startDate, $lte: endDate },
    });
    // .populate({
    //   path: "project",
    //   populate: {
    //     path: "customer",
    //     model: "customers",
    //   },
    // });

    let listDispaches = [];
    if (customer) {
      listDispaches = dispatches.filter((w) => {
        let nameLowerCase = w?.project?.customer?.toLowerCase();
        return nameLowerCase.includes(customer?.toLowerCase());
      });
    } else {
      listDispaches = dispatches;
    }

    res.status(200).send({
      totalRevenue,
      totalDays: _.round(totalDays, 1),
    });
  } catch (err) {
    console.log(err);
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

router.put("/approve/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy");

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "available", assignedDate: null, assignedShift: "" },
      }
    );

    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "available";
    equipment.assignedDate = null;
    equipment.assignedShift = "";

    work.status = "approved";

    let savedRecord = await work.save();
    await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/recall/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let work = await workData.model.findById(id);

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "available", assignedDate: null, assignedShift: "" },
      }
    );

    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "available";
    equipment.assignedDate = null;
    equipment.assignedShift = "";

    work.status = "recalled";
    work.equipment = equipment;

    let savedRecord = await work.save();

    await equipment.save();

    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/reject/:id", async (req, res) => {
  let { id } = req.params;
  let { reasonForRejection } = req.body;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone");

    work.status = "rejected";
    work.reasonForRejection = reasonForRejection;

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "available", assignedDate: null, assignedShift: "" },
      }
    );
    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "available";
    equipment.assignedDate = null;
    equipment.assignedShift = "";

    let savedRecord = await work.save();
    await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/start/:id", async (req, res) => {
  let { id } = req.params;
  let { startIndex } = req.body;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone");

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: {
          eqStatus: "in progress",
          assignedDate: Date.now(),
        },
      }
    );

    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "assigned to job";

    work.status = "in progress";
    work.startTime = Date.now();
    work.startIndex = startIndex;
    work.equipment = equipment;

    let savedRecord = await work.save();
    await equipment.save();

    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/stop/:id", async (req, res) => {
  let { id } = req.params;
  let { duration, endIndex, tripsDone, comment } = req.body;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "available", assignedDate: null, assignedShift: "" },
      }
    );
    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "available";
    equipment.assignedDate = null;
    equipment.assignedShift = "";

    work.status = "stopped";
    work.endTime = Date.now();
    let _duration = work.endTime - work.startTime;

    let startIndex = work.startIndex ? work.startIndex : 19999;
    work.endIndex = endIndex ? endIndex : startIndex;
    work.startIndex = startIndex;
    work.tripsDone = tripsDone;
    let uom = work?.equipment?.uom;

    let rate = work?.equipment?.rate;
    let tartgetTrips = work?.dispatch?.targetTrips;

    let revenue = 0;

    // if rate is per hour and we have target trips to be done
    if (uom === "hour") {
      if (comment !== "Client Related") {
        work.duration = duration ? duration * 3600000 : _duration;
        revenue = (rate * work.duration) / 3600000;
      } else {
        work.duration = duration ? duration * 3600000 : _duration;
        revenue = (rate * work.duration) / 3600000;
      }
    }

    //if rate is per day
    if (uom === "day") {
      // work.duration = duration;
      // revenue = rate * duration;
      if (comment === "Client Related") {
        work.duration = duration / 24;
        revenue = rate;
      } else {
        work.duration = duration / 24;
        revenue = (tripsDone / tartgetTrips) * rate;
      }
    }

    work.rate = rate;
    work.uom = uom;
    work.totalRevenue = revenue ? revenue : 0;
    work.comment = comment;
    work.equipment = equipment;

    let savedRecord = await work.save();
    await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
