const mongoose=require('mongoose')
const Schema=mongoose.Schema
main().then(()=>{
    console.log('done');
}).catch((err)=>{
    console.log(err);
})


async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/chatbox');
}

let chatsch=new Schema({
    from:{type:String,required:true},
    msg:{type:String,required:true},
    to:{type:String,required:true},
})



let chat=mongoose.model("chat",chatsch)


module.exports=chat