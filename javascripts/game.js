//Functions to update HTML
function updateElement(elementID,value) {
	document.getElementById(elementID).innerHTML=value
}
	
function updateClass(elementID,value) {
	document.getElementById(elementID).className=value
}
	
function moveElement(elementID,moveTo) {
	document.getElementById(moveTo).appendChild(document.getElementById(elementID))
}
	
function showElement(elementID,style) {
	document.getElementById(elementID).style.display=style
}
	
function hideElement(elementID) {
	document.getElementById(elementID).style.display='none'
}
	
function visibleElement(elementID) {
	document.getElementById(elementID).style.visibility='visible'
}
	
function invisibleElement(elementID) {
	document.getElementById(elementID).style.visibility='hidden'
}
	
//Main game functions
var player={version:0,
	build:2,
	playtime:0,
	points:new Decimal(10),
	totalPoints:new Decimal(0),
	generatorsBought:[0,0,0,0,0,0,0,0,0],
	energy:{consumedPoints:new Decimal(0),
		amount:0,
		genPower:0,
		plasmaPower:0},
	updateRate:20,
	lastTick:new Date().getTime()}
	
var gameLoopInterval
var tickspeed=0
var startTime
var ticked=true
var lastSave=0
var pointsPerSecond=0
var pointsPerTick=0
var unpoweredEnergy=0

function init() {
	var tempSave=localStorage.getItem('UEIG_save')
	updated=true
	tickspeed=0
	load(tempSave)
}

function gameTick() {
	var currentTime = new Date().getTime()
	if (player.lastTick>0) {
		if (currentTime-lastSave>=60000) {
			save()
		}
		
		var diff=(currentTime-player.lastTick)/1000
		player.playtime+=diff
		
		//Change the values!
		pointsPerSecond=new Decimal(0)
		for (var tier=1;tier<9;tier++) {
			pointsPerSecond=pointsPerSecond.add(getGenMult(tier))
		}
		pointsPerTick=pointsPerSecond.times(diff)
		
		player.points=player.points.add(pointsPerTick)
		player.totalPoints=player.totalPoints.add(pointsPerTick)
	}
	player.lastTick=currentTime
	
	updateElement('points',format(player.points)+' points')
	updateElement('pointsRate',format(pointsPerSecond)+'/s')
}

function gameLoop() {
	if (ticked) {
		ticked=false
		setTimeout(function(){
			startTime=new Date().getTime()
			try {
				gameTick()
			} catch (e) {
				console.log('A game error has occured:')
				console.error(e)
			}
			tickspeed=Math.max((new Date().getTime()-startTime)*0.2+tickspeed*0.8,1000/player.updateRate)
			startTime=new Date().getTime()
			ticked=true
		},tickspeed-1000/player.updateRate)
	}
}

function save() {
	try {
		localStorage.setItem('UEIG_save',btoa(JSON.stringify(player)))
		lastSave=new Date().getTime()
		console.log('Game saved!')
	} catch (e) {
		console.log('Well, we tried.')
		console.error(e)
	}
}

function load(save) {
	clearInterval(gameLoopInterval)
	try {
		var savefile=JSON.parse(atob(save))
		
		//Update savefile to new versions
		if (savefile.version<1) {
			//v1 build 1 is the first build!
			if (savefile.build<2) {
				if (savefile.points==0) savefile.points=10
				savefile.playtime=0
				savefile.energy={consumedPoints:0,
					amount:0,
					genPower:0,
					plasmaPower:0}
				savefile.updateRate=20
			}
			//savefile.build=0
		}
/*		if (savefile.version<2) {
			if (savefile.build<1) {
				(something)
			}
		}
*/
		//Turn string to Decimal on some values
		savefile.points=new Decimal(savefile.points)
		savefile.totalPoints=new Decimal(savefile.totalPoints)
		savefile.energy.consumedPoints=new Decimal(savefile.energy.consumedPoints)
		
		//Check if it is compatible
		if (player.version<savefile.version) throw 'Since you are playing in version '+player.version+', your savefile that is updated in version '+savefile.version+' has errors to the version you are playing.\nYour savefile has been discarded.'
		if (player.version==savefile.version) {
			if (savefile.build!=undefined) {
				if (player.build<savefile.build) throw 'Since you are playing in build '+player.build+', your savefile that is updated in build '+savefile.build+' has errors to the build you are playing.\nYour savefile has been discarded.'
			}
		}
		
		//Update versions
		savefile.version=player.version
		savefile.build=player.build
		
		player=savefile
		console.log('Save loaded!')
		
		gameLoopInterval=setInterval(function(){gameLoop()},1000/player.updateRate)
		return false
	} catch (e) {
		console.log('Your save has failed to load:')
		console.error(e)
		
		gameLoopInterval=setInterval(function(){gameLoop()},1000/player.updateRate)
		return true
	}
}

function exportSave() {
	var savefile=btoa(JSON.stringify(player))
	showElement('exportSave','block')
	document.getElementById("exportText").value=btoa(JSON.stringify(player))
}

function importSave() {
	var input=prompt('Copy and paste in your exported file and press enter.')
	if (load(input)) {
		if (input!=null) {
			alert('Your save was invalid or caused a game-breaking bug. :(')
		}
	}
}

function reset(tier) {
	if (tier==Infinity?confirm('If you hard reset, everything including the save will be lost and you have to start over! Are you sure to do that?'):true) {
		if (tier==Infinity) {
			//Hard reset
			player.playtime=0
			player.totalPoints=new Decimal(0)
			
			localStorage.clear('UEIG_save')
			save()
		}
		//Tier 1 reset
		player.points=new Decimal(0)
		player.generatorsBought=[0,0,0,0,0,0,0,0,0]
	}
}

function format(value) {
	if (!(value instanceof Decimal)) value=new Decimal(value)
		
	var mantissa
	if (value.lt(1e3)) {
		mantissa=value.toFixed(0)
		if (parseFloat(mantissa)!=1e3) return mantissa
	}
	var unencoded=format1OoMGroup(value)
	if (Decimal.gte(unencoded.exponent,1e5)) {
		var unencodedExp=format1OoMGroup(new Decimal(unencoded.exponent))
		return unencoded.mantissa+'e'+unencodedExp.mantissa+'e'+unencodedExp.exponent
	}
	return unencoded.mantissa+'e'+unencoded.exponent
}

function format1OoMGroup(value) {
	mantissa=value.mantissa.toFixed(2)
	var exponent=value.exponent
	if (parseFloat(mantissa)==10) {
		mantissa='1.00'
		if (Decimal.lt(exponent,9007199254740992)) exponent+=1
	}
	return {mantissa:mantissa,exponent:exponent}
}

//Game functions
function getGenMult(tier) {
	var mult=Decimal.pow(10,tier-1)
	return mult.times(player.generatorsBought[tier-1])
}