goog.provide('diamondrun.Unit');

goog.require('lime.Sprite');
goog.require('lime.Label');
goog.require('lime.Polygon');
goog.require('lime.RoundedRect');
goog.require('lime.animation.Spawn');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.MoveTo');
goog.require('lime.animation.RotateBy');
goog.require('lime.animation.ScaleTo');
goog.require('lime.animation.FadeTo');

goog.require('goog.math.Coordinate');


diamondrun.Unit = function(owner, tile, movement, attack, hp) {
    goog.base(this);
    
    this.owner = owner;
    this.tile = tile;
    this.attack = attack;
    this.hp = hp;
    this.maxHp = hp;

    this.label = new lime.Label().setSize(CARD_SIZE - CARD_SPACING * 1, CARD_SIZE - CARD_SPACING * 1);

    this.movement = movement;
    if (this.movement == 'jumper') this.jumps = 2;    
    this.type = "unit";
    this.isSSick = true;

    this.redraw();
    game.unitLayer.appendChild(this);

    this.appendChild(getShape(this.movement, CARD_SIZE - CARD_SPACING));
    this.appendChild(this.label);
};

goog.inherits(diamondrun.Unit, lime.Layer);

diamondrun.Unit.prototype.heal = function() {
    this.hp = this.maxHp;
    this.redraw();
};

diamondrun.Unit.prototype.redraw = function() {
    var txt = this.attack + '/' + this.maxHp;
    if (this.hp < this.maxHp) {
        var missing = this.maxHp - this.hp;
        txt += ' - ' + missing;
    }
    if (this.isSSick) txt += ' (' + this.movement + ')';
    else txt += ' ' + this.movement;
    this.label.setText(txt);

};

diamondrun.Unit.prototype.takeDamage = function(damage, generateRubble) {
    this.hp -= damage;
    if (this.hp <= 0) {
        this.die(generateRubble);
    }
    this.redraw();
};

diamondrun.Unit.prototype.die = function(generateRubble) {

    //death effect
    var dieEffect = new lime.animation.Spawn(
        new lime.animation.ScaleTo(5),
        new lime.animation.FadeTo(0),
        new lime.animation.RotateBy(90)
    ).setDuration(0.4);
    
    this.runAction(dieEffect);
    
    var self = this;
    var rubbleTile = this.tile
    
    goog.events.listen(dieEffect,lime.animation.Event.STOP,function(){
        //remove from board
        self.tile.removeUnit(self);
        self.getParent().removeChild(self);
        
        if (generateRubble) rubbleTile.addRubble(new diamondrun.Rubble(rubbleTile, 1));
    });
};

diamondrun.Unit.prototype.doAttack = function(contexts, callbacks) {
    
    var path = this.tile.getAttackPath();

    var animations = [];
    var startPosition = this.getPosition();
    var localPosition = this.getPosition();

    var duration = 0;
    var self = this;

    // Check to see if the unit has Summoning Sickness or is a sitter.
    if (this.isSSick || this.movement == 'sitter') {
        if (callbacks && callbacks.length > 0) {
            var firstCall = callbacks.shift();
            var firstContext = contexts.shift();
            firstCall.call(firstContext, contexts, callbacks);
        }
        else {
            Commands.add(new diamondrun.NextPhaseCommand());
        }
        return;
    }

        
    //step through path looking for obstruction)
    var turnBack = false;
    for (var i = 0; i < path.length; i ++) {

        lastPosition = localPosition;

        var screenPosition = path[i].getParent().localToScreen(path[i].getPosition());
        var localPosition = this.getParent().screenToLocal(screenPosition);

        var action = this.canMoveToTile(i, path[i]);

        //nothing blocking? add move
        switch (action) {
            case 'move':
                animations.push(new lime.animation.MoveTo(localPosition).setDuration(.3));
                duration += 0.3;
                break;
            case 'fight':
                var contents = path[i].contents;
        
                var bumpY = (lastPosition.y + localPosition.y) / 2;
                var bumpX = (lastPosition.x + localPosition.x) / 2;
                animations.push(new lime.animation.MoveTo(bumpX, bumpY).setDuration(.1));
                var self = this;
                
                
                lime.scheduleManager.callAfter(function(dt) {    
                    contents.takeDamage(self.attack, true);
                    if (contents.movement == 'sitter') contents.counterAttack(self);
                }, null, duration*1000);
                duration += 0.1;
                turnBack = true;
                break;
            case 'collide':
                var bumpY = (lastPosition.y + localPosition.y) / 2;
                animations.push(new lime.animation.MoveTo(lastPosition.x, bumpY).setDuration(.1));
                duration += 0.1;
                turnBack = true;
                break;
        }        
        if (turnBack) break;
        else if (i==path.length-1) { // If the unit reaches the end of its attack path, deal damage to the opponent.
            var self = this;
            lime.scheduleManager.callAfter(function(dt) {                
                if (self.owner.isPlayer1) game.player2.takeDamage(self.attack);
                else game.player1.takeDamage(self.attack);
            }, null, duration*1000);
        }
    }
    
    //if still alive, step backwards to return to start point
    for (i = i - 1; i >= 0; i --) {
        var screenPosition = path[i].getParent().localToScreen(path[i].getPosition());
        var localPosition = this.getParent().screenToLocal(screenPosition);

        animations.push(new lime.animation.MoveTo(localPosition).setDuration(.2));
        duration += 0.2;
    }
    animations.push(new lime.animation.MoveTo(startPosition).setDuration(.2));
    duration += 0.2;

    //TODO: i'm sure i'm going to regret this callback chain
    //sometime soon, but i haven't yet figured out a
    //better way to get the animations and phase advance
    //to happen sequentially
    lime.scheduleManager.callAfter(function(dt) {
        if (callbacks && callbacks.length > 0) {
            var firstCall = callbacks.shift();
            var firstContext = contexts.shift();
            firstCall.call(firstContext, contexts, callbacks);
        }
        else {
            Commands.add(new diamondrun.NextPhaseCommand());
        }
    }, null, duration*1000);

    this.runAction(new lime.animation.Sequence(animations));

};

//returns 'move', 'collide', or 'fight'
diamondrun.Unit.prototype.canMoveToTile = function(stepNum, tile) {
    var contents = tile.contents;

    switch(this.movement) {
        case 'melee':
            if (!contents || contents.type == 'rubble') {
                return 'move';
            }
            else if (contents.type == 'unit') {
                if (contents.owner == this.owner) return 'collide';
                else return 'fight';
            }
            break;
        case 'shooter':
            if (!contents || contents.type == 'rubble') {
                return 'move';
            }
            else if (contents.type == 'unit') {
                if (contents.owner == this.owner) return 'move';
                else return 'fight';
            }
            break;
        case 'jumper':
            // Jump over first two tiles in attack path
            if (this.jumps-- > 0) {
                return 'move';
            }
            else if (!contents || contents.type == 'rubble') {
                return 'move';
            }
            else if (contents.type == 'unit') {
                if (contents.owner == this.owner) return 'collide';
                else return 'fight';
            }
            break;
        case 'sitter':
            // Shouldn't ever be called. Leaving in case we want special case actions/animations for sitters where/when their movement would be.
            return 'collide';
            break;
        default:
            console.log('WARNING: unknown movement type in Unit.canMoveToTile');
            return 'collide';
    }    
};

diamondrun.Unit.prototype.counterAttack = function(target) {
    target.takeDamage(this.attack, false);
};

diamondrun.Unit.prototype.startTurn = function() {
    this.heal();
};

diamondrun.Unit.prototype.endTurn = function() {
    this.isSSick = false;
    this.redraw();
    
    // Reset Movement variables
    if (this.movement == 'jumper') this.jumps = 2;
};

function getShape(movement, scale) {

    var poly = new lime.Polygon();
    var w = scale / 2;

    switch (movement) {
        case 'melee':
            //triangle
            poly.addPoints(0,-w, w,w, -w,w);
            break;
        case 'sitter': 
            //crown
            poly.addPoints(-w,-w, 0,-w*0.5, w,-w, w,w, -w,w);
            break;
        case 'shooter':
            //chevron
            poly.addPoints(-w,-w*0.5, 0,-w, w,-w*0.5, w,w, 0,w*0.5, -w,w);
            break;
        case 'jumper':
            //diamond
            poly.addPoints(0,-w, w,-w/2, w,w/2, 0,w, -w,w/2, -w,-w/2);
            break;
        default:
            //square
            poly.addPoints(-w,-w, w,-w, w,w, -w,w);
            break;
    }
    poly.setStroke(1,'#f00').setFill(255, 55, 55);
    return poly;
}
