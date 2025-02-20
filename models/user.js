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

let usersch= new Schema({
    email:{type:String,required:true},
    dp:{type:String,default:"https://images.unsplash.com/photo-1611746869696-d09bce200020?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
    ,about:{type:String,default:"Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempore maiores, consectetur ipsam voluptas eligendi exercitationem dignissimos ea inventore illum quibusdam blanditiis nam illo asperiores,reiciendis quas? Explicabo veniam numquam dolorem"}
})

const passportlocalmongoose=require('passport-local-mongoose')
usersch.plugin(passportlocalmongoose)


let user= mongoose.model("user",usersch)

module.exports=user