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
var player={version:0.2,
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
	prestigesCount:[0],
	plasma:new Decimal(0),
	plasmaPlaytime:0,
	boosts:[new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0)],
	waitingToTransfer:[new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0)],
	currentChallenge:0,
	challengesCompleted:{},
	freeGeneratorsBought:0,
	notation:0,
	updateRate:20,
	lastTick:new Date().getTime()}
	
var gameLoopInterval
var tickspeed=0
var startTime
var ticked=true
var lastSave=0
var notationArray=['Scientific','Engineering','Standard','Logarithm']
var tab='generators'
var tabDisplayed=tab
var costs={gens:[],upgrades:[1e10,2e11,3e13,5e15,2e17,1e19,1e21,1e24],energy:0}
var upgradeRequirements=[1,4,9,14,18,22,25,32]
var generatorRates=[]
var pointsPerSecond=0
var pointsPerTick=0
var unpoweredEnergy=0
var plasmaGain=0

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
		player.plasmaPlaytime+=diff
		
		//Change the values!
		pointsPerSecond=new Decimal(0)
		for (var tier=1;tier<9;tier++) {
			generatorRates[tier-1]=getGenMult(tier)
			pointsPerSecond=pointsPerSecond.add(generatorRates[tier-1])
		}
		pointsPerTick=pointsPerSecond.times(diff)
		
		player.points=player.points.add(pointsPerTick)
		player.totalPoints=player.totalPoints.add(pointsPerTick)
		unpoweredEnergy=BigInteger.subtract(player.energy.amount,BigInteger.add(player.energy.genPower,player.energy.plasmaPower))
	}
	player.lastTick=currentTime
	
	updateElement('points',format(player.points)+' points')
	updateElement('pointsRate',format(pointsPerSecond)+'/s')
	
	if (tab!=tabDisplayed) {
		showElement(tab,'block')
		hideElement(tabDisplayed)
		tabDisplayed=tab
	}
	if (Decimal.gt(player.generatorsBought[7],49)||player.prestigesCount[0]>0||player.plasma.gt(0)) {
		showElement('plasmaButton','table-cell')
	} else {
		hideElement('plasmaButton')
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
		if (Decimal.gt(player.generatorsBought[7],0)) {
			hideElement('unlock1')
			showElement('upgrades','block')
			for (var id=1;id<9;id++) {
				if (id==1?true:player.upgrades.includes(id-1)) {
					showElement('upg'+id,'inline-block')
					if (player.upgrades.includes(id)) {
						updateClass('upg'+id,'shopButton bought')
					} else if (player.points.gte(costs.upgrades[id-1])&&player.generatorsBought[7]>=upgradeRequirements[id-1]) {
						updateClass('upg'+id,'shopButton')
					} else {
						updateClass('upg'+id,'shopButton unboughtable')
					}
					updateElement('upg'+id+'cost','Cost: '+format(costs.upgrades[id-1])+'<br>(requires '+upgradeRequirements[id-1]+'x generator 8s)')
				} else {
					hideElement('upg'+id)
				}
			}
		} else {
			showElement('unlock1','block')
			hideElement('upgrades')
		}
		if (Decimal.gt(player.generatorsBought[7],37)) {
			hideElement('unlock2')
			showElement('energy','block')
			updateElement('energyAmount','You have '+format(player.energy.amount)+' energy, which '+format(BigInteger.subtract(player.energy.amount,BigInteger.add(player.energy.genPower,player.energy.plasmaPower)))+' are unpowered<br>Next at '+format(Decimal.pow(4,player.energy.amount).times(1e26))+' consumed points')
			updateElement('consumeAmount','Consumed: '+format(player.energy.consumedPoints))
			updateElement('genPower','Powered: '+format(player.energy.genPower))
			if (Decimal.gt(unpoweredEnergy,0)) {
				updateClass('energyGen','shopButton')
			} else {
				updateClass('energyGen','shopButton unboughtable')
			}
			if (Decimal.gt(player.generatorsBought[7],49)) {
				showElement('energyPlasma','inline-block')
				updateElement('plasmaPower','Powered: '+format(player.energy.plasmaPower))
				if (Decimal.gt(unpoweredEnergy,0)) {
					updateClass('energyPlasma','shopButton')
				} else {
					updateClass('energyPlasma','shopButton unboughtable')
				}
			} else {
				hideElement('energyPlasma')
			}
		} else {
			showElement('unlock2','block')
			hideElement('energy')
		}
		if (Decimal.gt(player.generatorsBought[7],37)&&Decimal.lt(player.generatorsBought[7],50)) {
			showElement('unlockLayer1','block')
		} else {
			hideElement('unlockLayer1')
		}
	}
	if (tab=='plasma') {
		updateElement('plasmaGain','You will gain '+format(plasmaGain)+' plasma')
	}
	if (tab=='options') {
		updateElement('notation',notationArray[player.notation]+' notation')
		updateElement('updateRate','Update rate:<br>'+(player.updateRate==Number.MAX_VALUE?'Unlimited':player.updateRate+'/s'))
	}
	if (tab=='statistics') {
		updateElement('statPlaytime',Math.floor(player.playtime)+'s')
		if (player.totalPoints.gt(0)) {
			showElement('statTotalRow','table-row')
			updateElement('statTotal',format(player.totalPoints))
		} else {
			hideElement('statTotalRow')
		}
		if (player.energy.consumedPoints.gt(0)) {
			showElement('statConsumeRow','table-row')
			updateElement('statConsume',format(player.energy.consumedPoints))
		} else {
			hideElement('statConsumeRow')
		}
		if (player.prestigesCount[0]>0||player.plasma.gt(0)) {
			showElement('statPlasmaCountRow','table-row')
			showElement('statPlasmaPlaytimeRow','table-row')
			updateElement('statPlasmaCount',player.prestigesCount[0]+'x')
			updateElement('statPlasmaPlaytime',Math.floor(player.plasmaPlaytime)+'s')
		} else {
			hideElement('statPlasmaCountRow')
			hideElement('statPlasmaPlaytimeRow')
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
			if (savefile.build<2) {
				savefile.notation=0
			}
			savefile.build=0
		}
		if (savefile.version<0.3) {
			if (savefile.build<1) {
				savefile.prestigesCount=[0],
				savefile.plasma=0
				savefile.plasmaPlaytime=savefile.playtime
				savefile.boosts=[0,0,0,0,0,0]
				savefile.waitingToTransfer=[0,0,0,0,0,0]
				savefile.currentChallenge=0
				savefile.challengesCompleted={}
				savefile.freeGeneratorsBought=0
			}
		}

		//Turn string to Decimal on some values
		savefile.points=new Decimal(savefile.points)
		savefile.totalPoints=new Decimal(savefile.totalPoints)
		savefile.energy.consumedPoints=new Decimal(savefile.energy.consumedPoints)
		savefile.plasma=new Decimal(savefile.plasma)
		for (var tier=1;tier<9;tier++) {
			savefile.generatorsBought[tier-1]=turnIntoBigInt(savefile.generatorsBought[tier-1])
		}
		for (var id=0;id<6;id++) {
			savefile.boosts[id]=new Decimal(savefile.boosts[id])
			savefile.waitingToTransfer[id]=new Decimal(savefile.waitingToTransfer[id])
		}

		//Turn string to BigInteger on some values
		savefile.energy.amount=turnIntoBigInt(savefile.energy.amount)
		savefile.energy.genPower=turnIntoBigInt(savefile.energy.genPower)
		savefile.energy.plasmaPower=turnIntoBigInt(savefile.energy.plasmaPower)
		savefile.freeGeneratorsBought=turnIntoBigInt(savefile.freeGeneratorsBought)
		
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
		updatePlasmaGain()
		
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

function reset(tier,challid=0) {
		
		if (tier==Infinity) {
			//Hard reset
			if (!confirm('If you reset, everything including the save will be lost and you have to start over! Are you sure to do that?')) return
			
			player.playtime=0
			player.totalPoints=new Decimal(0)
			player.notation=0
			player.updateRate=20
			
			localStorage.clear('UEIG_save')
			save()
			
			hideElement('exportSave')
		}
		if (tier>2) {
			//Tier 2 reset
			player.boosts=[new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0)]
			player.waitingToTransfer=[new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0)]
		}
		//Plasma reset
		if (tier==1&&challid>0) if (!confirm('You have to reach the specified goal before the boost will be stronger. You will not gain plasma if you start the challenge.')) return
		
		player.points=new Decimal(10)
		player.generatorsBought=[0,0,0,0,0,0,0,0,0]
		player.upgrades=[]
		player.energy={consumedPoints:new Decimal(0),
			amount:0,
			genPower:0,
			plasmaPower:0}
		updateCosts('gens')
		
		player.prestigesCount[0]=(tier==1)?((challid==0)?player.prestigesCount[0]+1:player.prestigesCount[0]):0
		player.plasma=(tier==1)?((challid==0)?player.plasma.add(plasmaGain):player.plasma):new Decimal(0)
		player.plasmaPlaytime=0
		player.currentChallenge=0
		player.challengesCompleted={}
		player.freeGeneratorsBought=0
		updatePlasmaGain()
}

function checkToReset(tier) {
	if (tier==1&&Decimal.gt(player.generatorsBought[7],49)) reset(1)
}

function format(value) {
	if (!(value instanceof Decimal)) value=new Decimal(value)
		
	var mantissa
	if (value.lt(1e3)) {
		mantissa=value.toFixed(0)
		if (parseFloat(mantissa)!=1e3) return mantissa
	}
	if (player.notation==0) {
		//Scientific
		var unencoded=format1OoMGroup(value)
		if (Decimal.gte(unencoded.exponent,1e5)) {
			var unencodedExp=format1OoMGroup(new Decimal(unencoded.exponent))
			return unencoded.mantissa.toFixed(2)+'e'+unencodedExp.mantissa.toFixed(2)+'e'+unencodedExp.exponent
		}
		return unencoded.mantissa.toFixed(2)+'e'+unencoded.exponent
	} else if (player.notation==1) {
		//Engineering
		var unencoded=format3OoMGroup(value)
		if (Decimal.gte(unencoded.group,3333.3)) {
			var unencodedExp=format3OoMGroup(Decimal.times(unencoded.group,3))
			return unencoded.mantissa.toFixed(2-unencoded.offset)+'e'+unencodedExp.mantissa.toFixed(2-unencodedExp.offset)+'e'+unencodedExp.group*3
		}
		return unencoded.mantissa.toFixed(2-unencoded.offset)+'e'+unencoded.group*3
	} else if (player.notation==2) {
		//Standard
		var unencoded=format3OoMGroup(value)
		return unencoded.mantissa.toFixed(2-unencoded.offset)+standard(unencoded.group)
	} else if (player.notation==3) {
		//Logarithm
		var log=value.log10()
		if (Decimal.gte(log,99999.995)) {
			return 'ee'+Decimal.log10(log).toFixed(2)
		}
		return 'e'+log.toFixed(2)
	}
	return '?'
}

function format1OoMGroup(value) {
	var mantissa=Math.round(value.mantissa*100)/100
	var exponent=value.exponent
	if (mantissa==10) {
		mantissa=1
		exponent=BigInteger.add(exponent,1)
	}
	return {mantissa:mantissa,exponent:exponent}
}

function format3OoMGroup(value) {
	var mantissa=Math.round(value.mantissa*100)/100
	var exponent=value.exponent
	if (mantissa==10) {
		mantissa=1
		exponent=BigInteger.add(exponent,1)
	}
	var result={offset:BigInteger.remainder(exponent,3)}
	result.mantissa=mantissa*Math.pow(10,result.offset)
	if (Decimal.gt(exponent,9007199254740992/3)) {
		result.group=Decimal.div(exponent,3)
	} else {
		result.group=Math.floor(exponent/3)
	}
	return result
}

function standard(group) {
	if (typeof(group)=='number') {
		if (group==1) return 'k'
		if (group==2) return 'M'
		group--
	}
	var units=['','U','D','T','Q','Qi','S','Sp','O','N']
	var tens=['','D','V','T','Q','Qi','S','Sp','O','N']
	var hundreds=['','C','Dn','Tn','Qn','Qin','Sn','Spn','On','Nn']
	
	step=0
	if (typeof(group)!='number'||Decimal.gte(group,1e12)) {
		step=Math.floor(Decimal.log(group,1000)-3)
		group=Math.floor(Decimal.div(group,Decimal.pow(1000,step)).toNumber())
	}
	abb=''
	abbFull=(step==0)?'':'<span style="font-size:75%">...(+'+step+')</span>'
	
	do {
		var u=Math.floor(group)%10
		var t=Math.floor(group/10)%10
		var h=Math.floor(group/100)%10
		
		abb=units[u]
		if (u==2&&t==0) abb='B'
		abb=abb+tens[t]
		if (u==0&&t>1) {
			abb=abb+'g'
		}
		abb=abb+hundreds[h]
		highAbb=tier2(step)
		if (u>0||t>0||h>0) {
			if (abbFull=='') {
				abbFull=abb+highAbb+abbFull
			} else {
				abbFull=abb+highAbb+'-'+abbFull
			}
		}
		group=group/1000
		step++
	} while (group>0)
	
	return abbFull
}

function tier2(step) {
	var haListB = ['','MI','MC','NA','PC','FM','AT','ZP','YC','XN','WC','VN','UA']
	var haListS = ['','u','d','t','q','p','x','h','o','n',
	'da','ud','dd','td','qd','pd','xd','hd','od','nd',
	'vg','uc','dv','tc','qv','pc','xc','hc','oc','nc',
	'ta','ut','dt','tt','qt','pt','xt','ht','ot','nt',
	'sa','us','ds','ts','qs','ps','xs','hs','os','ns',
	'pa','up','dp','tp','qp','pp','xp','hp','op','np',
	'xa','ux','dx','tx','qx','px','xx','hx','ox','nx',
	'ha','uh','dh','th','qh','ph','xh','hh','oh','nh',
	'oa','uo','do','to','qo','po','xo','ho','oo','no',
	'na','un','dn','tn','qn','pn','xn','hn','on','nn']
	abb2=haListS[step%100]
	var ha=''
	
	if (step==0) {
		return ''
	}
	if (haListB[step]) {
		return haListB[step]
	}
	if (step>99) {
		if (step<200) {
			ha = 'c'
		} else {
			ha = haListS[Math.floor(step/100)%100]
			var ha2=''
			if (step>9999) {
				if (step<20000) {
					ha2 = 'c'
				} else {
					ha2 = haListS[Math.floor(step/10000)]
				}
				if (step%10000<1000) {
					ha2 = 'e'+ha2
				}
			}
			ha = ha+ha2
		}
		if (step%100<10) {
			ha = 'e'+ha
		}
	}
	return abb2+ha
}

function switchNotation() {
	player.notation++
	if (player.notation==notationArray.length) player.notation=0
}

function switchUpdateRate() {
	clearInterval(gameLoopInterval)
	player.updateRate+=5
	if (player.updateRate==Number.MAX_VALUE) player.updateRate=5
	if (player.updateRate==65) player.updateRate=Number.MAX_VALUE
	gameLoopInterval=setInterval(gameLoop,1000/player.updateRate)
}
	
function switchTab(tabName) {
	tab=tabName
}

function turnIntoBigInt(num) {
	if (typeof(num)=='object') {
		if (Decimal.gt(num,9007199254740992)) {
			return BigInteger.parseInt(num)
		} else {
			var parsed=BigInteger.parseInt(num)
			if (BigInteger.compareTo(parsed,9007199254740992)>0) return parsed
		}
	}
	return num
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
	
	var totalAmountUpg4=player.generatorsBought[tier-1]
	if (player.upgrades.includes(4)) totalAmountUpg4=BigInteger.add(totalAmountUpg4,10)
	
	if (player.upgrades.includes(1)) mult=mult.times(Decimal.pow(Math.pow(10/9,(tier+4)/5),totalAmountUpg4))
	else if (Decimal.gt(totalAmountUpg4,10)) mult=mult.times(Decimal.pow(10/9,BigInteger.subtract(totalAmountUpg4,10)))
	if (player.upgrades.includes(2)) mult=mult.times(Decimal.pow(1.01,BigInteger.add(BigInteger.add(BigInteger.add(BigInteger.add(BigInteger.add(BigInteger.add(BigInteger.add(player.generatorsBought[0],player.generatorsBought[2]),player.generatorsBought[3]),player.generatorsBought[1]),player.generatorsBought[4]),player.generatorsBought[5]),player.generatorsBought[6]),player.generatorsBought[7])))
	if (player.upgrades.includes(3)) mult=mult.times(player.totalPoints.pow(0.1))
	if (player.upgrades.includes(5)) mult=mult.times(Decimal.pow(10/9,player.generatorsBought[tier-1]))
	if (player.upgrades.includes(6)) mult=mult.times(5)
	if (player.upgrades.includes(7)) mult=mult.times(Math.sqrt(1+Math.log10(1+player.playtime)/Math.log10(2)))
	if (player.upgrades.includes(8)) mult=mult.times(Decimal.mul(new Decimal(mult.log10()),0.4342944819032518))
	mult=mult.times(Decimal.pow(Math.pow(4,0.2),player.energy.genPower))
	return mult.times(player.generatorsBought[tier-1])
}

function buyGen(tier) {
	if (player.points.gte(costs.gens[tier-1])) {
		player.points=player.points.sub(costs.gens[tier-1])
		player.generatorsBought[tier-1]=BigInteger.add(player.generatorsBought[tier-1],1)
		updateCosts('gens')
		
		if (tier==8) updatePlasmaGain()
	}
}

function buyUpg(id) {
	if (!player.upgrades.includes(id)&&player.generatorsBought[7]>=upgradeRequirements[id-1]) {
		if (player.points.gte(costs.upgrades[id-1])) {
			player.points=player.points.sub(costs.upgrades[id-1])
			player.upgrades.push(id)
		}
	}
}

function consumePoints() {
	var amount=player.points.div(2)
	player.points=player.points.sub(amount)
	player.energy.consumedPoints=player.energy.consumedPoints.add(amount)
	player.energy.amount=player.energy.consumedPoints.div(1e25).log(4)
	if (typeof(player.energy.amount)=='number') player.energy.amount=Math.floor(player.energy.amount)
	if (Decimal.lt(player.energy.amount,0)) player.energy.amount=0
}

function powerEnergy(id) {
	if (Decimal.gt(unpoweredEnergy,0)) {
		if (id==1) {
			player.energy.genPower=BigInteger.add(player.energy.genPower,1)
		} else {
			player.energy.plasmaPower=BigInteger.add(player.energy.plasmaPower,1)
			updatePlasmaGain()
		}
		unpoweredEnergy=BigInteger.subtract(unpoweredEnergy,1)
	}
}

function updatePlasmaGain() {
	if (Decimal.lt(player.generatorsBought[7],50)) plasmaGain=new Decimal(0)
	else plasmaGain=new Decimal(1)
}