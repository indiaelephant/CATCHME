const asyncHandler = require("express-async-handler"); //try catch (err)
const Result = require("../models/resultModel");

// @desc Get all results by name
// @route GET /results/all/:name
// 전체 결과 보기
const getAllResults = asyncHandler(async (req, res) => {
    
    const name = req.params.name;
    console.log(req.params.name);

    // name이 일치하는 모든 문서 검색
    const results = await Result.find({ name });
    res.status(200).json(results);
});

// @desc Get a result by name
// @route GET /results/:name
// 최근 결과 하나 보기
const getResult = asyncHandler(async (req, res) => {
    const result = await Result.findOne({ name: req.params.name });

    res.status(200).send(result);
});

module.exports = {
    getAllResults,
    getResult
};