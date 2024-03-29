goog.provide('diamondrun.Unit');

goog.require('diamondrun.Util');

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
goog.require('lime.fill.Color');
goog.require('lime.fill.Frame');
goog.require('lime.animation.KeyframeAnimation');
goog.require('lime.SpriteSheet');
goog.require('lime.parser.JSON');
goog.require('lime.ASSETS.facesheet.json');

goog.require('goog.math.Coordinate');


diamondrun.Unit = function(owner, name, movement, attack, hp, rubbleDuration) {
    goog.base(this);
    
    this.owner = owner;
    this.name = name;
    this.tile = null;
    this.attack = parseInt(attack);
    this.hp = parseInt(hp);
    this.maxHp = hp;
    this.rubbleDuration = rubbleDuration;

    this.movement = movement;
    if (this.movement == UnitMovement.JUMPER) this.jumps = 2;    
    this.type = "unit";
    this.isSSick = true;
    this.mouseIsOver = false;
    
    this.faces = new lime.SpriteSheet('Sprites\\export.png', lime.ASSETS.facesheet.json, lime.parser.JSON);
    
    
    var faceFrame = Math.max(0, this.attack - 1);
    this.face = new lime.Sprite().setSize(100,100).setFill(this.faces.getFrame(faceFrame)); // Frame naming is handled by JSON parser TODO: clean that up
    

    this.label = new lime.Label().setSize(CARD_SIZE - CARD_SPACING * 1, CARD_SIZE - CARD_SPACING * 1);
    
    this.r = 0;
    this.g = 255;
    this.b = 0;
    this.poly = getShape(this.movement, this.hp, CARD_SIZE - CARD_SPACING, 0, 255, 0);
    
    this.appendChild(this.poly);
    this.appendChild(this.face);
    this.appendChild(this.label);

    goog.events.listen(this, 'click', function(e) {
        game.cardView.show(this);
    });

}

goog.inherits(diamondrun.Unit, lime.Layer);

diamondrun.Unit.prototype.description = function() {
    return "Unit: " + this.movement + "\n" +
        this.attack + "/" + this.maxHp;
}

diamondrun.Unit.prototype.play = function(targetTile) {
    this.tile = targetTile;
    this.redraw();
    game.unitLayer.appendChild(this);
    
    // Handle Mouseover
    var self = this;
    game.director.getCurrentScene().listenOverOut(self.label,
        function(e){ 
            // Mouse Over
            self.mouseIsOver = true;
            var path_targets = self.tile.getAttackPath();
            for (var i = 0; i < path_targets.length; i ++) {
                var r = path_targets[i].getFill().r;
                var g = path_targets[i].getFill().g;
                var b = path_targets[i].getFill().b;
                path_targets[i].setFill(r-40,g-10,b-10);
            } 
        }, 
        function(e){
            // Mouse Out
            self.mouseIsOver = false;
            var path_targets = self.tile.getAttackPath();
            for (var i = 0; i < path_targets.length; i ++) {
                var r = path_targets[i].getFill().r;
                var g = path_targets[i].getFill().g;
                var b = path_targets[i].getFill().b;
                path_targets[i].setFill(r+40,g+10,b+10);
            };
        });
};

diamondrun.Unit.prototype.heal = function() {
    this.hp = this.maxHp;
    this.redraw();
};

diamondrun.Unit.prototype.redraw = function() {
    var center = new diamondrun.Util().lerp([255, 255, 255], [this.r, this.g, this.b], this.hp / 6);
    var stroke = new diamondrun.Util().lerp([255, 255, 255], [this.r, this.g, this.b], this.maxHp / 6);
    this.poly.setFill(Math.ceil(center[0]), Math.ceil(center[1]), Math.ceil(center[2])).setStroke(5, Math.ceil(stroke[0]), Math.ceil(stroke[1]), Math.ceil(stroke[2]));
    
    // Set sprite to correct power, constrained to 6. Might need to add lower constraint if nerf cards are added
    var faceFrame = Math.max(0, Math.min(this.attack - 1, 5));
    this.face.setFill(this.faces.getFrame(Math.max(Math.min(this.attack - 1, 5),0)));
    
    var txt = this.attack + '/' + this.hp;
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

diamondrun.Unit.prototype.attackUp = function(amount, turns) {
    this.attack += amount;
};

diamondrun.Unit.prototype.die = function(generateRubble) {

    var self = this;
    var rubbleTile = this.tile

    self.tile.removeUnit(self);
    if (generateRubble) rubbleTile.addRubble(new diamondrun.Rubble(rubbleTile, self.rubbleDuration));
    
    // Remove Highlights cause by this unit on board
    if (this.mouseIsOver) {
        var path_targets = this.tile.getAttackPath();
        for (var i = 0; i < path_targets.length; i ++) {
            var r = path_targets[i].getFill().r;
            var g = path_targets[i].getFill().g;
            var b = path_targets[i].getFill().b;
            path_targets[i].setFill(r+40,g+10,b+10);
        };
    }
    
    //death effect
    var dieEffect = new lime.animation.Spawn(
        new lime.animation.ScaleTo(5),
        new lime.animation.FadeTo(0),
        new lime.animation.RotateBy(90)
    ).setDuration(0.4);
    
    this.runAction(dieEffect);
    
    goog.events.listen(dieEffect,lime.animation.Event.STOP,function() {
        //remove from board
        if (self.getParent()) self.getParent().removeChild(self);
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
    if (this.isSSick || this.movement == UnitMovement.SITTER) {
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
        if (self.getParent()) var localPosition = this.getParent().screenToLocal(screenPosition);

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
                    if (contents.movement == UnitMovement.SITTER) contents.counterAttack(self);
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
        else if (i==path.length-1 && this.hp > 0) { // If the unit reaches the end of its attack path alive, deal damage to the opponent.
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
        if (self.getParent()) var localPosition = this.getParent().screenToLocal(screenPosition);

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
        case UnitMovement.MELEE:
            if (!contents || contents.type == 'rubble') {
                return 'move';
            }
            else if (contents.type == 'unit') {
                if (contents.owner == this.owner) return 'collide';
                else return 'fight';
            }
            break;
        case UnitMovement.SHOOTER:
            if (!contents || contents.type == 'rubble') {
                return 'move';
            }
            else if (contents.type == 'unit') {
                if (contents.owner == this.owner) return 'move';
                else return 'fight';
            }
            break;
        case UnitMovement.JUMPER:
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
        case UnitMovement.SITTER:
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
    if (this.movement == UnitMovement.JUMPER) this.jumps = 2;
};

function getShape(movement, hp, scale, r, g, b) {

    var poly = new lime.Polygon();
    var w = scale / 2;

    switch (movement) {
        case UnitMovement.MELEE:
            //triangle
            poly.addPoints(0,-w, w,w, -w,w);
            break;
        case UnitMovement.SITTER: 
            //crown
            poly.addPoints(-w,-w, 0,-w*0.75, w,-w, w,w, -w,w);
            break;
        case UnitMovement.SHOOTER:
            //chevron
            poly.addPoints(-w,-w*0.75, 0,-w, w,-w*0.75, w,w, 0,w*0.75, -w,w);
            break;
        case UnitMovement.JUMPER:
            //diamond
            poly.addPoints(0,-w, w,-w/2, w,w/2, 0,w, -w,w/2, -w,-w/2);
            break;
        default:
            //square
            poly.addPoints(-w,-w, w,-w, w,w, -w,w);
            break;
    }
    
    poly.setStroke(0,'#000').setFill(r, g, b);

    /*if (hp > 1) {
        poly.appendChild(getShape(movement, hp-1, scale, r,g,b).setPosition(5, -5));
    }
    */

    return poly;
}

// --------------------------------------------------------------------------------------------------------------------------- Enumeration of Unit Movement Types

var UnitMovement = Object.freeze({MELEE: 'melee', SITTER: 'sitter', SHOOTER: 'shooter', JUMPER: 'jumper'});