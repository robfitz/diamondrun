goog.provide('diamondrun.CardView');

goog.require('lime.Layer');
goog.require('lime.Sprite');
goog.require('lime.Label');

goog.require('lime.fill.Stroke');
goog.require('lime.fill.Color');


diamondrun.CardView = function() {

	goog.base(this);

    this.setPosition(-IPHONE_4_W, 0);
    this.bg = new lime.Sprite().setSize(IPHONE_4_W, IPHONE_4_H).setFill(0, 0, 0, 0.5).setAnchorPoint(0, 0);
    this.cardbg = new lime.Sprite().setSize(IPHONE_4_W - 100, IPHONE_4_H - 100).setFill(255, 255, 255, 1).setPosition(IPHONE_4_W/2, IPHONE_4_H/2);//
    //.setStroke(new lime.fill.Stroke(20, new lime.fill.Color(0, 0, 0)));

    this.name = new lime.Label().setPosition(IPHONE_4_W/2, IPHONE_4_H/3).setFontSize(72);
    this.description = new lime.Label().setPosition(IPHONE_4_W/2, 2*IPHONE_4_H/3).setFontSize(24);

    this.appendChild(this.bg).appendChild(this.cardbg).appendChild(this.name);
    this.appendChild(this.description);

    goog.events.listen(this, ['click'], function(e) {
   		this.setPosition(-IPHONE_4_W, 0);
   		 e.event.stopPropagation();
   	});
    
};

goog.inherits(diamondrun.CardView, lime.Layer);

diamondrun.CardView.prototype.show = function(card) {
	console.log('show cardview');

	this.name.setText(card.name);
	this.description.setText(card.description());
	this.setPosition(0, 0);

};