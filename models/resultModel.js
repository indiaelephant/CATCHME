const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        sensor:{
            type:String,
            required:true
        }
    },
    {
        timestamps:true
    }
);
//스키마->모델
//mongoose.model(모델명, 스키마명)

const Result = mongoose.model("Result",resultSchema);
module.exports = Result;