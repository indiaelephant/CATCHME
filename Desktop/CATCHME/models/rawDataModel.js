const mongoose = require('mongoose');

const rawDataSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        sensor:{
            type:[Number],
            required:true
        }
    },
    {
        timestamps:true
    }
);
//스키마->모델
//mongoose.model(모델명, 스키마명)

const RawData = mongoose.model("RawData",rawDataSchema);
module.exports = RawData;