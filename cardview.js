goog.provide('diamondrun.CardView');

goog.require('lime.Layer');
goog.require('lime.Sprite');
goog.require('lime.Label');


diamondrun.CardView = function() {

	goog.base(this);

    this.setPosition(-IPHONE_4_W, 0);
    this.bg = new lime.Sprite().setSize(IPHONE_4_W, IPHONE_4_H).setFill(255, 255, 255, 0.5).setAnchorPoint(0, 0);

    this.name = new lime.Label().setPosition(IPHONE_4_W/2, IPHONE_4_H/3).setFontSize(72);

    this.appendChild(this.bg).appendChild(this.name);

    goog.events.listen(this, ['click', 'mousedown', 'startdrag'], function() {
   		this.setPosition(-IPHONE_4_W, 0);
   	});
    
};

goog.inherits(diamondrun.CardView, lime.Layer);

diamondrun.CardView.prototype.show = function(card) {
	console.log('show cardview');

	this.name.setText(card.name);
	this.setPosition(0, 0);

};