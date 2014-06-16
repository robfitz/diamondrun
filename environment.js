goog.provide('diamondrun.Rubble');

goog.require('lime.Sprite');
goog.require('lime.Label');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.MoveTo');
goog.require('lime.animation.RotateBy');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.FadeTo');


diamondrun.Rubble = function(tile, turnsActive) {
    goog.base(this);
	
    this.tile = tile;
    this.turnsActive = turnsActive;

    this.setSize(CARD_SIZE - CARD_SPACING * 1, CARD_SIZE - CARD_SPACING * 1).setFill(200,200,200);
    this.redraw();
	
    this.type = "rubble";
	
    game.rubbleLayer.appendChild(this);
}

goog.inherits(diamondrun.Rubble, lime.Label);

diamondrun.Rubble.prototype.redraw = function() {
    this.setText('Rubble: ' + this.turnsActive + " turns left");
}

diamondrun.Rubble.prototype.breakdown = function() {
    //removal effect
    this.redraw();
    
    var dieEffect = new lime.animation.Spawn(
        new lime.animation.FadeTo(0),
        new lime.animation.RotateBy(90)
    ).setDuration(0.4);
    this.runAction(dieEffect);
    
    var self = this;
    goog.events.listen(dieEffect,lime.animation.Event.STOP,function(){
        //remove from board
        self.tile.removeRubble(self);
        self.getParent().removeChild(self);
    });
}

diamondrun.Rubble.prototype.startTurn = function() {

}

diamondrun.Rubble.prototype.endTurn = function() {
    if(!--this.turnsActive) this.breakdown(); // Breakdown rubble if it is no longer active
}
