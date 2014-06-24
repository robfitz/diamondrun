goog.provide('diamondrun.AIPlayer');

goog.require('diamondrun.Player');

diamondrun.AIPlayer = function(isPlayer1, board, hand, deck, graveyard) {
    this.board = new diamondrun.Board(isPlayer1).setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 + 265);
    this.graveyard = new diamondrun.Graveyard().setPosition(IPHONE_4_W - 110, IPHONE_4_H - 110);
    this.hand = new diamondrun.Hand(this).setPosition(IPHONE_4_W / 2, IPHONE_4_H - 50 - 5);
    this.deck = new diamondrun.Deck(this);
    this.activeEffects = [];
    
    this.techLevel = 1;
    this.life = 10;
    
    if(isPlayer1) this.lifeLabel = new lime.Label(this.life).setFontSize(100).setPosition(250 * 1, 0).setAlign("center"); // Start of just UI stuff
    else this.lifeLabel = new lime.Label(this.life).setFontSize(100).setPosition( 250 * -1, 0).setAlign("center");        // TODO: Eventually seperate into its own class
    
    this.board.appendChild(this.lifeLabel);

    this.canActThisPhase = false;
    this.actionCallback = null;
    this.isPlayer1 = isPlayer1;
};

goog.inherits(diamondrun.AIPlayer, diamondrun.Player);

diamondrun.AIPlayer.prototype.beginPlayPhase = function(callback) {    
    console.log("play phase begun");
    this.techLevel = this.board.techTile.techLevel; // Update current tech level
    
    this.canActThisPhase = true;
    this.actionCallback = callback;

    for (var i = 0; i < this.hand.cards.length; i ++) {
    // this.hand.cards[i].enableDragging();
    }
    
    var pMU = [];
    console.log(this.hand.cards.length);
        
    for (var c = 0; c < this.hand.cards.length; c ++) {
        console.log(this.hand.cards[c]);
        var targets = this.board.getValidTargets(this.hand.cards[c]);
        var card = this.hand.cards[c];
        for (var t = 0; t < targets.length; t ++) {
            var target = targets[t];
            pMU.push([card, target, this.utility(card, target)]);
        }
    }
    
    var curMax = Number.NEGATIVE_INFINITY;
    var curTar = null;
    var curCard = null;
    
    for (var i = 0; i < pMU.length; i ++) {
        if (curMax < pMU[i][2] && (this.techLevel >= pMU[i][0].castCost || pMU[i][1] == this.board.techTile)) {
            curMax = pMU[i][2];
            curTar = pMU[i][1];
            curCard = pMU[i][0];
        }
    }
    
    if (curCard != null) this.playCard(curCard, curTar);
};

diamondrun.AIPlayer.prototype.utility = function(card, target) {
    // AI utility values
    var OPEN_ATK_VALUE = 2;
    var OPEN_DEF_VALUE = 2;
    
    var TECH_UP_VALUE = 1;
    
    var RANGED_MISUSE_VALUE = 3;
    var DEFENDER_MISUSE_VALUE= 3;
    
    var KILLSHOT_VALUE = 4;
    // End of utility values
    
    var utility = 0 + card.castCost;
    
    if (card.type == 'unitCard') {
        
        
        if (target == this.board.techTile) {
            utility -= card.castCost * 2;
            var newTechVal = this.techLevel + 1;
            for (var c = 0; c < this.hand.cards.length; c ++) {
                if (this.hand.cards[c] != card && this.hand.cards[c].techLevel == this.techLevel) utility += TECH_UP_VALUE;
            }
        }
        else {
            var attackPath = target.getAttackPath();
            console.log(target);
            var clear = true;
            for (var i = 0; i < attackPath.length; i ++) {
                if (attackPath[i].contents) clear = false;
            }
            if (clear) utility += OPEN_ATK_VALUE;
            
            if (card.movement == 'shooter') {
                var attackPath = target.getAttackPath();
                var clear = true;
                for (var i = 0; i < attackPath.length; i ++) {
                    if (attackPath[i].contents && attackPath[i].contents.owner == this) clear = false;
                }
                if (clear) utility -= RANGED_MISUSE_VALUE;
            }
            
            if (card.movement == 'sitter') {
                var attackPath = target.getAttackPath();
                var clear = true;
                for (var i = 0; i < attackPath.length; i ++) {
                    if (attackPath[i].contents && attackPath[i].contents.owner == this) clear = false;
                }
                if (!clear) utility -= DEFENDER_MISUSE_VALUE;
            }
        }
    }
    else if (card.type == 'burnCard') {
        if (target.contents && target.contents.hP - card.attack <= 0) utility += KILLSHOT_VALUE;
    }
    
    return utility;
};
