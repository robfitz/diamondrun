goog.provide('diamondrun.PlayCardCommand');

diamondrun.PlayCardCommand = function(player, card, target_tile) {
	this.player = player;
	this.card = card;
	this.target_tile = target_tile;
}
diamondrun.PlayCardCommand.prototype.execute = function() {
	// move from hand to graveyard
	this.player.getGraveyard().takeCard(this.card);

	// apply effect to board
	var unit = new diamondrun.Unit(1, 1, 'melee');
	this.target_tile.appendChild(unit);
}
