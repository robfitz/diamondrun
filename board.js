goog.provide('diamondrun.Tile');
goog.provide('diamondrun.Board');

goog.require('lime.Sprite');
goog.require('lime.Label');
goog.require('lime.Layer');
goog.require('lime.animation.FadeTo');

var TILE_SIZE = 100;
var TILE_SPACING = 5;
var TECH_TILE_POS = 250;

diamondrun.Tile = function(row, col, is_friendly) {
    goog.base(this);

    this.type = 'tile';

    this.defending = null;
    this.contents = null;
    this.row = row;

    var y_factor = 1;
    if (is_friendly) { y_factor = -1 };

    this.setPosition((TILE_SIZE + TILE_SPACING) * col, (TILE_SIZE + TILE_SPACING) * row * y_factor).setSize(TILE_SIZE, TILE_SIZE).setFill(255,150,0);

    if (is_friendly) this.setFill(150, 200, 0);

    this.showDropHighlight = function(){
        this.runAction(new lime.animation.FadeTo(.6).setDuration(.3));
    };
    this.hideDropHighlight = function(){
        this.runAction(new lime.animation.FadeTo(1).setDuration(.1));
    };
};

goog.inherits(diamondrun.Tile, lime.Sprite);

diamondrun.Tile.prototype.addUnit = function(unit) {
    // can't add a unit if there's already something tyere
    if (this.contents) return false;

    this.contents = unit;
    var tilePos = this.getParent().localToScreen(this.getPosition());
    var unitPos = unit.getParent().screenToLocal(tilePos);
    unit.setPosition(unitPos);

    return true;
};

diamondrun.Tile.prototype.removeUnit = function(unit) {
    if (this.contents == unit) {
        this.contents = null;
    }
};

diamondrun.Tile.prototype.addRubble = function(rubble) {
    this.contents = rubble;
    var tilePos = this.getParent().localToScreen(this.getPosition());
    var rubblePos = rubble.getParent().screenToLocal(tilePos);
    rubble.setPosition(rubblePos);
};

diamondrun.Tile.prototype.removeRubble = function(rubble) {
    if (this.contents == rubble) {
        this.contents = null;
    }
};

diamondrun.Tile.prototype.addEffect = function(effect) {
    if (effect.getParent()) {
        var tilePos = this.getParent().localToScreen(this.getPosition());
        var effectPos = effect.getParent().screenToLocal(tilePos);
        effect.setPosition(effectPos);
    }
};

diamondrun.Tile.prototype.getAttackPath = function() {
    return this.path;
};

diamondrun.Tile.prototype.getRow = function() {
    if (this.row == 0) return [this];
    var row1 = this.defending.defendedBy;
    if (this.row == 1) return row1;
    var row1 = this.defending.defending.defendedBy;
    var row2 = [];
    for (var i = 0; i < row1.length; i++) {
        row2 = row2.concat(row1[i].defendedBy);
    }
    return row2;
};

// --------------------------------------------------------------------------------------------------------------------------- Tech Tile sub-class

diamondrun.TechTile = function(is_friendly) {


    goog.base(this);

    this.type = "techtile";
    
    this.techLevel = 1;
    this.label = new lime.Label(this.techLevel).setFontSize(36).setFontColor("White");
    this.appendChild(this.label);

    var y_factor = 1;
    if (is_friendly) { y_factor = -1 };
    
    this.setPosition(TECH_TILE_POS * y_factor, 0).setSize(TILE_SIZE, TILE_SIZE).setFill(50,100,100);

    this.showDropHighlight = function(){
        this.runAction(new lime.animation.FadeTo(.6).setDuration(.3));
    };
    this.hideDropHighlight = function(){
        this.runAction(new lime.animation.FadeTo(1).setDuration(.1));
    };
};

goog.inherits(diamondrun.TechTile, diamondrun.Tile);

diamondrun.TechTile.prototype.addCard = function(card) {
    //unit.setSize(0,0).setFill(255,255,255);
    //unit.setText("");
    this.label.setText(++this.techLevel);
    return true;
};

// --------------------------------------------------------------------------------------------------------------------------- Board class

diamondrun.Board = function(is_friendly) {
    goog.base(this);
    this.tiles = [];
    for (var r = 0; r < 3; r ++) {
        for (var c = -r; c < r + 1; c ++) {
            var t = new diamondrun.Tile(r, c, is_friendly);
            this.tiles.push(t);
            this.appendChild(t);
        }
    }
    // row 1
    this.tiles[1].defending = this.tiles[0];
    this.tiles[2].defending = this.tiles[0];
    this.tiles[3].defending = this.tiles[0];
    // row 2
    this.tiles[4].defending = this.tiles[1];
    this.tiles[5].defending = this.tiles[1];
    this.tiles[6].defending = this.tiles[2];
    this.tiles[7].defending = this.tiles[3];
    this.tiles[8].defending = this.tiles[3];
    
    this.tiles[0].defendedBy = [this.tiles[1], this.tiles[2], this.tiles[3]];
    this.tiles[1].defendedBy = [this.tiles[4], this.tiles[5]];
    this.tiles[2].defendedBy = [this.tiles[6]];
    this.tiles[3].defendedBy = [this.tiles[7], this.tiles[8]];
    
    // add tech tile
    this.techTile = new diamondrun.TechTile(is_friendly);
    
    this.appendChild(this.techTile);
};

goog.inherits(diamondrun.Board, lime.Layer);

diamondrun.Board.prototype.getValidTargets = function(card) {
    if (card.targetType == TargetTypes.FRIENDLY_OPEN) {

        var targets = [];
        for (var i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].contents == null) targets.push(this.tiles[i]);
        }

        targets.push(this.techTile);
        
        return targets;
    }
	else if (card.targetType == TargetTypes.FRIENDLY_UNIT) {
        var targets = [];
        for (var i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i].contents && this.tiles[i].contents.type == 'unit') targets.push(this.tiles[i]);
        }

        targets.push(this.techTile);
        
        return targets;
    }
    else if (card.targetType == TargetTypes.FRIENDLY_TILE) {
        
        var targets = this.tiles;
    }
    else if (card.targetType == TargetTypes.ENEMY_UNIT) {
        var targets = [];
        var tartiles = card.owner.getEnemyBoard().getTiles();
        for (var i = 0; i < tartiles.length; i++) {
            if (tartiles[i].contents && tartiles[i].contents.type == 'unit') targets.push(tartiles[i]);
        }
        
        targets.push(this.techTile);
        
        return targets;
    }
    else if (card.targetType == TargetTypes.ENEMY_OPEN) {
        var targets = [];
        var tartiles = card.owner.getEnemyBoard().getTiles();
        for (var i = 0; i < tartiles.length; i++) {
            if (tartiles[i].contents == null) targets.push(tartiles[i]);
        }

        targets.push(this.techTile);
        
        return targets;
    }
    else if (card.targetType == TargetTypes.ENEMY_TILE) {
        var targets = [];
        var tartiles = card.owner.getEnemyBoard().getTiles();
        for (var i = 0; i < tartiles.length; i++) {
            targets.push(tartiles[i]);
        }
        
        targets.push(this.techTile);
        return targets;
    }
}

diamondrun.Board.prototype.getTiles = function() {
    return this.tiles;
};

diamondrun.Board.prototype.getUnits = function() {
    var units = [];
    for (var i = 0; i < this.tiles.length; i ++) {
        if (this.tiles[i].contents && this.tiles[i].contents.type == 'unit') {
            units.push(this.tiles[i].contents);
        }
    }
    return units;
};

diamondrun.Board.prototype.getRubble = function() {
    var rubble = [];
    for (var i = 0; i < this.tiles.length; i ++) {
        if (this.tiles[i].contents && this.tiles[i].contents.type == 'rubble') {
             rubble.push(this.tiles[i].contents);
        }
    }
    return rubble;
};

diamondrun.Board.prototype.connectAttackPaths = function(enemyBoard) {

    this.tiles[0].attacking = this.tiles[2];
    this.tiles[1].attacking = this.tiles[5];
    this.tiles[2].attacking = this.tiles[6];
    this.tiles[3].attacking = this.tiles[7];

    for (var i = 4; i < this.tiles.length; i ++) {
        this.tiles[i].attacking = enemyBoard.getTiles()[i];
    }

    var eb = enemyBoard;
    //center column
    this.tiles[0].path = [
        this.tiles[2],
        this.tiles[6],
        eb.tiles[6],
        eb.tiles[2],
        eb.tiles[0]
    ];
    this.tiles[2].path = [
        this.tiles[6],
        eb.tiles[6],
        eb.tiles[2],
        eb.tiles[0]
    ];
    this.tiles[6].path = [
        eb.tiles[6],
        eb.tiles[2],
        eb.tiles[0]
    ];
    //left column
    this.tiles[1].path = [
        this.tiles[5],
        eb.tiles[5],
        eb.tiles[1],
        eb.tiles[0]
    ];
    this.tiles[5].path = [
        eb.tiles[5],
        eb.tiles[1],
        eb.tiles[0]
    ];
    //right column
    this.tiles[3].path = [
        this.tiles[7],
        eb.tiles[7],
        eb.tiles[3],
        eb.tiles[0]
    ];
    this.tiles[7].path = [
        eb.tiles[7],
        eb.tiles[3],
        eb.tiles[0]
    ];
    //corners
    this.tiles[4].path = [
        eb.tiles[4],
        eb.tiles[1],
        eb.tiles[0]
    ];
    this.tiles[8].path = [
        eb.tiles[8],
        eb.tiles[3],
        eb.tiles[0]
    ];

};

diamondrun.Board.prototype.startTurn = function() {
	// Notify active effects a new turn has begun
	for (var i = 0; i < this.owner.activeEffects.length; i ++) {
		this.owner.activeEffects[i].startTurn();
	}

    for (var i = 0; i < this.tiles.length; i ++) {
        // Tell contents that turn has started
        if (this.tiles[i].contents) this.tiles[i].contents.startTurn();
    }
};

diamondrun.Board.prototype.endTurn = function() {
    for (var i = 0; i < this.tiles.length; i ++) {
        // Tell contents that turn is ending as well as to redraw after EOT calculations
        if (this.tiles[i].contents) {
			this.tiles[i].contents.endTurn();
            this.tiles[i].contents.redraw();
		}
    }
};
