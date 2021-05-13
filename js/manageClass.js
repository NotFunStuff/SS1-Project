var express = require("express")
var router = express.Router()
var ObjectId = require("mongodb").ObjectID
var sF = require("./sharedFunction.js")

router.use(function(req,res,next){
	var cookie = req.cookies['login']
	var role = cookie.role
	
	if (req.url !== "/schedule"){		
		if(role !== 0){				
			res.redirect(302, "/schedule")	
			return
		}
	} else {		
		if(role === 0){	
			res.redirect(302, "/class_list")
			return
		}
	}	
	next()
})

router.get("/class_list", function (req, res) {
	(async function () {
		let tbtext = ""
		const result = await sF.getDb().collection("class").find().toArray()
		let stt = 1
		result.forEach(function (c) {
			let classDate = new Date(c["date"])
			let classTime = classDate.getDate() + "/" + (classDate.getMonth()+1) + "/" + classDate.getFullYear()
			tbtext = tbtext + "<tr><th scope=\"row\">" + stt + "</th>" +
				"<td>" + c["name"] + "</td>" +
				"<td>" + c["room"] + "</td>" +
				"<td>" + c["teacher"] + "</td>" +
				"<td>" + c["time"] + "</td>" +
				"<td>" + classTime + "</td>" +
				`<td><a href="/class_edit_${c["_id"]}">Edit</a></td><td><a href="javascript:confirmDelete('${String(c["_id"])}')">Delete</a></td>` +
				"</tr>"
			stt++
		})
		let parts = {
			...res.parts,
			tb: tbtext
		}
		// console.log(parts)
		const html = await sF.render('public/class_list.html', parts)
		res.send(html)
	})()
})

router.get("/class_create", async function (req, res) {
	const result = await sF.getDb().collection("acc").find({
		"role": 1
	}).toArray()	
	let option = ""
	result.forEach(function (u) {
		option = option + `<option value=\"${u["username"]}\">${u["username"]}</option>`
	})
	let parts = {
		...res.parts,
		msg: "",
		op: option
	}
	const html = await sF.render('public/class_create.html', parts)
	res.send(html)
})

router.post("/class_create", async function (req, res) {
	const result = await sF.getDb().collection("acc").find({
		"role": 1
	}).toArray()	
	let option = ""
	let mess = ""
	result.forEach(function (u) {
		option = option + `<option value=\"${u["username"]}\">${u["username"]}</option>`
	})
	let parts = {
		...res.parts,
		op: option
	}	
	var checked = true
	var query1 = {
		room: req.body.classRoom,
		time: req.body.time,
		date: req.body.date,	
	}
	var query2 = {
		teacher: req.body.teacher,
		time: req.body.time,
		date: req.body.date,	
	}
	if (req.body.className.length === 0) {
		checked = false
		mess = mess + "className"
	}
	if (req.body.classRoom.length === 0) {
		checked = false
		mess = mess + " classRoom"
	}
	if (req.body.teacher === undefined) {
		checked = false
		mess = mess + " teacher"
	}
	if (req.body.time === undefined) {
		checked = false
		mess = mess + " time"
	}	
	if (req.body.date.length === 0) {
		checked = false
		mess = mess + " date"
	}

	if (checked) {
		// 1 classroom cannot have more than 1 class at the same time
		const result1 = await sF.getDb().collection("class").findOne(query1)
		if (result1 !== null) {
			checked = false
			parts.msg = sF.makeMess("That room already had class on that time", checked)
		}
		// 1 teacher cannot teach more than 1 class at the same time
		const result2 = await sF.getDb().collection("class").findOne(query2)
		if (result2 !== null) {
			checked = false
			parts.msg = sF.makeMess("Teacher already had schedule on that time", checked)
		}
	} else {
		parts.msg = sF.makeMess( mess + " is undefined", checked)
	}
	
	if (checked) {
		var query = {
			name: req.body.className,
			room: req.body.classRoom,
			teacher: req.body.teacher,
			time: req.body.time,
			date: req.body.date
		}
		const result = await sF.getDb().collection("class").insertOne(query)
		parts.msg = sF.makeMess("You successfully create a class", checked)
	}
	const html = await sF.render('public/class_create.html', parts)
	res.send(html)
})

router.get("/class_edit_:id", async function(req,res){
	const result = await sF.getDb().collection("acc").find({
		"role": 1
	}).toArray()
	let option = ""
	result.forEach(function (u) {
		option = option + `<option value=\"${u["username"]}\">${u["username"]}</option>`
	})
	let parts = {
		...res.parts,
		classId: req.params.id,
		msg: "",
		op: option
	}
	const html = await sF.render('public/class_edit.html', parts)
	res.send(html)
})

router.post("/class_edit_:id", async function (req, res) {
	const result = await sF.getDb().collection("acc").find({
		"role": 1
	}).toArray()
	let option = ""
	let mess = ""
	result.forEach(function (u) {
		option = option + `<option value=\"${u["username"]}\">${u["username"]}</option>`
	})
	let parts = {
		...res.parts,
		classId: req.params.id,
		op: option
	}	
	var checked = true
	var query1 = {
		room: req.body.classRoom,
		time: req.body.time,
		date: req.body.date,
		_id: {$ne: ObjectId(req.params.id)} 
	}
	var query2 = {
		teacher: req.body.teacher,
		time: req.body.time,
		date: req.body.date,
		_id: {$ne: ObjectId(req.params.id)} 
	}
	if (req.body.className.length === 0) {
		checked = false
		mess = mess + "className"
	}
	if (req.body.classRoom.length === 0) {
		checked = false
		mess = mess + " classRoom"
	}
	if (req.body.teacher === undefined) {
		checked = false
		mess = mess + " teacher"
	}
	if (req.body.time === undefined) {
		checked = false
		mess = mess + " time"
	}	
	if (req.body.date.length === 0) {
		checked = false
		mess = mess + " date"
	}

	if (checked) {
		// 1 classroom cannot have more than 1 class at the same time
		const result1 = await sF.getDb().collection("class").findOne(query1)
		if (result1 !== null) {			
			checked = false
			parts.msg = sF.makeMess("That room already had class on that time", checked)
		}
		// 1 teacher cannot teach more than 1 class at the same time
		const result2 = await sF.getDb().collection("class").findOne(query2)
		if (result2 !== null) {
			checked = false
			parts.msg = sF.makeMess("Teacher already had schedule on that time", checked)
		}
	} else {
		parts.msg = sF.makeMess( mess + " is undefined", checked)
	}
	
	if (checked) {
		var cid = { "_id": ObjectId(req.params.id) }
		var query = {
			name: req.body.className,
			room: req.body.classRoom,
			teacher: req.body.teacher,
			time: req.body.time,
			date: req.body.date
		}
		const result = await sF.getDb().collection("class").updateOne(cid, { $set: query })
		parts.msg = sF.makeMess("You successfully edit a class", checked)
	}
	const html = await sF.render('public/class_edit.html', parts)
	res.send(html)
})

router.get("/class_delete_:id",async function(req,res){
	var query = { "_id": ObjectId(req.params.id) }
	result = await sF.getDb().collection("class").deleteOne(query)
	res.redirect(302, "/class_list")
})

router.get("/schedule", async function(req,res){
	
		let tbtext = ""
		const result = await sF.getDb().collection("class").find().toArray()
		let stt = 1
		var today = new Date()
		var toCompare = new Date((today.getFullYear()) + "-" + (today.getMonth()+1) + "-" + (today.getDate()))
		var style = "red"
		result.forEach(function (c) {
			if(c["teacher"] === req.cookies["login"].username){		
			if(new Date(c.date).getTime() < toCompare.getTime() ){
				style = "red"
			} else if (new Date(c.date).getTime() > toCompare.getTime()) {
				style = "#cccc00"
			} else {
				style = "green"
			}
			let classDate = new Date(c["date"])
			let classTime = classDate.getDate() + "/" + (classDate.getMonth()+1) + "/" + classDate.getFullYear()
			tbtext = tbtext + `<tr><th scope= "row" style=color:${style}> ${stt} </th>` +
				`<td style=color:${style}> ${c["name"]} </td>` +
				`<td style=color:${style}> ${c["room"]}  </td>` +
				`<td style=color:${style}> ${c["teacher"]}  </td>` +
				`<td style=color:${style}> ${c["time"]} </td>` +
				`<td style=color:${style}> ${classTime}  </td>` +		
				`</tr>`
			stt++
		}
		})
		let parts = {
			...res.parts,
			tb: tbtext
		}
		const html = await sF.render('public/schedule.html', parts)
		res.send(html)
	
})

module.exports = router