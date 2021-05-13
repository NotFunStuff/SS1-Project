var fs = require("fs").promises
var MongoClient = require("mongodb").MongoClient
var md5 = require("md5")
class Common {

    _dbo = null

    constructor() {
        var self = this
        MongoClient.connect("mongodb://localhost:27017/", {
            useUnifiedTopology: true
        }, function (err, client) {
            if (err) throw err
            self._dbo = client.db("taminhduc") // select the database
            console.log("Your game is ready, man!")
        })
    }

    getDb() {
        return this._dbo;
    }

    makeSalt(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    async render(view, parts) {
        var re = /<~(.+?)~>/g
        var data = await fs.readFile(view, 'utf-8')
        do {
            var m = re.exec(data)
            if (m) {
                var params = 'public/commonParts/' + m[1]
                var add = await fs.readFile(params, 'utf-8')
                data = data.substring(0, m.index) + add + data.substring(m.index + m[0].length)
            }
        } while (m)
        const keys = Object.keys(parts)
        keys.forEach(function (item) {
            data = data.replace("{" + item + "}", parts[item])
        })
        return data
    }

    async handle_get(req, res) {
        let mess = ""
        let parts = {
            msg: "",
            "user_value": req.body.username,
            "pass_value": req.body.password,
            "tel_value": req.body.phoneNumber,
            "email_value": req.body.email
        }
        let success = true
        if (req.body.username !== undefined) {
            parts["usr_value"] = encodeURI(req.body.username)
            // parts["usr_value"] = req.body.username
            if (req.body.username.length < 3) {
                parts["usr_label"] = "<span class ='red'>Username is too short (at least 3 characters)</span>"

                success = false
            } else {
                try {
                    let result = await this.getDb().collection("acc").findOne({
                        "username": req.body.username
                    })
                    if (result != null) {
                        parts["usr_label"] = "<span class ='red'>Username is not available</span>"
                        mess = mess + " username"
                        success = false
                    }
                } catch (err) {
                    console.log(err)
                    res.send("500 error querying database")
                }
            }
        } else {
            parts["usr_label"] = "<span class ='red'>Please enter username</span>"
            mess = mess + " username"
            success = false
        }
        // console.log(success)
        if (req.body.password !== undefined) {
            if (req.body.password.length < 6) {
                parts["pwd_label"] = "<span class ='red'>Password is too short (at least 6 characters)</span>"
                success = false
                mess = mess + " password"
            }
        } else {
            parts["pwd_label"] = "<span class ='red'>Please enter password</span>"
            mess = mess + " password"
            success = false
        }
        // console.log(success)
        if (success) {
            var pass = req.body.password
            var salt = this.makeSalt(6)
            var hashCode = salt + md5(salt + pass)
            let user_object = {
                "username": req.body.username,
                "password": hashCode,
                "phoneNumber": req.body.phoneNumber,
                "email": req.body.email,
                "role": 1,
                "register_time": new Date()
            }
            try {
                const result = await this.getDb().collection("acc").insertOne(user_object)
                // res.cookie('login', result.insertedId, {
                //     maxAge: 360000
                // })
                res.redirect(302, '/login')                
            } catch (err) {
                console.log(err)
                res.send("500 error inserting to db")
            }
        } else {
            try { 
                mess = mess + " is invalid"   
                parts["msg"] = this.makeMess(mess, success)
                let data = await this.render('public/page-register.html', parts)
                res.send(data);
            } catch (err) {
                console.log(err)
                res.send("500 error reading file")
            }
        }

    }

    makeMess(mess, x) {
        let messType = ""
        let messType2 = ""
        if (x) {
            messType = "success"
            messType2 = "Success"
        } else {
            messType = "danger"
            messType2 = "Fail"
        }
        let newMess = `<div class="sufee-alert alert with-close alert-${messType} alert-dismissible fade show">
        <span class="badge badge-pill badge-${messType}">${messType2}</span>
        ${mess}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">×</span>
        </button>
        </div>`
        return newMess
    }
}

module.exports = new Common()