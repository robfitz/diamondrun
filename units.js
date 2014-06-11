goog.provide('diamondrun.Unit');

goog.require('lime.Sprite');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.MoveTo');

diamondrun.Unit = function(tile, movement, attack, hp) {
	goog.base(this);
	
	this.tile = tile;
	this.attack = attack;
	this.hp = hp;
	this.maxHp = hp;

	this.setSize(CARD_SIZE, CARD_SIZE).setFill(0,255,150);

	this.movement = movement;
	this.type = "unit";
}

goog.inherits(diamondrun.Unit, lime.Sprite);

diamondrun.Unit.prototype.doAttack = function(contexts, callbacks) {
	console.log('attacking ' + this);
	//get my walky path
	var path = this.tile.getAttackPath();

	var animations = [];
	var startPosition = this.getPosition();

	//step through path looking for obstruction)
	for (var i = 0; i < path.length; i ++) {
		var screenPosition = path[i].getParent().localToScreen(path[i].getPosition());
		var localPosition = this.tile.screenToLocal(screenPosition);

		animations.push(new lime.animation.MoveTo(localPosition).setDuration(.3));

		//nothing blocking? add move
		//something blocking? fight it
			//break
	}
	//if still alive, step backwards to return to start point
	for (i = path.length - 1; i >= 0; i --) {
		var screenPosition = path[i].getParent().localToScreen(path[i].getPosition());
		var localPosition = this.tile.screenToLocal(screenPosition);

		animations.push(new lime.animation.MoveTo(localPosition).setDuration(.2));
	}
	animations.push(new lime.animation.MoveTo(startPosition).setDuration(.2));

	var duration = 0;
	for (i = 0; i < animations.length; i ++) {
		duration += animations[i].getDuration();
	}

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