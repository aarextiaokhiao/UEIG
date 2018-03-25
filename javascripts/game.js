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
var player={version:0.1,
	build:1,
	playtime:0,
	points:new Decimal(10),
	totalPoints:new Decimal(0),
	generatorsBought:[0,0,0,0,0,0,0,0,0],
	upgrades:[],
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
var tab='generators'
var tabDisplayed=tab
var costs={gens:[],upgrades:[1e10],energy:0}
var generatorRates=[]
var pointsPerSecond=0
var pointsPerTick=0
var unpoweredEnergy=0

function init() {
	updateCosts()
	
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
			generatorRates[tier-1]=getGenMult(tier)
			pointsPerSecond=pointsPerSecond.add(generatorRates[tier-1])
		}
		pointsPerTick=pointsPerSecond.times(diff)
		
		player.points=player.points.add(pointsPerTick)
		player.totalPoints=player.totalPoints.add(pointsPerTick)
	}
	player.lastTick=currentTime
	
	updateElement('points',format(player.points)+' points')
	updateElement('pointsRate',format(pointsPerSecond)+'/s')
	
	if (tab!=tabDisplayed) {
		showElement(tab,'block')
		hideElement(tabDisplayed)
		tabDisplayed=tab
	}
	if (tab=='generators') {
		for (var tier=1;tier<9;tier++) {
			if (tier==1?true:player.generatorsBought[tier-2]>0) {
				showElement('gen'+tier,'inline-block')
				updateElement('gen'+tier+'stuff','x'+player.generatorsBought[tier-1]+'<br>'+format(generatorRates[tier-1])+'/s<br>Cost: '+format(costs.gens[tier-1]))
				if (player.points.gte(costs.gens[tier-1])) {
					updateClass('gen'+tier,'shopButton')
				} else {
					updateClass('gen'+tier,'shopButton unboughtable')
				}
			} else {
				hideElement('gen'+tier)
			}
		}
		if (player.generatorsBought[7]>0) {
			hideElement('unlock1')
			showElement('upgrades','block')
			for (var id=1;id<2;id++) {
				if (player.upgrades.includes(id)) {
					updateClass('upg'+id,'shopButton bought')
				} else if (player.points.gte(costs.upgrades[id-1])) {
					updateClass('upg'+id,'shopButton')
				} else {
					updateClass('upg'+id,'shopButton unboughtable')
				}
			}
		} else {
			showElement('unlock1','block')
			hideElement('upgrades')
		}
		if (player.generatorsBought[7]>9) {
			hideElement('unlock2')
			showElement('energy','block')
		} else {
			showElement('unlock2','block')
			hideElement('energy')
		}
	}
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
		if (savefile.version<0.1) {
			//v0 build 1 is the first build!
			if (savefile.build<2) {
				if (savefile.points==0) savefile.points=10
				savefile.playtime=0
				savefile.energy={consumedPoints:0,
					amount:0,
					genPower:0,
					plasmaPower:0}
				savefile.updateRate=20
			}
			savefile.build=0
		}
		if (savefile.version<0.2) {
			if (savefile.build<1) {
				savefile.upgrades=[]
			}
		}

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
		updateCosts()
		hideElement('exportSave')
		
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
	if (tier==Infinity?confirm('If you reset, everything including the save will be lost and you have to start over! Are you sure to do that?'):true) {
		if (tier==Infinity) {
			//Hard reset
			player.playtime=0
			player.totalPoints=new Decimal(0)
			
			localStorage.clear('UEIG_save')
			save()
			
			hideElement('exportSave')
		}
		//Tier 1 reset
		player.points=new Decimal(0)
		player.generatorsBought=[0,0,0,0,0,0,0,0,0]
		updateCosts('gens')
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
	
function switchTab(tabName) {
	tab=tabName
}

//Game functions
function updateCosts(id='all') {
	if (id=='gens'||id=='all') {
		for (var tier=1;tier<9;tier++) {
			costs.gens[tier-1]=Decimal.mul(Math.pow(10,tier+(tier-1)/5),Decimal.pow(Math.pow(1.5,(tier+4)/5),player.generatorsBought[tier-1]))
		}
	}
}

function getGenMult(tier) {
	var mult=Decimal.pow(10,tier-1)
	if (Decimal.gt(player.generatorsBought[tier-1],10)) mult=mult.times(Decimal.pow(Math.pow(1.111111111111111111,player.upgrades.includes(1)?14/(tier+4):1),BigInteger.subtract(player.generatorsBought[tier-1],10)))
	return mult.times(player.generatorsBought[tier-1])
}

function buyGen(tier) {
	if (player.points.gte(costs.gens[tier-1])) {
		player.points=player.points.sub(costs.gens[tier-1])
		player.generatorsBought[tier-1]++
		updateCosts('gens')
	}
}

function buyUpg(id) {
	if (!player.upgrades.includes(id)) {
		if (player.points.gte(costs.upgrades[id-1])) {
			player.points=player.points.sub(costs.upgrades[id-1])
			player.upgrades.push(id)
		}
	}
}