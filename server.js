var express = require("express")
var bodyParser = require("body-parser")
var cookieParser = require('cookie-parser')
var app = express()
var ObjectId = require("mongodb").ObjectID
var sF = require("./js/sharedFunction.js")
var authController = require("./js/authen.js")
var classController = require("./js/manageClass.js")

app.use(bodyParser.urlencoded({
    extended: false
})) // enable req.body
app.use(express.static('public', {index: 'start.html'}))
app.use(cookieParser())

app.use(function (req, res, next) {
    (async function () {
        if (req.url !== '/login' && req.url !== '/signup') {
            res.parts = {
                avatar: "images/admin.jpg"
            }            
            var uid = req.cookies['login']            
            if (uid != undefined) {
                var oid = uid._id
                var query = {
                    "_id": ObjectId(oid)
                }                
                try {
                    objUser = await sF.getDb().collection("acc").findOne(query)
                    req.user = objUser
                    if (objUser["avatar"] != undefined) {
                        res.parts["avatar"] = objUser["avatar"]
                    }
                } catch (err) {                    
                    console.log("Error middleware")
                    res.redirect(302, "/login")
                    return
                }
            } else {
                res.redirect(302, "/login")
                return
            }
        } else {
            var uid = req.cookies['login']            
            if (uid != undefined) {
                res.redirect(302, "/schedule")
                return
            }
        }
        next()
    })()
})

app.use(authController)
app.use(classController)

app.get("/", function (req, res) {    
	res.redirect(302, "/login")
})

app.get("/admin", function (req, res) {
	res.redirect(302, "/class_list")
})

app.get("/teacher", function (req, res) {
	res.redirect(302, "/class_list")
})

var server = app.listen(3000)