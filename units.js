goog.provide('diamondrun.Unit');

goog.require('lime.Sprite');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.MoveTo');
goog.require('lime.animation.RotateBy');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.FadeTo');


diamondrun.Unit = function(owner, tile, movement, attack, hp) {
	goog.base(this);
	
	this.owner = owner;
	this.tile = tile;
	this.attack = attack;
	this.hp = hp;
	this.maxHp = hp;

	this.setSize(CARD_SIZE - CARD_SPACING * 1, CARD_SIZE - CARD_SPACING * 1).setFill(0,255,150);

	this.movement = movement;
    if (this.movement == 'jumper') this.jumps = 2;    
	this.type = "unit";
	this.isSSick = true;

	this.redraw();
	game.unitLayer.appendChild(this);
}

goog.inherits(diamondrun.Unit, lime.Label);

diamondrun.Unit.prototype.heal = function() {
	this.hp = this.maxHp;
	this.redraw();
}

diamondrun.Unit.prototype.redraw = function() {
	var label = this.attack + '/' + this.maxHp;
	if (this.hp < this.maxHp) {
		var missing = this.maxHp - this.hp;
		label += ' - ' + missing;
	}
	if (this.isSSick) label += ' (' + this.movement + ')';
	else label += ' ' + this.movement;
	this.setText(label);
}

diamondrun.Unit.prototype.takeDamage = function(damage) {
	this.hp -= damage;
	if (this.hp <= 0) {
		this.die();
	}
	this.redraw();
}

diamondrun.Unit.prototype.die = function() {

	//death effect
	var dieEffect = new lime.animation.Spawn(
	    new lime.animation.ScaleTo(5),
	    new lime.animation.FadeTo(0),
		new lime.animation.RotateBy(90)
	).setDuration(0.4);
	
	this.runAction(dieEffect);
	
	var self = this;
	var rubbleTile = this.tile
	
	goog.events.listen(dieEffect,lime.animation.Event.STOP,function(){
    	//remove from board
		self.tile.removeUnit(self);
		self.getParent().removeChild(self);
		var rubble = new diamondrun.Rubble(rubbleTile, 1);
		rubbleTile.addRubble(rubble)
	});
}

diamondrun.Unit.prototype.doAttack = function(contexts, callbacks) {
	
	var path = this.tile.getAttackPath();

	var animations = [];
	var startPosition = this.getPosition();
	var localPosition = this.getPosition();

	var duration = 0;
	var self = this;

	// Check to see if the unit has Summoning Sickness
	if (this.isSSick) {
		if (callbacks && callbacks.length > 0) {
			var firstCall = callbacks.shift();
			var firstContext = contexts.shift();
			firstCall.call(firstContext, contexts, callbacks);
		}
		else {
			Commands.add(new diamondrun.NextPhaseCommand());
		}
		return;
	}

		
	//step through path looking for obstruction)
	var turnBack = false;
	for (var i = 0; i < path.length; i ++) {

		lastPosition = localPosition;

		var screenPosition = path[i].getParent().localToScreen(path[i].getPosition());
		var localPosition = this.getParent().screenToLocal(screenPosition);

		var action = this.canMoveToTile(i, path[i]);

		//nothing blocking? add move
		switch (action) {
			case 'move':
				animations.push(new lime.animation.MoveTo(localPosition).setDuration(.3));
				duration += 0.3;
				break;
			case 'fight':
				var contents = path[i].contents;
		
				var bumpY = (lastPosition.y + localPosition.y) / 2;
				var bumpX = (lastPosition.x + localPosition.x) / 2;
				animations.push(new lime.animation.MoveTo(bumpX, bumpY).setDuration(.1));
				
				lime.scheduleManager.callAfter(function(dt) {	
					contents.takeDamage(self.attack);
				}, null, duration*1000);
				duration += 0.1;
				turnBack = true;
				break;
			case 'collide':
				var bumpY = (lastPosition.y + localPosition.y) / 2;
				animations.push(new lime.animation.MoveTo(lastPosition.x, bumpY).setDuration(.1));
				duration += 0.1;
				turnBack = true;
				break;
		}
		if (turnBack) break;
	}
    
	//if still alive, step backwards to return to start point
	for (i = i - 1; i >= 0; i --) {
		var screenPosition = path[i].getParent().localToScreen(path[i].getPosition());
		var localPosition = this.getParent().screenToLocal(screenPosition);

		animations.push(new lime.animation.MoveTo(localPosition).setDuration(.2));
		duration += 0.2;
	}
	animations.push(new lime.animation.MoveTo(startPosition).setDuration(.2));
	duration += 0.2;

	//TODO: i'm sure i'm going to regret this callback chain
	//sometime soon, but i haven't yet figured out a
	//better way to get the animations and phase advance
	//to happen sequentially
	lime.scheduleManager.callAfter(function(dt) {
		if (callbacks && callbacks.length > 0) {
			var firstCall = callbacks.shift();
			var firstContext = contexts.shift();
			firstCall.call(firstContext, contexts, callbacks);
		}
		else {
			Commands.add(new diamondrun.NextPhaseCommand());
		}
	}, null, duration*1000);

	this.runAction(new lime.animation.Sequence(animations));

}

//returns 'move', 'collide', or 'fight'
diamondrun.Unit.prototype.canMoveToTile = function(stepNum, tile) {
	var contents = tile.contents;

	switch(this.movement) {
		case 'melee':
			if (!contents || contents.type == 'rubble') {
				return 'move';
			}
			else if (contents.type == 'unit') {
				if (contents.owner == this.owner) return 'collide';
				else return 'fight';
			}
			break;
		case 'shooter':
			if (!contents || contents.type == 'rubble') {
				return 'move';
			}
			else if (contents.type == 'unit') {
				if (contents.owner == this.owner) return 'move';
				else return 'fight';
			}
			break;
        case 'jumper':
            if (this.jumps-- > 0) { //Have to positive check because neg. ints are evaluated true as well
                return 'move';
            }
            else if (!contents || contents.type == 'rubble') {
				return 'move';
			}
			else if (contents.type == 'unit') {
				if (contents.owner == this.owner) return 'collide';
				else return 'fight';
			}
			break;
		default:
			console.log('WARNING: unknown movement type in Unit.canMoveToTile');
			return 'collide';
	}	
}

diamondrun.Unit.prototype.startTurn = function() {
	this.heal();
}

diamondrun.Unit.prototype.endTurn = function() {
	this.isSSick = false;
	this.redraw();
    
    // Reset Movement variables
    if (this.movement == 'jumper') this.jumps = 2;
}
