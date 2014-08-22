goog.provide('diamondrun.Effect');

goog.require('lime.Sprite');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.RotateBy');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.FadeTo');

diamondrun.Effect = function(owner, name, turns, targetType, damage, atkUp, hPUp, techUp, kill, rubble_duration) {
    goog.base(this);
    
    this.owner = owner;
    this.name = name;
	this.turnsActive = turns;
    this.targetType = targetType;
    this.damage = damage;
    this.atkUp = parseInt(atkUp);
    this.hPUp = parseInt(hPUp);
    this.techUp = parseInt(techUp);
    this.kill = kill;
    this.rubble_duration = rubble_duration;

    this.setSize(CARD_SIZE - CARD_SPACING * 1, CARD_SIZE - CARD_SPACING * 1).setFill(200,10,0);
};

goog.inherits(diamondrun.Effect, lime.Label);

diamondrun.Effect.prototype.play = function(targetTile) {
    
    this.tile = targetTile;
    this.draw();
    game.effectLayer.appendChild(this);
};

diamondrun.Effect.prototype.damageTarget = function(unit) {
    if (unit && unit.type == 'unit') {
        unit.takeDamage(this.damage, true);
    }
};

diamondrun.Effect.prototype.draw = function() {
    var label = this.damage;
    this.setText(label);
};

diamondrun.Effect.prototype.activate = function() {
    // Activate Effect animation
    var actEffect = new lime.animation.Spawn(
        new lime.animation.ScaleTo(.1),
        new lime.animation.FadeTo(0),
        new lime.animation.RotateBy(0)
    ).setDuration(0.5);

    this.runAction(actEffect);
    var self = this;
    
    // once the animation is complete.
    goog.events.listen(actEffect,lime.animation.Event.STOP,function(){
        // Deal Damage to target
        if(self.tile && self.tile.contents) self.damageTarget(self.tile.contents);
        
        // Change tech level of player
        self.owner.techLevel += self.techUp;
        self.owner.getBoard().techTile.label.setText(self.owner.techLevel);
        
        // Add rubble to target tile
        if (self.rubble_duration > 0) self.tile.addRubble(new diamondrun.Rubble(self.tile, self.rubble_duration));
        
        // Increase target's attack
        if (self.atkUp > 0 && self.tile && self.tile.contents) self.tile.contents.attack += self.atkUp;
        
        // Increase HP of target unit
        if (self.hPUp > 0 && self.tile && self.tile.contents) self.tile.contents.hp += self.hPUp;
        if (self.tile.contents) self.tile.contents.redraw();
        
          
        // If this effect lasts for one turn destroy it now.
        if (self.turnsActive == 0) {
            if (self.getParent()) self.getParent().removeChild(self);
            window.clearTimeout(self.owner.turnTimer);
        }
        else {
            self.owner.activeEffects.push(self);
            self.setHidden(self);
        }
    });   
};

diamondrun.Effect.prototype.startTurn = function() {
	if (--this.turnsActive <= 0) {
	
		if (this.atkUp > 0 && this.tile && this.tile.contents) this.tile.contents.attack -= this.atkUp;
		if (this.hPUp > 0 && this.tile && this.tile.contents) this.tile.contents.hp -= this.hPUp;
	
		if (this.getParent()) this.getParent().removeChild(this);
		window.clearTimeout(this.owner.turnTimer);
	}
};
