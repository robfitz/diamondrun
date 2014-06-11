goog.provide('diamondrun.PlayCardCommand');
goog.provide('diamondrun.DrawCardCommand');
goog.provide('diamondrun.NextPhaseCommand');



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


diamondrun.DrawCardCommand = function(player, numCards) {
	this.player = player;
	this.numCards = numCards;
}
diamondrun.DrawCardCommand.prototype.execute = function() {
	for (var i = 0; i < this.numCards; i ++) {
		this.player.draw();
	}
}

diamondrun.NextPhaseCommand = function() {
}
diamondrun.NextPhaseCommand.prototype.execute = function() {
	Phases.next();
}

