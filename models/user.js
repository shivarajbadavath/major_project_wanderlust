const mongoose=require("mongoose");
const Schema=mongoose.Schema;
//const passport=require('passport');
const passportLocalMongoose=require('passport-local-mongoose');

const userSchema=Schema({
    email:{
        type:String,
        require:true
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",userSchema);