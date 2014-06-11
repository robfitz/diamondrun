goog.provide('diamondrun.Player');


diamondrun.Player = function(board, hand, deck, graveyard) {
	this.board = new diamondrun.Board(true).setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 + 265);
    this.graveyard = new diamondrun.Graveyard().setPosition(IPHONE_4_W - 110, IPHONE_4_H - 110);
    this.hand = new diamondrun.Hand(this).setPosition(IPHONE_4_W / 2, IPHONE_4_H - 50 - 5);
	this.deck = new diamondrun.Deck(this);

	this.canActThisPhase = false;
	this.actionCallback = null;
}

diamondrun.Player.prototype.playCard = function(card, tile) {
	var cmd = new diamondrun.PlayCardCommand(this, card, tile);
	Commands.add(cmd);
	this.canActThisPhase = false;
	if (this.actionCallback) {
		this.actionCallback();
		this.actionCallback = null;
	}
}
diamondrun.Player.prototype.beginPlayPhase = function(callback) {
	this.canActThisPhase = true;
	this.actionCallback = callback;
}

diamondrun.Player.prototype.getCanAct = function() {
	return this.canActThisPhase;
}

diamondrun.Player.prototype.draw = function() {
	this.hand.drawCard();
}
diamondrun.Player.prototype.getBoard = function() {
	return this.board;
}
diamondrun.Player.prototype.getHand = function() {
	return this.hand;
}
diamondrun.Player.prototype.getDeck = function() {
	return this.deck;
}
diamondrun.Player.prototype.getGraveyard = function() {
	return this.graveyard;
}