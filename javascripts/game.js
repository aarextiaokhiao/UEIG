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
	build:1,
	playtime:0,
	points:new Decimal(0),
	totalPoints:new Decimal(0),
	generatorsBought:[0,0,0,0,0,0,0,0,0],
	lastTick:new Date().getTime()}
	
lastSave=0
var gameLoopInterval

function init() {
	var tempSave=localStorage.getItem('UEIG_save')
	updated=true
	tickspeed=0
	load(tempSave)
}

function gameLoop() {
	var currentTime = new Date().getTime()
	if (player.lastTick>0) {
		if (currentTime-lastSave>=60000) {
			save()
		}
		
		var diff=(currentTime-player.lastUpdate)/1000
		player.playtime+=diff
	}
	player.lastTick=currentTime
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
			if (savefile.build<2) { /*
				(something)
*/			}
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
		
		gameLoopInterval=setInterval(function(){gameLoop()},50)
		return false
	} catch (e) {
		console.log('Your save has failed to load:')
		console.error(e)
		
		gameLoopInterval=setInterval(function(){gameLoop()},50)
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

//Game functions