goog.provide('diamondrun.Hand');
goog.provide('diamondrun.Deck');
goog.provide('diamondrun.Card');
goog.provide('diamondrun.Graveyard');
goog.require('diamondrun.Unit');
goog.require('diamondrun.PlayCardCommand');

goog.require('lime.Sprite');
goog.require('lime.Layer');
goog.require('lime.Label');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.MoveTo');
goog.require('lime.animation.ScaleTo');

goog.require('goog.events.Event');

var CARD_SIZE = 100;
var CARD_SPACING = 5;


diamondrun.Card = function(owner, movement, attack, hp, type, castCost) {
    goog.base(this);
    this.owner = owner;
    this.type = type;

    // TODO: unit info should probably be in a database
    // or data file somewhere
    this.movement = movement;
    this.attack = attack;
    this.hp = hp;
    this.castCost = castCost;

    this.r = 255;
    this.g = 150;
    this.b = 150;

    if (this.type == 'unitCard') {
        this.setText(this.attack + '/' + this.hp + ' ' + this.movement + " Cost:" + castCost);
    }
    else if (this.type == 'burnCard') {
        this.setText("Direct Damage: " + this.attack + " Cost:" + castCost);
        this.g = 100;
        this.b = 100;
    }
    this.setSize(CARD_SIZE, CARD_SIZE).setFill(this.r, this.g, this.g, 0);

    //local declaration for when 'this' is clobbered by event objects
    var card = this; 

    var makeDraggable = function(e){

        //prepare to return to original position
        var start_loc = card.getPosition();
        //follow mouse/finger
        var drag = e.startDrag();
        e.event.stopPropagation();

        //add valid drop targets
        var drop_targets = card.owner.getBoard().getValidTargets(card);
        for (var i = 0; i < drop_targets.length; i ++) {
            drag.addDropTarget(drop_targets[i]);
        }

          goog.events.listen(drag, lime.events.Drag.Event.DROP, function(e){
            
            var tile = e.activeDropTarget;
            
            // Before playing a card, check: 1) Is it the players turn AND  2) [either a) the player has sufficient tech level OR b) is sacrificing for tech level]
            if (card.owner.getCanAct() == true && (card.owner.techLevel >= card.castCost || tile == card.owner.board.techTile)) {
                //create command
                card.owner.playCard(card, tile);

                //stop responding to drag events
                goog.events.unlisten(card,['mousedown','touchstart'], makeDraggable);

                tile.runAction(new lime.animation.Sequence(
                    new lime.animation.ScaleTo(1.2).setDuration(.3),
                    new lime.animation.ScaleTo(1).setDuration(.3)
                ));

                //block card from automatically dropping itself onto the board
                e.stopPropagation();
            }
            else {
                //if we aren't allowed to play a card right now, just go back to
                //the stating location in the hand
                card.runAction(new lime.animation.MoveTo(start_loc).setDuration(0.2));
            }
        });

        //listen for end event
        goog.events.listen(drag, lime.events.Drag.Event.CANCEL, function(e){
            card.runAction(new lime.animation.MoveTo(start_loc).setDuration(0.2));
        });
    };

    goog.events.listen(this,['mousedown','touchstart'],makeDraggable);

};

goog.inherits(diamondrun.Card, lime.Label);

diamondrun.Card.prototype.getOwner = function() {
    return this.owner;
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.Hand = function(owner) {
    goog.base(this);
    this.owner = owner;
    this.cards = [];
};

goog.inherits(diamondrun.Hand, lime.Layer);

diamondrun.Hand.prototype.removeCard = function(card) {
    for (var i = 0; i < this.cards.length; i ++) {
        if (this.cards[i] == card) {
            this.cards.remove(i);
            break;
        }
    }
    this.refreshCardLocations();
};

diamondrun.Hand.prototype.drawCard = function(drawNum) {
    var card = this.owner.getDeck().drawCard();
    this.cards.push(card);
    this.appendChild(card);

    card.runAction(new lime.animation.Sequence(
            new lime.animation.FadeTo(1).setDuration(drawNum*0.2),
            new lime.animation.Spawn(
                new lime.animation.ColorTo(card.r, card.g, card.b, 1),
                new lime.animation.ScaleTo(1.2)
            ).setDuration(0.2),
            new lime.animation.ScaleTo(1).setDuration(0.1)
        ));
};

diamondrun.Hand.prototype.refreshCardLocations = function() {
    var xoffset = - (this.cards.length - 1) * (CARD_SIZE + CARD_SPACING) / 2;

    for (var i = 0; i < this.cards.length; i ++) {
        this.cards[i].runAction(new lime.animation.MoveTo(xoffset + i * (CARD_SIZE + CARD_SPACING), 0).setDuration(0.2));
        
    }    
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.Deck = function(owner) {
    goog.base(this);
    this.owner = owner;

    this.cards = [];
    for (var i = 0; i < 5; i ++) {
        this.cards.push(new diamondrun.Card(owner, 'melee', 2, 1, 'unitCard', 1));
        this.cards.push(new diamondrun.Card(owner, 'sitter', 1, 2, 'unitCard', 1));
        
        this.cards.push(new diamondrun.Card(owner, 'jumper', 2, 2, 'unitCard', 2));

        this.cards.push(new diamondrun.Card(owner, 'shooter', 1, 1, 'unitCard', 2));
        
        this.cards.push(new diamondrun.Card(owner, 'fireball', 3, 0, 'burnCard', 3));

    }
};

goog.inherits(diamondrun.Deck, lime.Layer);

diamondrun.Deck.prototype.drawCard = function() {
    return this.cards.pop();
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.Graveyard = function() {
    goog.base(this);
    this.setSize(CARD_SIZE + CARD_SPACING * 2, CARD_SIZE + CARD_SPACING * 2);
    this.setFill(200, 200, 200);
};

goog.inherits(diamondrun.Graveyard, lime.Sprite);

diamondrun.Graveyard.prototype.takeCard = function(card) {
    //remove from hand
    card.getOwner().getHand().removeCard(card);

    //add to graveyard
    this.appendChild(card);
    card.setPosition(0, 0);
    card.runAction(new lime.animation.Sequence(
        new lime.animation.ScaleTo(1.2).setDuration(.3),
        new lime.animation.ScaleTo(1).setDuration(.3)
    ));
};
