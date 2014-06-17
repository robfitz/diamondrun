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
    if (this.card.type == 'unitCard') {
        var unit = new diamondrun.Unit(this.player, this.targetTile, this.card.movement, this.card.attack, this.card.hp);    
        if (this.targetTile.addUnit(unit)) {
            // move from hand to graveyard
            this.player.getGraveyard().takeCard(this.card);
        }
    }
    else if (this.card.type == 'burnCard') {
        var effect = new diamondrun.Effect(this.player, this.targetTile, this.card.type, this.card.attack);
        this.targetTile.addEffect(effect)
        this.player.activeEffects.push(effect);
        
        // move from hand to graveyard
        this.player.getGraveyard().takeCard(this.card);
    }
    else console.log('WARNING: unknown card type in PlayCardCommand');
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
