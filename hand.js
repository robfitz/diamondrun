goog.provide('diamondrun.Hand');
goog.provide('diamondrun.Deck');
goog.provide('diamondrun.Card');
goog.provide('diamondrun.Graveyard');
goog.require('diamondrun.Unit');
goog.require('diamondrun.PlayCardCommand');

goog.require('lime.Scene');
goog.require('lime.Sprite');
goog.require('lime.Layer');
goog.require('lime.Label');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.MoveTo');
goog.require('lime.animation.ScaleTo');

goog.require('goog.events.Event');

var CARD_SIZE = 100;
var CARD_FONT_SIZE = 60;
var CARD_SPACING = 5;


diamondrun.Card = function(owner, name, targetType, targetBehaviour, castCost, units, effects, RGB) {
    goog.base(this);
    this.owner = owner;
    this.name = name;
    this.targetType = targetType;
    this.targetBehaviour = targetBehaviour;
    this.castCost = parseInt(castCost);
    this.units = units;
    this.effects = effects;
    
    this.r = parseInt(RGB[0]);
    this.g = parseInt(RGB[1]);
    this.b = parseInt(RGB[2]);
    
    this.setText(this.name + " Cost:" + this.castCost);
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
                
                // Remove valid target highlighting
                for (var i = 0; i < drop_targets.length; i ++) {
                    var r = drop_targets[i].getFill().r;
                    var g = drop_targets[i].getFill().g;
                    var b = drop_targets[i].getFill().b;
                    drop_targets[i].setFill(r+10,g+40,b+40);
                };

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
    
    
    // Handle MouseOver and MouseOut
    game.director.getCurrentScene().listenOverOut(this,
        function(e){ 
            var drop_targets = card.owner.getBoard().getValidTargets(card);
            for (var i = 0; i < drop_targets.length; i ++) {
                var r = drop_targets[i].getFill().r;
                var g = drop_targets[i].getFill().g;
                var b = drop_targets[i].getFill().b;
                drop_targets[i].setFill(r-10,g-40,b-40);
            } 
        }, 
        function(e){ 
            var drop_targets = card.owner.getBoard().getValidTargets(card);
            for (var i = 0; i < drop_targets.length; i ++) {
                var r = drop_targets[i].getFill().r;
                var g = drop_targets[i].getFill().g;
                var b = drop_targets[i].getFill().b;
                drop_targets[i].setFill(r+10,g+40,b+40);
            };
        });
};

goog.inherits(diamondrun.Card, lime.Label);

diamondrun.Card.prototype.getOwner = function() {
    return this.owner;
};
// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

var TargetTypes = Object.freeze({FRIENDLY_OPEN: 'friendly-open', FRIENDLY_UNIT: 'friendly-unit', FRIENDLY_RUBBLE: 'friendly-rubble', FRIENDLY_PLAYER: 'friendly-player',
                                 ENEMY_OPEN: 'enemy-open', ENEMY_UNIT: 'enemy-unit', ENEMY_RUBBLE: 'enemy-rubble', ENEMY_PLAYER: 'enemy-player'});

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
        this.cards.push(1);
        this.cards.push(1);
        this.cards.push(2);
        this.cards.push(3);
        this.cards.push(4);

    }
};

goog.inherits(diamondrun.Deck, lime.Layer);

diamondrun.Deck.prototype.drawCard = function() {
    return game.cardFactory.makeCard(this.cards.pop(), this.owner);
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

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.CardFactory = function() {
};

//Card constructor: owner, name, targetType, targetBehaviour, castCost, units, effects, RGB

diamondrun.CardFactory.prototype.makeCard = function(ID, owner) {
    var cardData=Monk;

    var units = [];
    var effects = [];
    
    for (var i = 0; i < parseInt(cardData.numberOfUnits); i++) {
        units.push(new diamondrun.Unit(owner, cardData.units[i].name, cardData.units[i].movement, cardData.units[i].attack,
        cardData.units[i].hP, cardData.units[i].rubble_duration));
    }
    
    for (var i = 0; i < parseInt(cardData.numberOfEffects); i++) {
        effects.push(new diamondrun.Effect(owner, cardData.effects[i].name, cardData.effects[i].targetType, cardData.effects[i].damage, cardData.effects[i].atkUp,
        cardData.effects[i].hPUp, cardData.effects[i].techUp, cardData.effects[i].kill, cardData.effects[i].rubble_duration));
    }
    
    return new diamondrun.Card(owner, cardData.name, cardData.targetType, cardData.targetBehaviour, cardData.cost, units, effects, [cardData.R,cardData.G,cardData.B]);
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator


lime.Scene.prototype.listenOverOut = (function(){
 
    var moveHandler = function(e){
        for(var i in this.registeredOverOut_){
            var item = this.registeredOverOut_[i];
            var shape = item[0];
            if(!shape.inTree_) continue;
            var insideShape = shape.hitTest(e);
            if(!shape.insideShape_ && insideShape && goog.isFunction(item[1])){
                item[1].call(shape,e);
            }
            if(shape.insideShape_ && !insideShape && goog.isFunction(item[2])){
                item[2].call(shape,e);
            }
            shape.insideShape_ = insideShape;
        }
    };
 
    return function(shape,over,out){
        if(shape==this) return; //scene itself is always full
 
        if(!this.registeredOverOut_){
             this.registeredOverOut_ = {};
        }
 
        var uuid = goog.getUid(shape);
 
        if(!over && !out) //clear if empty
            delete this.registeredOverOut_[uuid];
 
        if(!this.isListeningOverOut_){
            goog.events.listen(this,"mousemove",moveHandler,false,this);
            this.isListeningOverOut_ = true;
        }
 
        this.registeredOverOut_[uuid] = [shape,over,out];
    }
})();