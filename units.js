goog.provide('diamondrun.Unit');

goog.require('lime.Sprite');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.MoveTo');

diamondrun.Unit = function(tile, attack, hp) {
	goog.base(this);
	
	this.tile = tile;
	this.attack = attack;
	this.hp = hp;
	this.maxHp = hp;

	this.setSize(CARD_SIZE, CARD_SIZE).setFill(0,255,150);
}

goog.inherits(diamondrun.Unit, lime.Sprite);

