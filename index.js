const express = require("express");
const app = express();
const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;
const url = "mongodb+srv://Chubb:chubb@cluster0.ow24l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const DB = "MentorStudent";

app.use(express.json());
app.listen(process.env.PORT || 3000);


students = [{sid:1,name:"Sharan",hasMentor:false},{sid:2,name:"Mahesh",hasMentor:true,tid:1},{sid:3,name:"Anand",hasMentor:true,tid:2},{sid:4,name:"Netam",hasMentor:false},{sid:5,name:"Ribhav",hasMentor:true,tid:1},{sid:6,name:"Shreyansh",hasMentor:false}];
mentors = [{tid:1,name:"Rakesh",studentids:[2,5]},{tid:2,name:"Venkatesh",studentids:[3]}];


app.get('/students',async(req,res)=>{
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        let result = await db.collection("students").find().toArray();
        await connection.close();
        res.status(200).json({result});
    } catch (error) {
        res.status(500).json(error);    
    }
})

app.get('/mentors',async (req,res)=>{
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        let result = await db.collection("mentors").find().toArray();
        await connection.close();
        res.status(200).json({result});
    } catch (error) {
        res.status(500).json(error);    
    }
})

app.post('/student',async (req,res)=>{
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        req.body.hasMentor = false;
        let inseredStudent = await db.collection("students").insertOne(req.body);
        await connection.close();
        res.status(200).json(inseredStudent);
    } catch (error) {
        res.status(500).json(error);    
    }
})

app.post('/mentor',async (req,res)=>{
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        let inseredMentor = await db.collection("mentors").insertOne(req.body);
        await connection.close();
        res.status(200).json(inseredMentor);
    } catch (error) {
        res.status(500).json(error);
    }
})

app.delete('/student/:id',async (req,res)=>{
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        id = req.params.id;
        mentor = await db.collection("students").findOneAndDelete({_id:mongo.ObjectID(id)});
        mid = mentor.value.mentorid;
        if(mid!=null){
        await db.collection("mentors").findOneAndUpdate({_id:mongo.ObjectID(mid)},{$pull:{studentids:id}});
        }
        await connection.close();
        res.status(200).json({
            message: "Deleted"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
})


app.delete('/mentor/:id',async (req,res)=>{
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        id = req.params.id;
        student = await db.collection("mentors").findOneAndDelete({_id:mongo.ObjectID(id)});
        sids = student.value.studentids;
        console.log(sids);
        sids.forEach(sid => {
            db.collection("students").findOneAndUpdate({_id:mongo.ObjectID(sid)},{$unset:{"mentorid":""},$set:{hasMentor:false}});
        });
        await connection.close();
        res.status(200).json({
            message: "Deleted"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
})

app.get('/put/mentor/:tid',async (req,res)=>{
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        id = req.params.id;
        students = await db.collection("students").find({hasMentor:false}).toArray();
        result = [];
        students.forEach(student => {
            result.push({"id":student._id,"name":student.name});
        });
        await connection.close();
        res.status(200).json({
            result,
            message: "Success"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
})

app.get('/mentor/:id',async (req,res)=>
{
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        id = req.params.id;
        out = await db.collection("mentors").findOne({_id:mongo.ObjectID(id)});
        result = [];
        console.log(out);
        out.studentids.forEach(async student => {
            stud = await db.collection("students").find({_id:mongo.ObjectID(student)}).toArray();
            stud.forEach(stu=>{
                result.push({"id":stu._id,"name":stu.name});
            })
        });
        await connection.close();
        res.status(200).json({
            result,
            message: "Success"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
})

app.put('/mentor/:id',async (req,res)=>{ 
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        id = req.params.id;
        change = await db.collection("mentors").findOne({_id:mongo.ObjectID(id)});
        change.studentids.forEach(async studentid=>{
            (await db.collection("students").findOneAndUpdate({_id:mongo.ObjectID(studentid)},{$unset:{"mentorid":""},$set:{hasMentor:false}}));
        })
        await db.collection("mentors").findOneAndUpdate({_id:mongo.ObjectID(id)},{$set:req.body});
        out = await db.collection("mentors").findOne({_id:mongo.ObjectID(id)});
        out.studentids.forEach(async sid => {
            (await db.collection("students").findOneAndUpdate({_id:mongo.ObjectID(sid)},{$set:{hasMentor:true,mentorid:id}}));
        });
        await connection.close();
        res.status(200).json({
            message: "Success"
        });
    } catch (error) {
        res.status(500).json(error);
    }
})


app.put('/add/mentor/:id',async (req,res)=>{ 
    try {
        let connection = await MongoClient.connect(url);
        let db = connection.db(DB);
        id = req.params.id;
        await db.collection("mentors").findOneAndUpdate({_id:mongo.ObjectID(id)},{$push:{studentids:{$each:req.body}}});
        req.body.forEach(async sid=>{
            await db.collection("students").findOneAndUpdate({_id:mongo.ObjectID(sid)},{$set:{hasMentor:true,mentorid:id}});
        })
        await connection.close();
        res.status(200).json({
            message: "Success"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
})

app.put('/student/:id',async (req,res)=>{
    try {
        let connection = await MongoClient.connect(url);
        let db = await connection.db(DB);
        id = req.params.id;
        mentor = await db.collection("students").findOne({_id:mongo.ObjectID(id)});
        edit = await db.collection("mentors").findOneAndUpdate({_id:mongo.ObjectID(mentor.mentorid)},{$pull:{studentids:id}});
        await db.collection("students").findOneAndUpdate({_id:mongo.ObjectID(id)},{$set:req.body});
        out = await db.collection("students").findOne({_id:mongo.ObjectID(id)});
        if(out.hasMentor==true){
        await db.collection("mentors").findOneAndUpdate({_id:mongo.ObjectID(out.mentorid)},{$push:{studentids:id}});
        }
        else
        {
            await db.collection("students").findOneAndUpdate({_id:mongo.ObjectID(id)},{$unset:{"mentorid":""}});
        }
        await connection.close();
        res.status(200).json({
            message: "Success"
        });
    } catch (error) {
        res.status(500).json(error);
    }
})