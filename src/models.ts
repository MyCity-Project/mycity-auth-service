import { Document, model, Schema, Types } from 'mongoose';
import {TimeUtils} from './utils/timeUtils';


const parkings = {
    "P5": {id:1, capacity: 650},
    "P10": {id:2, capacity: 1025},
    "P10TOP": {id:3, capacity: 205},
}
export const categories = {
    "restaurant": 1,
    "parking": 2,
    "cache": 3,
}
// ----- DayRecord ------
// record of counting per location
const DayRecordSchema = new Schema({
    category_id: Number,
    location_id: Number,
    day: {type: Date, default: Date.now },
    samples : [{count: Number, date: {type: Date, default: Date.now }, _id: false}]
}, { collection: 'mycampus2'});


export class DayRecord{
    public _id: Types.ObjectId;
    public category_id: Number;
    public location_id: Number;
    public day: Date;
    public samples: Array<{count: Number, date: Date}>;
    constructor(){
        this.location_id =  0;
        this.category_id =  0;
        this.day = TimeUtils.getCurrentDate();
        this.samples =  [];
    }

    // return array of count average per hour (every index is an hour of the day 0-23)
    public calculateAvg(){
        const hours = [];
        // calculate avg sample value of every hour
        for(let hourIndx = 0; hourIndx < 24; hourIndx++){
            let hourAvg = 0;
            let hourAvgCount = 0;
            for(const sample of this.samples){
                if(sample.date.getHours() == hourIndx){
                    hourAvg += sample.count.valueOf();
                    hourAvgCount++;
                }
            }
            hourAvg = hourAvg / hourAvgCount
            hours[hourIndx] = hourAvg || 0;
        }
        return hours;
    }
    public static newParkingRecord(location){
        const rec = new DayRecord();
        rec.category_id = categories.parking;
        rec.location_id = location;
        return rec;
    }
    /** Needed to de-serialize */
    public static fromObject(obj){
        const rec = new DayRecord();
        if(obj != undefined){
            rec.category_id = obj.category_id;
            rec.location_id = obj.location_id;
            rec.day = obj.day;
            rec.samples = obj.samples; 
        }     
        return rec;
    }
}
export interface IDayRecordDocument extends DayRecord, Document {
    _id: Types.ObjectId;
}

export const DayRecords = model<IDayRecordDocument>('DayRecord', DayRecordSchema);



// export async function getAverageOfLast(ntimes: number, weekday: number, category_id: number, location_id: number){
//     let query: Object;
//     const date = new Date(); // starting today
//     const records = [];
//     let weekoffset = weekday - date.getDay();
//     if(weekoffset > 0) weekoffset -= 7;
//     date.setDate( date.getDate() + weekoffset); // last weekday matching the requested one
//     // get that weekday n times 
//     for(let i = 0; i < ntimes; i++){
//         query = {category_id, location_id, day: Types.ISODate(date)};
//         const record : DayRecord = await DayRecords.findOne(query);
//         if(record){ // some records might be missed
//             console.log(record);
//             records.push(record);
//         }
//         date.setDate( date.getDate() - 7); // move to previous week
//     }

//     const avgRecord = [];
//     // calculate the sum for all fetched days
//     for(let record of records){
//         const hours = record.calculateAvg();
//         for(let i = 0; i < hours.length; i++) avgRecord[i] += hours[i]
//     }
//     // calculate the division for the average
//     for(let i = 0; i < avgRecord.length; i++){
//         avgRecord[i] /= avgRecord.length;
//     }
//     // average of weekday ready
//     return avgRecord


    
// }


// ---- Db cache -----
const CacheSchema = new Schema({
    category_id: {type: Number, default: categories.cache},
    //location_id: {type: Number, default: 0},
    parkingDevices: {type: Object, default: {}},
    parkingTodayRecord: {type: Object, default: {}},
}, { collection: 'mycampus2'});

export class DbCache {
    public _id: Types.ObjectId;
    public category_id: Number;
   // public location_id: Number;
    parkingDevices: Object;
    parkingTodayRecord: Object;
    constructor(){
        this.category_id = categories.cache;
       // this.location_id = obj.location_id || 0;
        this.parkingDevices = {};
        this.parkingTodayRecord = {};
    }
}

export interface ICacheDocument extends DbCache, Document {
    _id: Types.ObjectId;
}

export const CacheModel = model<ICacheDocument>('DbCache', CacheSchema);