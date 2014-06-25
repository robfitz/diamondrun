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
    
    this.lifeLabel = new lime.Label(this.life).setFontSize(100).setPosition( 250 * -1, 0).setAlign("center").setFontColor('white');        // TODO: Eventually seperate into its own class
    
    this.board.appendChild(this.lifeLabel);

    this.canActThisPhase = false;
    this.actionCallback = null;
    this.isPlayer1 = isPlayer1;
};

goog.inherits(diamondrun.AIPlayer, diamondrun.Player);

diamondrun.AIPlayer.prototype.beginPlayPhase = function(callback) {    
    this.techLevel = this.board.techTile.techLevel; // Update current tech level
    
    this.canActThisPhase = true;
    this.actionCallback = callback;
    
    // List of possible moves with the format [card, target, utility]
    var possible = [];
    for (var c = 0; c < this.hand.cards.length; c ++) {
        var card = this.hand.cards[c];
        var targets = this.board.getValidTargets(card);
        for (var t = 0; t < targets.length; t ++) {
            var target = targets[t];
            possible.push([card, target, this.utility(card, target)]);
        }
    }
    
    // Find legal move with highest utility value; might be prettier to do functionally.
    var curMax = Number.NEGATIVE_INFINITY;
    var curTar = null;
    var curCard = null;
    for (var i = 0; i < possible.length; i ++) {
        if (curMax <= possible[i][2] && (this.techLevel >= possible[i][0].castCost || possible[i][1] == this.board.techTile)) {
            curMax = possible[i][2];
            curTar = possible[i][1];
            curCard = possible[i][0];
        }
    }
    
    // Play found move
    if (curCard != null) this.playCard(curCard, curTar);
};

diamondrun.AIPlayer.prototype.utility = function(card, target) {
    // AI utility values
    var OPEN_ATK_VALUE = 2;
    var OPEN_DEF_VALUE = 6;
    
    var TECH_UP_VALUE = .5;
    
    var RANGED_MISUSE_VALUE = 3;
    var DEFENDER_MISUSE_VALUE= 3;
    var MELEE_MISUSE_VALUE= 3;
    
    var KILLSHOT_VALUE = 4;
    // End of utility values
    
    var utility = 0 + card.castCost;
    if (card.type == CardTypes.UNIT_CARD) {
        if (target == this.board.techTile) {
            // If sacrificing card subtract card cost * 2 to devalue sacrificing good cards.
            utility -= card.castCost * 2;
            // Then add TECH_UP_VALUE for every card in hand that would be unlocked by the sacrifice
            for (var c = 0; c < this.hand.cards.length; c ++) {
                if (this.hand.cards[c] != card && this.hand.cards[c].techLevel == this.techLevel + 1) utility += TECH_UP_VALUE;
            }
        }
        else {
            // If the path ahead is clear add OPEN_ATK_VALUE
            var attackPath = target.getAttackPath();
            var clear = true;
            for (var i = 0; i < attackPath.length; i ++) {
                if (attackPath[i].contents) clear = false;
            }
            if (clear) utility += OPEN_ATK_VALUE;
            
            // TODO: add value to blocking an enemy attack path
            enemyUnits = this.getEnemyBoard().getUnits();
            var needsBlocker = false;
            unitloop:
            for (var i = 0; i < enemyUnits.length; i ++) {
                var atkPath = enemyUnits[i].tile.getAttackPath();
                for (var a = 0; a < atkPath.length; a ++) {
                    if (atkPath[a] == this.target) {
                        needsBlocker = true;
                        for (var b = 0; b < atkPath.length; b ++) {
                            if (atkPath[b].contents && atkPath.contents.owner == this) needsBlocker = false;
                        }
                        break unitloop;
                    }
                }
            }
            if (needsBlocker) utility += OPEN_DEF_VALUE;
            if (needsBlocker && card.movement == UnitMovement.SITTER) utility += OPEN_DEF_VALUE;
            else {
                for (var i = 0; i < enemyUnits.length; i ++) {
                    var atkPath = enemyUnits[i].tile.getAttackPath();
                    if (enemyUnits[i].movement == UnitMovement.JUMPER && atkPath.length == 3 && target == this.board.getTiles()[0])  utility += OPEN_DEF_VALUE;
                }
            }
            
            // If you place a shooter in the open subtract RANGED_MISUSE_VALUE
            if (card.movement == UnitMovement.SHOOTER) {
                var defenseSpaces = target.defendedBy;
                var open = false;
                if (defenseSpaces == null) open = true;
                else {
                    for (var i = 0; i < defenseSpaces.length; i ++) {
                        if (defenseSpaces[i].contents == null) open = true;
                    }
                }
                if (open) utility -= RANGED_MISUSE_VALUE;
            }
            
            // If you place a sitter behind units subtract DEFENDER_MISUSE_VALUE
            if (card.movement == UnitMovement.SITTER) {
                var defenseSpaces = target.defendedBy;
                var clear = false;
                if (defenseSpaces != null) {
                    for (var i = 0; i < defenseSpaces.length; i ++) {
                        if (defenseSpaces[i].contents == null) clear = true;
                    }
                }
                if (clear || defenseSpaces != null) utility -= DEFENDER_MISUSE_VALUE;
            }
            
            // If you place a UnitMovement.MELEE unit to where it will collide subtract UnitMovement.MELEE_MISUSE_VALUE
            if (card.movement == UnitMovement.SITTER) {
                var attackPath = target.getAttackPath();
                var clear = true;
                for (var i = 0; i < attackPath.length; i ++) {
                    if (attackPath[i].contents && attackPath[i].contents.owner == this) clear = false;
                }
                if (clear) utility -= UnitMovement.MELEE_MISUSE_VALUE;
            }
        }
    }
    else if (card.type == CardTypes.TARGET_SPELL_CARD) {
        // If a spell would kill a target add KILLSHOT_VALUE
        if (target.contents && target.contents.hP - card.attack <= 0) utility += KILLSHOT_VALUE;
    }
    
    return utility;
};
