const router = require("express").Router();
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const workData = require("../models/workData");
const employeeData = require("../models/employees");
const assetAvblty = require("../models/assetAvailability");
const logData = require("../models/logs");
const eqData = require("../models/equipments");
const moment = require("moment");
const e = require("express");
const { isNull } = require("lodash");
const MS_IN_A_DAY = 86400000;
const HOURS_IN_A_DAY = 8;
const ObjectId = require("mongoose").Types.ObjectId;

function isValidObjectId(id) {
  if (ObjectId.isValid(id)) {
    if (String(new ObjectId(id)) === id) return true;
    return false;
  }
  return false;
}

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
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);
    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
    res.status(200).send(
      workList.filter((w) => {
        w.workDone !== null;
      })
    );
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
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);
    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v3", async (req, res) => {
  try {
    let workList = await workData.model
      .find(
        {},
        {
          "project.createdOn": false,
          "equipment.__v": false,
          "equipment.createdOn": false,
          "dispatch.project": false,
          "dispatch.equipments": false,
          "driver.password": false,
          "driver.email": false,
          "driver.createdOn": false,
          "driver.__v": false,
          "driver._id": false,
        }
      )

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
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);

    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v3/:vendorName", async (req, res) => {
  let { vendorName } = req.params;
  try {
    let workList = await workData.model
      .find(
        {},
        {
          "project.createdOn": false,
          "equipment.__v": false,
          "equipment.createdOn": false,
          "dispatch.project": false,
          "dispatch.equipments": false,
          "driver.password": false,
          "driver.email": false,
          "driver.createdOn": false,
          "driver.__v": false,
          "driver._id": false,
        }
      )

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
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);

    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));

    let filteredByVendor = workList.filter((w) => {
      return (
        // w.equipment.eqOwner === vendorName ||
        _.trim(w.driver.firstName) === _.trim(vendorName)
      );
    });
    res.status(200).send(filteredByVendor);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v3/driver/:driverId", async (req, res) => {
  let { driverId } = req.params;
  // console.log(isValidObjectId(driverId));
  try {
    let workList = await workData.model
      .find(
        {
          $or: [
            {
              "equipment.eqOwner": driverId,
            },
            {
              driver: isValidObjectId(driverId) ? driverId : "123456789011",
            },
          ],
        },
        {
          "project.createdOn": false,
          "equipment.__v": false,
          "equipment.createdOn": false,
          "dispatch.project": false,
          "dispatch.equipments": false,
          "driver.password": false,
          "driver.email": false,
          "driver.createdOn": false,
          "driver.__v": false,
          "driver._id": false,
        }
      )
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);

    let listToSend = workList
      .filter(
        (w) =>
          w.siteWork === false ||
          (w.siteWork === true &&
            (w.status === "in progress" || w.status === "on going")) ||
          (w.siteWork === true &&
            _.filter(w.dailyWork, (dW) => {
              return dW.date === moment().format("DD-MMM-YYYY");
            }).length === 0)
      )
      .filter(
        (w) =>
          !isNull(w.driver) && !isNull(w.workDone) && w.status !== "recalled"
      );

    let siteWorkList = [];

    let l = listToSend.map((w) => {
      let work = null;

      if (w.siteWork && w.status !== "stopped" && w.status !== "recalled") {
        let dailyWorks = w.dailyWork;

        let datesPosted = dailyWorks
          .filter((d) => d.pending === false)
          .map((d) => {
            return d.date;
          });

        let datesPendingPosted = dailyWorks
          .filter((d) => d.pending === true)

          .map((d) => {
            return d.date;
          });
        let workStartDate = moment(w.workStartDate);
        let workDurationDays = w.workDurationDays;

        let datesToPost = [workStartDate.format("DD-MMM-YYYY")];
        for (let i = 0; i < workDurationDays - 1; i++) {
          datesToPost.push(workStartDate.add(1, "days").format("DD-MMM-YYYY"));
        }

        let dateNotPosted = datesToPost.filter(
          (d) =>
            !_.includes(datesPosted, d) &&
            !_.includes(datesPendingPosted, d) &&
            moment().diff(moment(d, "DD-MMM-YYYY")) >= 0
        );

        datesPosted.map((dP) => {
          siteWorkList.push({
            workDone: w.workDone
              ? w.workDone
              : {
                  _id: "62690b67cf45ad62aa6144d8",
                  jobDescription: "Others",
                  eqType: "Truck",
                  createdOn: "2022-04-27T09:20:50.911Z",
                  __v: 0,
                },
            _id: w._id,
            status: "stopped",
            project: w.project,
            createdOn: w.createdOn,
            equipment: w.equipment,
            siteWork: w.siteWork,
            targetTrips: w.dispatch.targetTrips
              ? w.dispatch.targetTrips
              : "N/A",
            workStartDate: w.workStartDate,
            dispatchDate: new Date(dP).toISOString(),
            shift: w.dispatch.shift === "nightShift" ? "N" : "D",
            startIndex: w.startIndex ? w.startIndex : 0,
            millage: w.equipment.millage ? w.equipment.millage : 0,
          });
        });

        dateNotPosted.map((dNP) => {
          siteWorkList.push({
            workDone: w.workDone
              ? w.workDone
              : {
                  _id: "62690b67cf45ad62aa6144d8",
                  jobDescription: "Others",
                  eqType: "Truck",
                  createdOn: "2022-04-27T09:20:50.911Z",
                  __v: 0,
                },
            _id: w._id,
            status: "created",
            project: w.project,
            createdOn: w.createdOn,
            equipment: w.equipment,
            siteWork: w.siteWork,
            targetTrips: w.dispatch.targetTrips
              ? w.dispatch.targetTrips
              : "N/A",
            workStartDate: w.workStartDate,
            dispatchDate: new Date(dNP).toISOString(),
            shift: w.dispatch.shift === "nightShift" ? "N" : "D",
            startIndex: w.startIndex ? w.startIndex : 0,
            millage: w.equipment.millage ? w.equipment.millage : 0,
          });
        });

        datesPendingPosted.map((dPP) => {
          siteWorkList.push({
            workDone: w.workDone
              ? w.workDone
              : {
                  _id: "62690b67cf45ad62aa6144d8",
                  jobDescription: "Others",
                  eqType: "Truck",
                  createdOn: "2022-04-27T09:20:50.911Z",
                  __v: 0,
                },
            _id: w._id,
            status: "in progress",
            project: w.project,
            createdOn: w.createdOn,
            equipment: w.equipment,
            siteWork: w.siteWork,
            targetTrips: w.dispatch.targetTrips
              ? w.dispatch.targetTrips
              : "N/A",
            workStartDate: w.workStartDate,
            dispatchDate: new Date(dPP).toISOString(),
            shift: w.dispatch.shift === "nightShift" ? "N" : "D",
            startIndex: w.startIndex ? w.startIndex : 0,
            millage: w.equipment.millage ? w.equipment.millage : 0,
          });
        });
      } else {
        work = {
          workDone: w.workDone
            ? w.workDone
            : {
                _id: "62690b67cf45ad62aa6144d8",
                jobDescription: "Others",
                eqType: "Truck",
                createdOn: "2022-04-27T09:20:50.911Z",
                __v: 0,
              },
          _id: w._id,
          status: w.status,
          project: w.project,
          createdOn: w.createdOn,
          equipment: w.equipment,
          siteWork: w.siteWork,
          targetTrips: w.dispatch.targetTrips ? w.dispatch.targetTrips : "N/A",
          workStartDate: w.workStartDate,
          dispatchDate: w.siteWork ? moment().toISOString() : w.dispatch.date,
          shift: w.dispatch.shift === "nightShift" ? "N" : "D",
          startIndex: w.startIndex ? w.startIndex : 0,
          millage: w.equipment.millage ? w.equipment.millage : 0,
        };
      }

      return work;
    });

    let finalList = l.concat(siteWorkList);

    let orderedList = _.orderBy(finalList, "dispatchDate", "desc");

    res.status(200).send(orderedList.filter((d) => !isNull(d)));
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
      .populate("createdBy")
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
    equipment.assignedToSiteWork = req.body?.siteWork;
    equipment.assignedDate = req.body?.dispatch?.date;
    equipment.assignedShift = req.body?.dispatch?.shift;
    let driver = req.body?.driver === "NA" ? null : req.body?.driver;

    let employee = await employeeData.model.findById(driver);
    if (employee) {
      employee.status = "dispatched";
      employee.assignedToSiteWork = req.body?.siteWork;
      employee.assignedDate = req.body?.dispatch?.date;
      employee.assignedShift = req.body?.dispatch?.shift;
    }

    let rate = parseInt(equipment.rate);
    let uom = equipment.uom;
    let revenue = 0;
    let siteWork = req.body?.siteWork;
    let workDurationDays = req.body?.workDurationDays;

    await equipment.save();
    if (employee) await employee.save();

    workToCreate.equipment = equipment;
    if (uom === "hour") revenue = rate * 5;
    if (uom === "day") revenue = rate;

    // workToCreate.totalRevenue = revenue;
    workToCreate.projectedRevenue = siteWork
      ? revenue * workDurationDays
      : revenue;

    workToCreate.driver = driver;
    let workCreated = await workToCreate.save();

    //log saving
    let log = {
      action: "DISPATCH CREATED",
      doneBy: req.body.createdBy,
      payload: workToCreate,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    let today = moment().format("DD-MMM-YYYY");
    let dateData = await assetAvblty.model.findOne({ date: today });
    let dispatched = await eqData.model.find({
      eqStatus: "dispatched",
      eqOwner: "Construck",
    });

    let standby = await eqData.model.find({
      eqStatus: "standby",
      eqOwner: "Construck",
    });

    if (dateData) {
      dateData.dispatched = dispatched.length;
      dateData.standby = standby.length;

      await dateData.save();
    } else {
      let dateDataToSave = new assetAvblty.model({
        date: today,
        dispatched: dispatched.length,
        standby: standby.length,
      });

      await dateDataToSave.save();
    }

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

router.post("/mobileData", async (req, res) => {
  try {
    let bodyData = {
      project: JSON.parse(req.body.project),
      equipment: JSON.parse(req.body.equipment),
      workDone: req.body.workDone,
      startIndex: req.body.startIndex,
      endIndex: req.body.endIndex,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      rate: req.body.rate,
      driver: req.body.driver,
      status: req.body.status,
      duration: req.body.duration,
      comment: req.body.comment,
      siteWork: req.body.siteWork === "yes" ? true : false,
    };
    let workToCreate = new workData.model(bodyData);

    let equipment = await eqData.model.findById(workToCreate?.equipment?._id);
    if (equipment.eqStatus === "standby") {
      // Save data only when equipment is available
      equipment.eqStatus = "dispatched";
      equipment.assignedToSiteWork = true;
      equipment.assignedDate = req.body?.dispatch?.date;
      equipment.assignedShift = req.body?.dispatch?.shift;

      let driver = req.body?.driver === "NA" ? null : req.body?.driver;

      let employee = await employeeData.model.findById(driver);
      if (employee) employee.status = "dispatched";

      let rate = parseInt(equipment.rate);
      let uom = equipment.uom;
      let revenue = 0;
      let siteWork = bodyData?.siteWork;
      let workDurationDays =
        moment(bodyData.endTime).diff(moment(bodyData.startTime)) / MS_IN_A_DAY;

      await equipment.save();
      if (employee) await employee.save();

      workToCreate.equipment = equipment;
      workToCreate.workDurationDays = workDurationDays;
      if (uom === "hour") revenue = rate * 5;
      if (uom === "day") revenue = rate;

      // workToCreate.totalRevenue = revenue;
      workToCreate.projectedRevenue = siteWork
        ? revenue * workDurationDays
        : revenue;

      workToCreate.driver = driver;
      let workCreated = await workToCreate.save();

      //log saving
      let log = {
        action: "DISPATCH CREATED",
        doneBy: req.body.createdBy,
        payload: req.body,
      };
      console.log(log);
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      res.status(201).send(workCreated);
    } else {
      res.status(201).send(bodyData);
    }
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
  let projectedRevenue = 0;
  let totalDays = 0;
  let daysDiff = _.round(
    moment(endDate).diff(moment(startDate)) / MS_IN_A_DAY,
    0
  );
  try {
    let workList = await workData.model
      .find({
        // status:
        //   status === "final"
        //     ? { $in: ["approved", "stopped"] }
        //     : {
        //         $in: [
        //           "created",
        //           "in progress",
        //           "rejected",
        //           "stopped",
        //           "on going",
        //         ],
        //       },
      })
      .or([
        { siteWork: true },
        {
          siteWork: false,
          "dispatch.date": { $gte: startDate, $lte: endDate },
        },
      ]);

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
        //PStart and PEnd are before range stare
        let case1 =
          moment(w.workStartDate).diff(moment(startDate)) < 0 &&
          moment(w.workEndDate).diff(moment(endDate)) < 0;

        //PStart before Start and PEnd after Start and PEnd before End
        let case2 =
          moment(w.workStartDate).diff(moment(startDate)) < 0 &&
          moment(w.workEndDate).diff(moment(startDate)) > 0 &&
          moment(w.workEndDate).diff(moment(endDate)) < 0;

        //PStart before to Start and PEnd After end
        // OR
        //PStart equal to Start and PEnd equal End
        //OR
        //PStart equal to Start and PEnd after End
        let case3 =
          moment(w.workStartDate).diff(moment(startDate)) <= 0 &&
          moment(w.workEndDate).diff(moment(endDate)) >= 0;

        //PStart after Start and PEnd before Start
        let case4 =
          moment(w.workStartDate).diff(moment(startDate)) > 0 &&
          moment(w.workEndDate).diff(moment(endDate)) < 0;

        //PStart after Start and PEnd after End
        let case5 =
          moment(w.workStartDate).diff(moment(startDate)) > 0 &&
          moment(w.workEndDate).diff(moment(endDate)) > 0 &&
          moment(endDate).diff(moment(w.workStartDate)) > 0;

        if (case1) daysDiff = 0;
        else if (case2)
          daysDiff = _.round(
            moment(w.workEndDate).diff(moment(startDate), "days"),
            0
          );
        else if (case3)
          daysDiff = _.round(
            moment(endDate).diff(moment(startDate), "days"),
            0
          );
        else if (case4)
          daysDiff = _.round(
            moment(w.workEndDate).diff(moment(w.workStartDate), "days"),
            0
          );
        else if (case5)
          daysDiff = _.round(
            moment(endDate).diff(moment(w.workStartDate), "days"),
            0
          );
        else
          daysDiff = _.round(
            moment(endDate).diff(moment(startDate), "days"),
            0
          );

        if (daysDiff < 0) daysDiff = 0;

        totalRevenue = totalRevenue + w.totalRevenue;
        projectedRevenue =
          w.siteWork === true
            ? projectedRevenue +
              w?.equipment.rate *
                (w?.equipment.uom === "hour" ? 5 * daysDiff + 1 : daysDiff + 1)
            : projectedRevenue + w?.projectedRevenue;

        if (isNaN(projectedRevenue)) projectedRevenue = 0;
      });
    }

    let workListByDay = await workData.model
      .find({ uom: "day" })
      .and([{ "dispatch.date": { $gte: startDate, $lte: endDate } }]);

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
      totalRevenue: _.round(totalRevenue, 0),
      projectedRevenue,
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
        $set: { eqStatus: "standby", assignedDate: null, assignedShift: "" },
      }
    );

    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "standby";
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

    let employee = await employeeData.model.findById(work?.driver);
    if (employee) {
      employee.status = "active";
      employee.assignedToSiteWork = false;
      employee.assignedDate = null;
      employee.assignedShift = "";
    }

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "standby", assignedDate: null, assignedShift: "" },
      }
    );

    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "standby";
    equipment.assignedDate = null;
    equipment.assignedShift = "";
    equipment.assignedToSiteWork = false;

    work.status = "recalled";
    work.equipment = equipment;
    work.projectedRevenue = 0;
    work.totalRevenue = 0;

    let savedRecord = await work.save();

    await equipment.save();
    if (employee) await employee.save();

    //log saving
    let log = {
      action: "DISPATCH RECALLED",
      doneBy: req.body.recalledBy,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    let today = moment().format("DD-MMM-YYYY");
    const dateData = await assetAvblty.model.findOne({ date: today });
    let availableAssets = await eqData.model.find({
      eqStatus: { $ne: "workshop" },
      eqOwner: "Construck",
    });
    let unavailableAssets = await eqData.model.find({
      eqStatus: "workshop",
      eqOwner: "Construck",
    });
    let dispatched = await eqData.model.find({
      eqStatus: "dispatched",
      eqOwner: "Construck",
    });

    let standby = await eqData.model.find({
      eqStatus: "standby",
      eqOwner: "Construck",
    });

    if (dateData) {
      let currentAvailable = dateData.available;
      let currentUnavailable = dateData.unavailable;
      dateData.available = currentAvailable;
      dateData.unavailable = currentUnavailable;
      dateData.dispatched = dispatched.length;
      dateData.standby = standby.length;

      await dateData.save();
    } else {
      let dateDataToSave = new assetAvblty.model({
        date: today,
        available: availableAssets.length,
        unavailable: unavailableAssets.length,
        dispatched: dispatched.length,
        standby: standby.length,
      });
      await dateDataToSave.save();
    }

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
    work.totalRevenue = 0;
    // work.projectedRevenue = 0;

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "standby", assignedDate: null, assignedShift: "" },
      }
    );
    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "standby";
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
  let { startIndex, postingDate } = req.body;

  let dd = postingDate.split(".")[0];
  let mm = postingDate.split(".")[1];
  let yyyy = postingDate.split(".")[2];

  if (dd?.length < 2) dd = "0" + dd;
  if (mm?.length < 2) mm = "0" + mm;

  if (dd && mm && yyyy) postingDate = `${yyyy}-${mm}-${dd}`;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone");

    if (
      work.status === "created" ||
      work.status === "on going" ||
      work.status === "in progress"
    ) {
      let eqId = work?.equipment?._id;

      await workData.model.updateMany(
        { "equipment._id": eqId },
        {
          $set: {
            eqStatus: "in progress",
            assignedDate: Date.now(),
            millage: startIndex,
          },
        }
      );

      let equipment = await eqData.model.findById(work?.equipment?._id);
      equipment.assignedToSiteWork = true;
      equipment.millage = startIndex;

      let employee = await employeeData.model.findById(work?.driver);
      if (employee) {
        employee.status = "busy";
      }

      if (work.siteWork) {
        let dailyWork = {
          day: moment(postingDate).isValid()
            ? moment(postingDate).diff(moment(work.workStartDate), "days")
            : moment(postingDate, "DD.MM.YYYY").diff(
                moment(work.workStartDate),
                "days"
              ),
          startTime: postingDate,
          date: moment(postingDate).isValid()
            ? moment(postingDate).format("DD-MMM-YYYY")
            : moment(postingDate, "DD.MM.YYYY").format("DD-MMM-YYYY"),
          startIndex,
          pending: true,
        };

        console.log(dailyWork);
        work.dailyWork.push(dailyWork);
        work.status = "in progress";
        work.startIndex = startIndex;
        work.equipment = equipment;
        let savedRecord = await work.save();
        if (employee) await employee.save();

        //log saving
        let log = {
          action: "DISPATCH STARTED",
          doneBy: req.body.startedBy,
          payload: work,
        };
        let logTobeSaved = new logData.model(log);
        await logTobeSaved.save();

        res.status(201).send(savedRecord);
      } else {
        work.status = "in progress";
        work.startTime = Date.now();
        work.startIndex = startIndex;
        work.equipment = equipment;
        let savedRecord = await work.save();

        if (employee) await employee.save();
        await equipment.save();

        //log saving
        let log = {
          action: "DISPATCH STARTED",
          doneBy: req.body.startedBy,
          payload: work,
        };
        let logTobeSaved = new logData.model(log);
        await logTobeSaved.save();

        res.status(201).send(savedRecord);
      }
    } else {
      res.status(200).send(work);
    }
  } catch (err) {
    console.log(err);
  }
});

router.put("/stop/:id", async (req, res) => {
  let { id } = req.params;
  let { endIndex, tripsDone, comment, moreComment, postingDate, stoppedBy } =
    req.body;
  let duration = Math.abs(req.body.duration);

  let dd = postingDate.split(".")[0];
  let mm = postingDate.split(".")[1];
  let yyyy = postingDate.split(".")[2];
  if (dd?.length < 2) dd = "0" + dd;
  if (mm?.length < 2) mm = "0" + mm;
  if (dd && mm && yyyy) postingDate = `${yyyy}-${mm}-${dd}`;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    if (work.status === "in progress") {
      let equipment = await eqData.model.findById(work?.equipment?._id);
      let workEnded = equipment.eqStatus === "standby" ? true : false;
      if (work?.dailyWork?.length >= work.workDurationDays) {
        equipment.eqStatus = "standby";
        equipment.assignedToSiteWork = false;
      }
      let employee = await employeeData.model.findById(work?.driver);
      if (employee) {
        employee.status = "active";
        employee.assignedToSiteWork = false;
        employee.assignedDate = null;
        employee.assignedShift = "";
      }

      if (work.siteWork) {
        let dailyWork = {};
        let currentTotalRevenue = work.totalRevenue;
        let currentDuration = Math.abs(work.duration);
        let currentTotalExpenditure = work.totalExpenditure;

        work.status =
          workEnded || work?.dailyWork?.length >= work.workDurationDays
            ? "stopped"
            : "on going";

        let _duration = Math.abs(work.endTime - work.startTime);

        let startIndex = work.startIndex ? work.startIndex : 0;
        dailyWork.endIndex = endIndex
          ? parseInt(endIndex)
          : parseInt(startIndex);
        dailyWork.startIndex = parseInt(startIndex);

        equipment.millage =
          endIndex || startIndex !== 0
            ? parseInt(endIndex)
            : parseInt(startIndex);

        let uom = equipment?.uom;
        let rate = equipment?.rate;
        let supplierRate = equipment?.supplierRate;
        let revenue = 0;
        let expenditure = 0;

        // if rate is per hour and we have target trips to be done
        if (uom === "hour") {
          if (comment !== "Ibibazo bya panne") {
            dailyWork.duration = duration ? duration * 3600000 : _duration;

            revenue = (rate * dailyWork.duration) / 3600000;
            expenditure = (supplierRate * dailyWork.duration) / 3600000;
          } else {
            dailyWork.duration = duration ? duration * 3600000 : _duration;
            revenue = (rate * dailyWork.duration) / 3600000;
            expenditure = (supplierRate * dailyWork.duration) / 3600000;
          }
        }

        //if rate is per day
        if (uom === "day") {
          // work.duration = duration;
          // revenue = rate * duration;
          if (comment !== "Ibibazo bya panne") {
            dailyWork.duration = duration / HOURS_IN_A_DAY;
            revenue = rate * (duration >= 1 ? 1 : 0);
            expenditure = supplierRate * (duration >= 1 ? 1 : 0);
          } else {
            dailyWork.duration = duration / HOURS_IN_A_DAY;

            let targetDuration = 5;
            let durationRation =
              duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
            dailyWork.duration = duration / HOURS_IN_A_DAY;
            revenue = rate * (duration >= 1 ? 1 : 0);
            expenditure = supplierRate;
          }
        }

        dailyWork.rate = rate;
        dailyWork.uom = uom;
        dailyWork.date = moment(postingDate).isValid()
          ? moment(postingDate).format("DD-MMM-YYYY")
          : moment(postingDate, "DD.MM.YYYY").format("DD-MMM-YYYY");
        dailyWork.totalRevenue = revenue ? revenue : 0;
        dailyWork.totalExpenditure = expenditure ? expenditure : 0;
        dailyWork.comment = comment;
        dailyWork.moreComment = moreComment;
        dailyWork.pending = false;

        let dailyWorks = [...work.dailyWork];

        let indexToUpdate = -1;
        let workToUpdate = dailyWorks.find((d, index) => {
          d.day == moment().diff(moment(work.workStartDate), "days");
          indexToUpdate = index;
        });

        dailyWorks[indexToUpdate] = dailyWork;

        work.startIndex =
          endIndex || startIndex !== 0
            ? parseInt(endIndex)
            : parseInt(startIndex);
        work.dailyWork = dailyWorks;
        work.duration = dailyWork.duration + currentDuration;
        work.totalRevenue = currentTotalRevenue + revenue;
        if (workEnded) work.projectedRevenue = currentTotalRevenue + revenue;
        work.totalExpenditure = currentTotalExpenditure + expenditure;
        work.equipment = equipment;
        work.moreComment = moreComment;

        await equipment.save();
        if (employee) await employee.save();
        let savedRecord = await work.save();

        //log saving
        let log = {
          action: "DISPATCH STOPPED",
          doneBy: stoppedBy,
          payload: work,
        };
        let logTobeSaved = new logData.model(log);
        await logTobeSaved.save();

        res.status(201).send(savedRecord);
      } else {
        let eqId = work?.equipment?._id;
        await workData.model.updateMany(
          { "equipment._id": eqId },
          {
            $set: {
              eqStatus: "standby",
              assignedDate: null,
              assignedShift: "",
            },
          }
        );
        let startIndex = work.startIndex ? work.startIndex : 0;
        let equipment = await eqData.model.findById(work?.equipment?._id);
        equipment.eqStatus = "standby";
        equipment.assignedDate = null;
        equipment.assignedShift = "";
        equipment.assignedToSiteWork = false;
        equipment.millage =
          endIndex || startIndex !== 0
            ? parseInt(endIndex)
            : parseInt(startIndex);

        work.status = "stopped";
        work.endTime = Date.now();
        let _duration = Math.abs(work.endTime - work.startTime);

        work.endIndex =
          endIndex || startIndex !== 0
            ? parseInt(endIndex)
            : parseInt(startIndex);
        work.startIndex = parseInt(startIndex);
        work.tripsDone = parseInt(tripsDone);
        let uom = equipment?.uom;

        let rate = equipment?.rate;
        let supplierRate = equipment?.supplierRate;
        let targetTrips = parseInt(work?.dispatch?.targetTrips); //TODO

        let tripsRatio = tripsDone / (targetTrips ? targetTrips : 1);
        let revenue = 0;
        let expenditure = 0;

        // if rate is per hour and we have target trips to be done
        if (uom === "hour") {
          if (comment !== "Ibibazo bya panne") {
            work.duration = duration ? duration * 3600000 : _duration;
            revenue = (rate * work.duration) / 3600000;
            expenditure = (supplierRate * work.duration) / 3600000;
          } else {
            work.duration = duration ? duration * 3600000 : _duration;
            revenue = (tripsRatio * (rate * work.duration)) / 3600000;
            expenditure =
              (tripsRatio * (supplierRate * work.duration)) / 3600000;
          }
        }

        //if rate is per day
        if (uom === "day") {
          // work.duration = duration;
          // revenue = rate * duration;
          if (comment !== "Ibibazo bya panne") {
            work.duration = duration / HOURS_IN_A_DAY;
            revenue = rate * (duration >= 1 ? 1 : 0);
            expenditure = supplierRate * (duration >= 1 ? 1 : 0);
          } else {
            work.duration = duration / HOURS_IN_A_DAY;
            let tripRatio = tripsDone / targetTrips;
            if (tripsDone && targetTrips) {
              if (tripRatio > 1) {
                revenue = rate;
                expenditure = supplierRate;
                // revenue = rate;
              } else {
                revenue = rate * tripRatio;
                expenditure = supplierRate * tripRatio;
              }
            }
            if (!targetTrips || targetTrips == "0") {
              {
                let targetDuration = 5;
                let durationRation =
                  duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
                work.duration = duration / HOURS_IN_A_DAY;
                revenue = rate;
                expenditure = supplierRate;
              }
            }
          }
        }

        work.rate = rate;
        work.uom = uom;
        work.totalRevenue = revenue ? revenue : 0;
        work.totalExpenditure = expenditure ? expenditure : 0;
        work.comment = comment;
        work.moreComment = moreComment;
        work.equipment = equipment;

        let savedRecord = await work.save();
        if (employee) await employee.save();
        await equipment.save();

        //log saving
        let log = {
          action: "DISPATCH STOPPED",
          doneBy: stoppedBy,
          payload: work,
        };
        let logTobeSaved = new logData.model(log);
        await logTobeSaved.save();

        let today = moment().format("DD-MMM-YYYY");
        const dateData = await assetAvblty.model.findOne({ date: today });
        let availableAssets = await eqData.model.find({
          eqStatus: { $ne: "workshop" },
          eqOwner: "Construck",
        });
        let unavailableAssets = await eqData.model.find({
          eqStatus: "workshop",
          eqOwner: "Construck",
        });
        let dispatched = await eqData.model.find({
          eqStatus: "dispatched",
          eqOwner: "Construck",
        });

        let standby = await eqData.model.find({
          eqStatus: "standby",
          eqOwner: "Construck",
        });

        if (dateData) {
          let currentAvailable = dateData.available;
          let currentUnavailable = dateData.unavailable;
          dateData.available = currentAvailable;
          dateData.unavailable = currentUnavailable;
          dateData.dispatched = dispatched.length;
          dateData.standby = standby.length;

          await dateData.save();
        } else {
          let dateDataToSave = new assetAvblty.model({
            date: today,
            available: availableAssets.length,
            unavailable: unavailableAssets.length,
            dispatched: dispatched.length,
            standby: standby.length,
          });
          await dateDataToSave.save();
        }

        res.status(201).send(savedRecord);
      }
    } else {
      res.status(200).send(work);
    }
  } catch (err) {
    console.log(err);
  }
});

router.put("/end/:id", async (req, res) => {
  let { id } = req.params;

  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    let equipment = await eqData.model.findById(work?.equipment?._id);

    let employee = await employeeData.model.findById(work?.driver);
    if (employee) {
      employee.status = "active";
      employee.assignedToSiteWork = false;
      employee.assignedDate = null;
      employee.assignedShift = "";
    }

    if (work.siteWork) {
      // work.status = "stopped";
      equipment.eqStatus = "standby";
      equipment.assignedDate = null;
      equipment.assignedShift = "";

      // work.projectedRevenue = work.totalRevenue;
      work.equipment = equipment;

      await equipment.save();
      if (employee) await employee.save();
      let savedRecord = await work.save();

      //log saving
      let log = {
        action: "SITE WORK ENDED",
        doneBy: req.body.stoppedBy,
        payload: work,
      };
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      let today = moment().format("DD-MMM-YYYY");
      const dateData = await assetAvblty.model.findOne({ date: today });
      let availableAssets = await eqData.model.find({
        eqStatus: { $ne: "workshop" },
        eqOwner: "Construck",
      });
      let unavailableAssets = await eqData.model.find({
        eqStatus: "workshop",
        eqOwner: "Construck",
      });
      let dispatched = await eqData.model.find({
        eqStatus: "dispatched",
        eqOwner: "Construck",
      });

      let standby = await eqData.model.find({
        eqStatus: "standby",
        eqOwner: "Construck",
      });

      if (dateData) {
        let currentAvailable = dateData.available;
        let currentUnavailable = dateData.unavailable;
        dateData.available = currentAvailable;
        dateData.unavailable = currentUnavailable;
        dateData.dispatched = dispatched.length;
        dateData.standby = standby.length;

        await dateData.save();
      } else {
        let dateDataToSave = new assetAvblty.model({
          date: today,
          available: availableAssets.length,
          unavailable: unavailableAssets.length,
          dispatched: dispatched.length,
          standby: standby.length,
        });
        await dateDataToSave.save();
      }
      res.status(201).send(savedRecord);
    }
  } catch (err) {
    console.log(err);
  }
});

router.put("/resetStartIndices", async (req, res) => {
  try {
    let updates = await workData.model.updateMany({
      $set: {
        startIndex: 0,
        endIndex: 0,
      },
    });

    res.send(updates);
  } catch (err) {}
});

router.put("/reverse/:id", async (req, res) => {
  // reset duration
  // reset totalRevenue
  // only those that are not site works
  // set status to "in progress"
  // create a log to mention that it is a reverse

  let { id } = req.params;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    work.duration = 0;
    work.totalRevenue = 0;
    work.tripsDone = 0;
    work.status = "in progress";

    //log saving
    let log = {
      action: "DISPATCH REVERSED",
      doneBy: req.body.reversedBy,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);

    await logTobeSaved.save();
    await work.save();

    res.send(work).status(201);
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
