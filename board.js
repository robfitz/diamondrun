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
