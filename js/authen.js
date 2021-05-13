var md5 = require("md5")
var multer = require("multer")
var express = require("express")
var router = express.Router()
var ObjectId = require("mongodb").ObjectID
var sF = require("./sharedFunction.js")
var upload = multer({
    dest: 'uploads/'
})
const sharp = require('sharp')
var fs2 = require("fs").promises

router.get("/profiles", async function (req, res) {
    var query = {
        "_id": ObjectId(req.cookies["login"]._id)
    }
    result = null
    try {
        result = await sF.getDb().collection("acc").findOne(query)
    } catch (err) {
        console.log("error")
    }
    if (result == null) {
        res.send("User data cannot be found!")
        return;
    }
    let parts = {
        ...res.parts,
        msg: "",        
        usr_value: result["username"],
        tel_value: result["phoneNumber"],
        email_value: result["email"],    
    }
    const html = await sF.render('public/profiles.html', parts)
    res.send(html)
})

router.post("/profiles", upload.single('ava'), function (req, res) {
	(async function() {		
        let mess = ""
		let success = true		
		var query = {"_id": ObjectId(req.cookies["login"]._id)}
		objUser = null
		try {
			objUser = await sF.getDb().collection("acc").findOne(query)
		} catch (err) {
			console.log("error")
		}
		if (objUser == null) {
			res.send("User data cannot be found!")
			return;
		}

		let parts = {...res.parts, usr_value: objUser["username"], email_value: req.body.email, tel_value: req.body.phoneNumber}
		
		if (req.file != undefined) {
			var filename = objUser["username"] + ".jpg"
			await sharp(req.file.path)
			.resize(100, 100)
			.jpeg({ quality: 100, progressive: true })
			.toFile('public/ava/' + filename)
			fs2.unlink(req.file.path)
			objUser["avatar"] = 'ava/' + filename
		}		
        objUser["email"] = req.body.email
        objUser["phoneNumber"] = req.body.phoneNumber
		if (req.body["password"] != "") {
			if (req.body["password"].length < 6 || req.body["password"].length > 32) {				
                success = false
                mess = mess + "password"
			} else {            
            var salt = sF.makeSalt(6)
            var hashCode = salt + md5(salt + req.body["password"])
				objUser["password"] = hashCode
			}
		} else {
            success = false
            mess = mess + "password"
        }
		if (success) {
            mess = "You successfully edit your profile"
            parts["msg"] = sF.makeMess(mess,success)
			var query = {"_id": ObjectId(req.cookies["login"]._id)}
			try {
				const result = await sF.getDb().collection("acc").updateOne(query, {$set: objUser})
				parts["msg_style"] = ""
			} catch (err) {
				console.log(err)
				res.send("500 error updating db")
				return;
			}
		} else {
            mess = mess + "is invalid"
            parts["msg"] = sF.makeMess(mess,success)
        }
		const html = await sF.render('public/profiles.html', parts)
		res.send(html)
	})()
})

router.get("/login", async function (req, res) {
    let parts = {
        msg: "",
        usr_value: "",
        pwd_value: "",
        usr_err: "",
        pwd_err: ""
    }
    const html = await sF.render('public/page-login.html', parts)
    res.send(html)
})

router.post("/login", function (req, res) {
    let parts = {
        msg: "",
        usr_value: req.body.username,
        pwd_value: req.body.password,
        usr_err: "",
        pwd_err: ""
    }
    var query = {
        "username": req.body.username
    }

    sF.getDb().collection("acc").findOne(query, async function (err, result) {
        var isTrue = new Boolean(true)
        if (result == null) {
            isTrue = false
        } else {
            var usr_pass = result["password"]
            var salt = usr_pass.substring(0, 6)
            var hashCode = salt + md5(salt + req.body["password"])
            if (hashCode !== usr_pass) {
                isTrue = false
            }
        }
        if (isTrue) {
            var toCookie = {
                _id: result["_id"],
                username: result["username"],
                role: result["role"]
            }
            res.cookie('login', toCookie, {
                maxAge: 360000000
            })
            if (result["role"] === 0) {
                res.redirect(302, '/admin')
            } else {
                res.redirect(302, '/teacher')
            }
        } else {
            parts["msg"] = "<div class='red'>Incorrect login!</div>"
            // parts["msg"] = "<a href='./login'>Go Back</a> <br/>" + parts["msg"]
            const html = await sF.render('public/page-login.html', parts)
            res.send(html)
        }
    })
})

router.get("/logout", function (req, res) {
    res.clearCookie('login')
    res.redirect(302, '/login')
})

router.get("/signup", async function (req, res) {
    let parts = {
        msg: "",
        user_value: "",
        email_value: "",
        tel_value: "",
        pass_value: ""
    }
    const html = await sF.render('public/page-register.html', parts)
    res.send(html) // res.send() may be called only once
})

router.post("/signup", async function (req, res) {    
    sF.handle_get(req,res)
});

module.exports = router