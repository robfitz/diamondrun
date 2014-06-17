goog.provide('diamondrun.Effect');

goog.require('lime.Sprite');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.RotateBy');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.FadeTo');


diamondrun.Effect = function(owner, tile, type, strength) {
    goog.base(this);
    
    this.owner = owner;
    this.tile = tile;
    this.type = type;
    this.strength = strength;

    this.setSize(CARD_SIZE - CARD_SPACING * 1, CARD_SIZE - CARD_SPACING * 1).setFill(200,10,0);

    this.type = "effect";

    this.draw();
    game.effectLayer.appendChild(this);
};

goog.inherits(diamondrun.Effect, lime.Label);

diamondrun.Effect.prototype.damage = function(unit) {
    if (unit && unit.type == 'unit') {
        unit.takeDamage(this.strength);
    }
};

diamondrun.Effect.prototype.draw = function() {
    var label = this.strength;
    this.setText(label);
};

diamondrun.Effect.prototype.activate = function(contexts, callbacks) {
    this.damage(this.tile.contents);
    
    //Activate Effect
    var actEffect = new lime.animation.Spawn(
        new lime.animation.ScaleTo(.1),
        new lime.animation.FadeTo(0),
        new lime.animation.RotateBy(0)
    ).setDuration(0.4);
    
    this.runAction(actEffect);
    
    var self = this;
    
    // once the animation is complete.
    goog.events.listen(actEffect,lime.animation.Event.STOP,function(){
        // remove from board
        self.getParent().removeChild(self);;
    
        // Resume callback chain
        if (callbacks && callbacks.length > 0) {
            var firstCall = callbacks.shift();
            var firstContext = contexts.shift();
            firstCall.call(firstContext, contexts, callbacks);
        }
        else {
            Commands.add(new diamondrun.NextPhaseCommand());
        }
    });
};
