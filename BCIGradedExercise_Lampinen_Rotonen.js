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
const postsSchema = require("./schemas/postsSchema")
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
const postInfoValidator = ajv.compile(postsSchema)

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
const jwtSecretKey = "secretKey123"
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
app.post('/upload', parser.single('image'), function (req, res) {
    console.log(req.file);
    res.status(201);
    res.json(req.file);
});
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
app.post('/posts', parser.array('photos', 4), function (req, res, next) {
// req.files is array of `photos` files
// req.body will contain the text fields, if there were any
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
    title: req.body.title,
    itemDescription: req.body.itemDescription,
    category: req.body.category,
    location: req.body.location,
    askingPrice: req.body.askingPrice,
    dateOfPosting: req.body.dateOfPosting,
    deliveryType: req.body.deliveryType,
    sellersInfoFirstName : req.body.sellersInfoFirstName,
    sellersInfoLastName : req.body.sellersInfoLastName,
    sellersInfoEmail : req.body.sellersInfoEmail,
    sellersInfoPhone : req.body.sellersInfoPhone,
    picUrls : myList
    }
allPosts.push(newPost)
res.send(req.body)


}
)
var opts = {
    jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey : jwtSecretKey
}
app.post('/login', loginAndRegisterInfoValidatorMW,  passport.authenticate('basic', {session: false}), (req, res) => {
    const token = jwt.sign({foo: "bar"}, jwtSecretKey)
    res.json({token: token})
    
})
passport.use(new JwtStrategy(opts, (payload, done) => {
    done(null, {})
}))
app.get("/jwtprotectedresource", passport.authenticate('jwt', {session: false}), (req, res) => {
    res.send("INSIDE JWT PROTECTED")
})
app.get('/posts', (req, res) => {
    cityList = []
    categoryList = []
    timeList = []
    
    let locationQ = req.query.location
    let categoryQ = req.query.category
    let timeQ = req.query.dateOfPosting
    console.log("ASDASD" + timeQ)
    console.log(locationQ)
    console.log(categoryQ)
    if (categoryQ == undefined && locationQ != undefined)
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
    else if (locationQ == undefined && categoryQ != undefined)
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
    else if (locationQ == undefined && categoryQ == undefined)
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
    else 
    {
        res.sendStatus(400)
    }
  })
app.listen(app.get('port'), function() {
    console.log('Example app listening at http://localhost')
  })
