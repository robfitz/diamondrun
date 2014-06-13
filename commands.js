goog.provide('diamondrun.PlayCardCommand');
goog.provide('diamondrun.DrawCardCommand');
goog.provide('diamondrun.NextPhaseCommand');



diamondrun.PlayCardCommand = function(player, card, targetTile) {
	this.player = player;
	this.card = card;
	this.targetTile = targetTile;
}
diamondrun.PlayCardCommand.prototype.execute = function() {
	
	// apply effect to board
	var unit = new diamondrun.Unit(this.player, this.targetTile, 'melee', 1, 2);
	
	if (this.targetTile.addUnit(unit)) {
		// move from hand to graveyard
		this.player.getGraveyard().takeCard(this.card);
	}
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

