const asyncHandler = require("express-async-handler"); //try catch (err)
const RawData = require("../models/rawDataModel");

// @desc Get all rawdatas
// @route GET /rawdatas
// 전체 데이터 보기
const getAllRawDatas = asyncHandler(async (req, res) => {
    const rawData = await RawData.find();
    res.status(200).send(rawData);
});

// @desc Create a rawdatas
// @route POST /rawdatas
// 새 데이터 추가하기
const createRawData = asyncHandler(async (req, res) => {
    console.log(req.body);
    const dataArray = req.body;

    // Validate each item in the array
    for (let item of dataArray) {
      const { id, name, sensors } = item;
      if (!name || !sensors) {
        return res.status(400).json({
          error: 'Invalid request',
          message: !name ? 'Name is required' : 'Sensors are required',
          received: item
        });
      }

      try{
        await RawData.create({ name, sensors });
      }catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
      }
    }

    res.status(201).send("Create RawData");
  }
);

module.exports = {
    getAllRawDatas,
    createRawData
};