const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const passport = require('passport')
const BasicStrategy = require('passport-http').BasicStrategy
const multer = require("multer")
const upload = multer({dest: "uploads/"})
const jwt = require("jsonwebtoken")
const JwtStrategy = require("passport-jwt").Strategy
const ExtractJwt = require("passport-jwt").ExtractJwt
const loginAndRegisterSchema = require("./schemas/loginAndRegisterSchema")
const { uuid } = require('uuidv4');
const Ajv = require("ajv")
const ajv = new Ajv()
var cloudinary = require("cloudinary")
var cloudinaryStorage = require("multer-storage-cloudinary")
var storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: '',
    allowedFormats: ["jpg","png"],
})
var parser = multer({storage: storage})
app.use(bodyParser.json())
const loginAndRegisterInfoValidator = ajv.compile(loginAndRegisterSchema)
const loginAndRegisterInfoValidatorMW = function(req, res, next ) {
    const result = loginAndRegisterInfoValidator(req.body)
    if (result == true){
        next()
    }
    else{
        res.sendStatus(400)
    }
}
const userDB = []
const allPosts = []
app.set('port', (process.env.PORT || 80));  
passport.use(new BasicStrategy(
    (userName, passWord, done) => {
        console.log('Basic strategy params, username ' + userName + " , password " + passWord)
        // credential check
        // search userDB for matching user
        const searchResult = userDB.find(user => {
            if(user.userName === userName) {
                if(bcrypt.compareSync(passWord, user.passWord)) {
                    return true
                }
            }
            return false
        })
        if(searchResult != undefined){
            done(null, searchResult) // succesfully authenticated
        } else {
            done(null, false) // no credential match
        }
    }
))
app.get("/", (req, res) => {
    res.send("Nothing here. Please visit https://bci-lampinen-rotonen.herokuapp.com/posts or HTML document at https://eliaslampinen.stoplight.io/docs/bcigradedexercise-lampinen-rotonen/YXBpOjIxMjM4Mjgy-bci-graded-exercise-lampinen-rotonen-api")
})
app.post('/register', loginAndRegisterInfoValidatorMW, (req, res) => {
    const salt = bcrypt.genSaltSync(6)
    const hashedPassword = bcrypt.hashSync(req.body.passWord, salt)
    const newUser = {
        userName : req.body.userName,
        passWord : hashedPassword, // DO NOT EVER STORE PASSWORD TO THE SYSTEM IN PLAIN TEXT
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        birthDate : req.body.birthDate,
        email : req.body.email
    }
    console.log(newUser)
    userDB.push(newUser)
    res.sendStatus(201) 
})
app.post('/posts', passport.authenticate('basic', {session: false}), parser.array('photos', 4), function (req, res, next) {
// req.files is array of `photos` files
// req.body will contain the text fields, if there were any
var todayDate = new Date().toISOString().slice(0, 10);
console.log(req.file)
try {
    myList = []
    for (let i = 0; i < 4; i ++)
    {
        try {
            myList.push(req.files[i].url)
        }
        catch (error) {
        }
    }
} catch (error) {
    console.log(error);
    res.send(400);
}
const newPost = {
    userName: req.user.userName,
    title: req.body.title,
    itemDescription: req.body.itemDescription,
    category: req.body.category,
    location: req.body.location,
    askingPrice: req.body.askingPrice,
    dateOfPosting: todayDate,
    deliveryType: req.body.deliveryType,
    sellersInfoFirstName : req.body.sellersInfoFirstName,
    sellersInfoLastName : req.body.sellersInfoLastName,
    sellersInfoEmail : req.body.sellersInfoEmail,
    sellersInfoPhone : req.body.sellersInfoPhone,
    picUrls : myList,
    postID : uuid()
    }
allPosts.push(newPost)
res.send(newPost);
}
)
app.post('/login',  passport.authenticate('basic', {session: false}), (req, res) => {
    res.sendStatus(200)
})


app.get('/posts', (req, res) => {
    cityList = []
    categoryList = []
    timeList = []
    
    let locationQ = req.query.location
    let categoryQ = req.query.category
    let timeQ = req.query.dateOfPosting
    let idQ = req.query.postID
    var a = 0
    var foundOrNot = false
    if (categoryQ == undefined && timeQ == undefined && idQ == undefined && locationQ != undefined){
        a = 1
    }
    else if (categoryQ != undefined && timeQ == undefined && idQ == undefined && locationQ == undefined){
        a = 2
    }
      
    else if (categoryQ == undefined && timeQ != undefined && idQ == undefined && locationQ == undefined){
        a = 3
    }
    else if (categoryQ == undefined && timeQ == undefined && idQ != undefined && locationQ == undefined){
        a = 4
    }
    else if (categoryQ == undefined && timeQ == undefined && idQ == undefined && locationQ == undefined){
        a = 5
    }
    else {
        a = 0
    }
    if (a == 1)
    {
    allPosts.forEach(function(i){
        if (i.location == locationQ)
        {
            cityList.push(i)
        }
      });
    if (cityList.length == 0)
    {
        res.sendStatus(404)
    } 
    else
    
    {
        res.type('json').send(JSON.stringify(cityList, null, 2) + '\n');
    }   
    }
    else if (a == 2)
    {
        allPosts.forEach(function(i){
            if (i.category == categoryQ)
            {
                categoryList.push(i)
            }
          });
    
        if (categoryList.length == 0)
        {
            res.sendStatus(404)
        } 
        else
        
        {
            res.type('json').send(JSON.stringify(categoryList, null, 2) + '\n');
        }  
    }
    else if (a == 3)
    {
        allPosts.forEach(function(i){
            if (i.dateOfPosting == timeQ)
            {   
                timeList.push(i)
            }
          });
    
        if (timeList.length == 0)
        {
            res.sendStatus(404)
        } 
        else
        
        {
            res.type('json').send(JSON.stringify(timeList, null, 2) + '\n');
        }  
    }
    else if (a == 4)
    {
        allPosts.forEach(function(i){
            if (i.postID == idQ)
            {   
                foundOrNot = true
                res.type('json').send(JSON.stringify(i, null, 2) + '\n');
            }
          });
    
        if (foundOrNot == false ){
            res.sendStatus(404)
        } 
    }
    
    else if (a == 0)
    {
        res.send("Only one query parameter allowed at this endpoint")
    }
    else 
    {   
        if (allPosts.length == 0)
        {
        res.sendStatus(404)
        } 
        else
        {
        res.type('json').send(JSON.stringify(allPosts, null, 2) + '\n');
        }
    }
  })
app.delete("/posts", passport.authenticate('basic', {session: false}), (req, res) => {
    let idQ = req.query.postID
    var found = false
    
    allPosts.forEach(function(i){
        if (i.postID == idQ)
        {   
           
            if (i.userName == req.user.userName)
            {
                found = true
                allPosts.splice(i,1)
                res.sendStatus(200)
            }
            else
            {
                res.sendStatus(401)
            }
           
        }
        });

    if (found == false)
    {
        res.sendStatus(404)
    }    
})
app.put("/posts", passport.authenticate('basic', {session: false}), parser.array('photos', 4), (req, res) => {
    let idQ = req.query.postID
    var found = false
    var todayDate = new Date().toISOString().slice(0, 10);
    
    try {
        myList = []
        for (let i = 0; i < 4; i ++)
        {
            try {
                myList.push(req.files[i].url)
            }
            catch (error) {
                
            }
        }
    
    
    } catch (error) {
        console.log(error);
    }
    allPosts.forEach(function(i){
        if (i.postID == idQ)
        {   
            if (i.userName == req.user.userName)
            {
                found = true     
                i.title =  req.body.title
                i.itemDescription = req.body.itemDescription
                i.category = req.body.category
                i.location = req.body.location
                i.askingPrice = req.body.askingPrice
                i.dateOfPosting = todayDate
                i.deliveryType = req.body.deliveryType
                i.sellersInfoFirstName = req.body.sellersInfoFirstName
                i.sellersInfoLastName = req.body.sellersInfoLastName
                i.sellersInfoEmail = req.body.sellersInfoEmail
                i.sellersInfoPhone = req.body.sellersInfoPhone
                i.picUrls = myList
                i.postID = i.postID              
                res.sendStatus(201)
            }
            else if (i.userName != req.user.userName)
            {
                res.sendStatus(401)
            }
        
        }
        
        });
    if (found == false)
    {
        res.sendStatus(404)
    }    
})
app.listen(app.get('port'), function() {
    console.log('Example app listening at http://localhost')
  })
