const express = require('express');
const app = express();
const router=express.Router()
const port = 3000;
const path = require('path');
const methodOverride = require('method-override')
const session=require('express-session')
const cookieparser=require('cookie-parser')
const flash=require('connect-flash')
const multer = require('multer');  
const {storage} = require('./cloudinary');
const upload = multer({ storage });

const passport=require('passport')
const localstrategy=require('passport-local').Strategy






const message=require("./models/message.js")
const user=require("./models/user.js")
const chat=require("./models/chat.js")


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(session({secret:'abc',saveUninitialized:true,resave:false,cookie:{}}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
passport.use(new localstrategy(user.authenticate()))
passport.serializeUser(user.serializeUser())
passport.deserializeUser(user.deserializeUser())    
app.use(cookieparser())
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use((req, res, next) => {
     res.locals.currentuser=req.user
     res.locals.url=req.session.url
     res.locals.success = req.flash('success');
     res.locals.fail = req.flash('fail')
      next();
});
app.use('/', router)


app.listen(port, () => {
console.log('http://localhost:3000/')});


const  ifuser=(req,res,next)=>{
  if (!req.isAuthenticated()) {
    req.session.url=req.originalUrl
    req.flash("fail","LOG IN FIRST!")
    res.redirect("/chatbox/login")
  }else{
    next()
  }
}


const ifown=async(req,res,next)=>{
    let {id}=req.params
    let x=await message.findById(id)
     if(req.user && req.user.username==x.user){
        next()
     }else{
        req.flash("fail","YOU ARENT THE OWNER!")
        res.redirect("/chatbox")
     }
}


const ifownchat=async(req,res,next)=>{
     let {username,id}=req.params
     let x= await chat.findById(id)
     if(req.user && req.user.username==x.from){
        next()
     }else{
        req.flash("fail","YOU ARENT THE OWNER!")
        res.redirect(`/chatbox/${username}/chat`)
     }
}




app.get("/",(req,res)=>{
    res.render("land.ejs")
})



app.get("/chatbox",ifuser,async(req,res)=>{
    let allmsg= await message.find()
    res.render("home.ejs",{allmsg})
})


app.get("/chatbox/signup",(req,res)=>{
    res.render("signup.ejs")
})

app.post("/chatbox/signup",async(req,res,next)=>{
    let {username,email,password}=req.body
    let newuser= new user({username,email,password})
    await user.register(newuser,password)
    req.logIn(newuser,(err)=>{
        if (err) {
            next(err)
        } else {
            req.flash("success","WELCOME TO CHATBOX!")
          res.redirect("/chatbox")  
        }
    })
})

app.get("/chatbox/login",(req,res)=>{
    res.render("login.ejs")
})

app.post("/chatbox/login",passport.authenticate("local",{failureFlash:true,
    failureMessage:true,failureRedirect:"/chatbox/login" }),(req,res)=>{
        req.flash("success","WELCOME BACK!")
        res.redirect( res.locals.url  ||"/chatbox")
    })


app.get("/chatbox/logout",(req,res)=>{
    req.logOut((err)=>{
        if (err) {
            next(err)
        } else {
            req.flash("success","LOGGED OUT!")
            res.redirect("/")
        }
    })
})


app.get("/chatbox/profile/search",async(req,res)=>{
    let {username}=req.query
    let anyuser= await user.findOne({username})
    if (anyuser) {
        res.redirect(`/chatbox/${username}/profile`)
    }else{
        req.flash("fail","NO SUCH USER!")
        res.redirect(`/chatbox/${req.user.username}/profile`)
    }
    
})

app.get("/chatbox/:username/profile",async(req,res)=>{
    let {username}=req.params
    let me=await user.findOne({username})
    res.render("profile.ejs",{me})
})

app.get("/chatbox/:username/profile/edit",async(req,res)=>{
    
    let {username}=req.params
    if (username==req.user.username) {
         let any=await user.findOne({username})
    res.render("editprofile.ejs",{any})
    }else{
        req.flash("fail","YOU ARENT THE OWNER!")
        res.redirect(`/chatbox/${username}/profile`)
    }
   
})

app.put("/chatbox/:username/profile/edit",upload.single('dp'),async(req,res)=>{
    let {username}=req.params
    let {about,newusername}=req.body
    let anyuser= await user.findOne({username:newusername})
if (anyuser && username!=newusername) {
    req.flash("fail","USERNAME ALREADY EXISTS!")
   res.redirect(`/chatbox/${username}/profile/edit`) 
}else{
let dp
    if (req.file) {
        dp=req.file.path
    }
    await user.findOneAndUpdate({username},{about,dp,username:newusername})
    await chat.updateMany({from:username},{from:newusername})
    await chat.updateMany({to:username},{to:newusername})
    await message.updateMany({user:username},{user:newusername})
    let x=await user.findOne({username:newusername})
    req.logIn(x,(err)=>{
        if (err) {
            next(err)
        } else {
            req.flash("success","PROFILE EDITED!")
            res.redirect(`/chatbox/${newusername}/profile`)

        }
    })
    
    
}
}) 

app.get("/chatbox/messages",ifuser,async(req,res)=>{
    let all= await user.find()
    let x=[]
    for(let ele of all){
        let any=await chat.find({to:ele.username})
        let latest=any.pop()
        if (latest) {
            x.unshift(latest)
        }
    }
   console.log(x);  
res.render("messages.ejs",{x})
})

app.post("/chatbox/new",ifuser,async(req,res)=>{
    let {msg}=req.body
    let user=req.user.username
  let newmsg= new message({msg,user})
  await newmsg.save()
  res.redirect("/chatbox")
})



app.get("/chatbox/:id/edit",ifown,async(req,res)=>{
    let {id}=req.params
    let any= await message.findById(id)
    res.render("edit.ejs",{any})
    
})


app.put("/chatbox/:id/edit",async (req,res)=>{
    let {id}=req.params
    let {msg}=req.body
    await message.findByIdAndUpdate(id,{msg})
    req.flash("success","MSG EDITTED!")
     res.redirect("/chatbox")
})

app.delete("/chatbox/:id/delete",ifown,async(req,res)=>{
    let {id}=req.params
    await message.findByIdAndDelete(id)
    req.flash("success","MSG DELETED!")
    res.redirect("/chatbox")
})

app.get("/chatbox/:username/chat",async(req,res)=>{
    let {username}=req.params

    let all = await chat.find({
        $or: [
          { from: req.user.username, to: username },
          { from: username, to: req.user.username }
        ]
      });  
    res.render("chat.ejs",{all,username})
})

app.post("/chatbox/:username/chat",async(req,res)=>{
    let {username}=req.params
    let {msg}=req.body
    let from=req.user.username
    let x= new chat({msg,from,to:username})
    await x.save()
    res.redirect(`/chatbox/${username}/chat`)

})

app.get("/chatbox/:username/chat/:id/edit",ifownchat,async(req,res)=>{
    let {username,id}=req.params
    let any=await chat.findById(id)
    res.render("chatedit.ejs",{any,username})
})

app.post("/chatbox/:username/chat/:id/edit",async (req,res)=>{
    let {username,id}=req.params
    let {msg}=req.body
    await chat.findByIdAndUpdate(id,{msg})
    req.flash("success","MSG EDITTED!")
     res.redirect(`/chatbox/${username}/chat`)
})

app.delete("/chatbox/:username/chat/:id/delete",ifownchat,async(req,res)=>{
    let {username,id}=req.params
    await chat.findByIdAndDelete(id)
    req.flash("success","MSG DELETED!")
    res.redirect(`/chatbox/${username}/chat`)
})













app.all("*",(req,res,next)=>{
    let err=new Error("NO PAGE FOUND !")
    next(err)
})

app.use((err,req,res,next)=>{
    let{status=500,message='error'}=err
    res.status(status).render("error.ejs",{message})
})




