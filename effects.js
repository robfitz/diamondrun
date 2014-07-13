goog.provide('diamondrun.Effect');

goog.require('lime.Sprite');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.RotateBy');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.FadeTo');

diamondrun.Effect = function(owner, name, targetType, damage, atkUp, hPUp, techUp, kill, rubble_duration) {
    goog.base(this);
    
    this.owner = owner;
    this.name = name;
    this.targetType = targetType;
    this.damage = damage;
    this.atkUp = atkUp;
    this.hPUp = hPUp;
    this.techUp = techUp;
    this.kill = kill;
    this.rubble_duration;

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
    // Deal Damage
    if(this.tile) this.damageTarget(this.tile.contents);
    this.owner.techLevel += this.techUp;
    
    this.owner.getBoard().techTile.label.setText(++this.owner.getBoard().techTile.techLevel);
    
    // Activate Effect animation
    /*
    var actEffect = new lime.animation.Spawn(
        new lime.animation.ScaleTo(.1),
        new lime.animation.FadeTo(0),
        new lime.animation.RotateBy(0)
    ).setDuration(0.5);

    this.runAction(actEffect);
    
    
    var self = this;
    
    // once the animation is complete.
    goog.events.listen(actEffect,lime.animation.Event.STOP,function(){
        // remove from board
        self.getParent().removeChild(self);
        
        Commands.add(new diamondrun.NextPhaseCommand());
    });
*/
    this.getParent().removeChild(this);
    window.clearTimeout(this.owner.turnTimer);
};
