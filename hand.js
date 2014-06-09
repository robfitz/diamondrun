goog.provide('diamondrun.Hand');
goog.provide('diamondrun.Deck');
goog.provide('diamondrun.Card');

goog.require('lime.Sprite');
goog.require('lime.Layer');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.MoveTo');
goog.require('lime.animation.ScaleTo');

var CARD_SIZE = 100;
var CARD_SPACING = 5;


diamondrun.Card = function(friendly_board, enemy_board) {
	goog.base(this);

	this.friendly_board = friendly_board;
	this.enemy_board = enemy_board;

	this.setSize(CARD_SIZE, CARD_SIZE).setFill(255,150,150);

	goog.events.listen(this,['mousedown','touchstart'],function(e){

        //prepare to return to original position
		var start_loc = this.getPosition();
		//follow mouse/finger
        var drag = e.startDrag();
        e.event.stopPropagation();

        //add valid drop targets
        var drop_targets = this.getValidTargets();
        for (var i = 0; i < drop_targets.length; i ++) {
        	drag.addDropTarget(drop_targets[i]);
        }

      	goog.events.listen(drag, lime.events.Drag.Event.DROP, function(e){
	      var dropTarget = e.activeDropTarget;
	      dropTarget.runAction(new lime.animation.Sequence(
	        new lime.animation.ScaleTo(1.2).setDuration(.3),
	        new lime.animation.ScaleTo(1).setDuration(.3)
	      ));
	      /*
	      e.moveEndedCallback = function(){
	        console.log('Called after animation has ended');
	      }
	      */
    	});

        //listen for end event
        e.swallow(['mouseup','touchend'],function(){
            this.runAction(new lime.animation.MoveTo(start_loc).setDuration(0.2));
        });
    });
}

goog.inherits(diamondrun.Card, lime.Sprite);

diamondrun.Card.prototype.getValidTargets = function() {
	return this.friendly_board.getTiles();
};


diamondrun.Hand = function(deck) {
	goog.base(this);
	this.deck = deck;
	this.cards = [];
}
goog.inherits(diamondrun.Hand, lime.Layer);

diamondrun.Hand.prototype.draw = function() {
	var card = this.deck.draw();
	this.cards.push(card);
	this.appendChild(card);

	//redraw cards
	var xoffset = - (this.cards.length - 1) * (CARD_SIZE + CARD_SPACING) / 2;
	for (var i = 0; i < this.cards.length; i ++) {
		this.cards[i].setPosition(xoffset + i * (CARD_SIZE + CARD_SPACING), 0);
	}
};

diamondrun.Deck = function(friendly_board, enemy_board) {
	goog.base(this);
	this.friendly_board = friendly_board;
	this.enemy_board = enemy_board;
}
goog.inherits(diamondrun.Deck, lime.Layer);

diamondrun.Deck.prototype.draw = function() {
	return new diamondrun.Card(this.friendly_board, this.enemy_board);
};

