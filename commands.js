goog.provide('diamondrun.PlayCardCommand');
goog.provide('diamondrun.DrawCardCommand');
goog.provide('diamondrun.NextPhaseCommand');


diamondrun.PlayCardCommand = function(player, card, targetTile) {
    this.player = player;
    this.card = card;
    this.targetTile = targetTile;
};

diamondrun.PlayCardCommand.prototype.execute = function() {
    
    // apply effect to board depending on Card type
    var unit = new diamondrun.Unit(this.player, this.targetTile, this.card.movement, this.card.attack, this.card.hp);    
    if (this.targetTile.addUnit(unit)) {
        // move from hand to graveyard
        this.player.getGraveyard().takeCard(this.card);
    }
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.PlaySpellCommand = function(player, card, targetTile) {
    this.player = player;
    this.card = card;
    this.targetTile = targetTile;
};

diamondrun.PlaySpellCommand.prototype.execute = function() {
    
    // apply effect to board
    var effect = new diamondrun.Effect(this.player, this.targetTile, this.card.type, this.card.attack);
    this.targetTile.addEffect(effect)
    
    // move from hand to graveyard
    this.player.getGraveyard().takeCard(this.card);
    
    // Activate effect instantly
    effect.activate()
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.DrawCardCommand = function(player, numCards) {
    this.player = player;
    this.numCards = numCards;
};

diamondrun.DrawCardCommand.prototype.execute = function() {
    for (var i = 0; i < this.numCards; i ++) {
        this.player.draw();
    }
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.NextPhaseCommand = function() {
};

diamondrun.NextPhaseCommand.prototype.execute = function() {
    Phases.next();
};
