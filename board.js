goog.provide('diamondrun.Tile');
goog.provide('diamondrun.Board');

goog.require('lime.Sprite');
goog.require('lime.Layer');
goog.require('lime.animation.FadeTo');

var TILE_SIZE = 100;
var TILE_SPACING = 5;

diamondrun.Tile = function(row, col, is_friendly) {
	goog.base(this);
	this.defending = null;
	this.contents = null;

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
}
goog.inherits(diamondrun.Tile, lime.Sprite);

diamondrun.Tile.prototype.addUnit = function(unit) {
	// can't add a unit if there's already something tyere
	if (this.contents) return false;

	this.contents = unit;
	this.appendChild(unit);

	return true;
};
diamondrun.Tile.prototype.getAttackPath = function() {
	return this.path;
}


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

}
goog.inherits(diamondrun.Board, lime.Layer);
diamondrun.Board.prototype.getTiles = function() {
	return this.tiles;
};
diamondrun.Board.prototype.getUnits = function() {
	var units = [];
	for (var i = 0; i < this.tiles.length; i ++) {
		if (this.tiles[i].contents && this.tiles[i].contents.type == 'unit') {

			console.log('get units + 1');
		 	units.push(this.tiles[i].contents);
		}
	}
	console.log(units);
	return units;
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

