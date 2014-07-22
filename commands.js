goog.provide('diamondrun.PlayCardCommand');
goog.provide('diamondrun.TimeOutCommand');
goog.provide('diamondrun.DrawCardCommand');
goog.provide('diamondrun.NextPhaseCommand');
goog.provide('diamondrun.EndGameCommand');

goog.require('lime.transitions.SlideInRight');
goog.require('lime.transitions.SlideInLeft');
goog.require('lime.transitions.SlideInUp');
goog.require('lime.GlossyButton');


diamondrun.PlayCardCommand = function(player, card, targetTile) {
    this.player = player;
    this.card = card;
    this.targetTile = targetTile;
};

diamondrun.PlayCardCommand.prototype.execute = function() {
    if (this.targetTile == this.player.getBoard().techTile) {
        this.targetTile.addCard();
    }
    else {
        if (this.card.units.length > 0) {
            switch (this.card.targetBehaviour) {
                // Will probably be worthwhile to make enums for targetBehaviour data 
                case 'targeted': 
                    this.card.units[0].play(this.targetTile);
                    this.targetTile.addUnit(this.card.units[0]);
                    break;
                case 'random':
                    var tar = this.player.board.getValidTargets(this.card);
                    tar = tar[Math.floor((Math.random() * tar.length))];
                    
                    this.card.units[0].play(tar);
                    tar.addUnit(this.card.units[0]);
                    break;
                case 'targeted-row':
                    var tar = this.targetTile.getRow();
                    
                    for (var t = 0; t < tar.length; t ++) {
                        this.card.units[t].play(tar[t]);
                        tar[t].addUnit(this.card.units[t]);
                    }
                    break;
                case 'targeted-path':
                    // Retrieve this tiles and all tiles behind it (on both sides of the field)
                    var tar = this.targetTile.getAttackPath()[0].getAttackPath();
                    
                    for (var t = 0; t < tar.length; t ++) {
                        this.card.units[t].play(tar[t]);
                        tar[t].addUnit(this.card.units[t]);
                    }
                    break;
                case 'all-valid':
                    var tar = this.player.board.getValidTargets(this.card);
                    
                    // Remove Tech tile from valid targets
                    tar.pop()
                    for (var t = 0; t < tar.length; t ++) {
                        this.card.units[t].play(tar[t]);
                        tar[t].addUnit(this.card.units[t]);
                    }
                    break;
            }
        }
        
        if (this.card.effects) {
            for (var i = 0; i < this.card.effects.length; i++) {
                switch (this.card.effects[i].targetType) {
                   case 'self':
                        this.card.effects[i].play(this.targetTile);
                        this.targetTile.addEffect(this.card.effects[i]);
                        break;
                    case'opponent':
                        this.targetTile.addEffect(this.card.effects[i]);
                        break;
                    case 'targeted':
                        this.card.effects[i].play(this.targetTile);
                        this.targetTile.addEffect(this.card.effects[i]);
                        break;
                    case 'targeted-row':
                        var tar = this.targetTile.getRow();
                        if (i < tar.length) {
                            this.card.effects[i].play(tar[i]);
                            console.log(this.card.effects[i]);
                            tar[i].addEffect(this.card.effects[i]);
                        }
                        break;
                    case 'targeted-path':
                        // Retrieve this tiles and all tiles behind it (on both sides of the field)
                        var tar = this.targetTile.getAttackPath()[0].getAttackPath();
                        if (i < tar.length) {
                            this.card.effects[i].play(tar[i]);
                            tar[i].addEffect(this.card.effects[i]);
                        }
                        break;
                    case 'random':
                        this.targetTile.addEffect(this.card.effects[i]);
                        break;
                    case 'all-valid':
                        this.targetTile.addEffect(this.card.effects[i]);
                        break;
                }
                if (this.targetTile != this.player.getBoard().techTile) this.card.effects[i].activate();
            }
        }
    }
    // move from hand to graveyard
    this.player.getGraveyard().takeCard(this.card);
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.TimeOutCommand = function() {
    if (game.player1.canActThisPhase) this.player = game.player1;
    else this.player = game.player2;
    this.card = this.player.getHand().cards[0];
    this.targetTile = this.player.board.techTile;
};

diamondrun.TimeOutCommand.prototype.execute = function() {
    // Need to pass something into Tech Tile
    var effect = new diamondrun.Effect(this.player, this.targetTile, this.card.type, this.card.attack);
    this.targetTile.addEffect(effect)
    
    // move from hand to graveyard
    this.player.getGraveyard().takeCard(this.card);
    this.player.endPlayPhase();
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.DrawCardCommand = function(player, numCards) {
    this.player = player;
    this.numCards = numCards;
};

diamondrun.DrawCardCommand.prototype.execute = function() {
    for (var i = 0; i < this.numCards; i ++) {
        this.player.draw(i);
    }
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.NextPhaseCommand = function() {
};

diamondrun.NextPhaseCommand.prototype.execute = function() {
    Phases.next();
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

diamondrun.EndGameCommand = function(loser) {
    this.loser = loser;
    //if (this.loser == game.player1) this.winner = game.player1; // Unnecassary now, might be useful later.
    //else this.winner = game.player2;
};

diamondrun.EndGameCommand.prototype.execute = function() {
    var gameOverScene = new lime.Scene();
    var newBackground = new lime.Sprite().setSize(IPHONE_4_W, IPHONE_4_H).setFill(255, 255, 255).setAnchorPoint(0, 0);
    var button = new lime.GlossyButton("New Game").setPosition(IPHONE_4_W/2, IPHONE_4_H*2/3).setSize(150, 38).setRenderer(lime.Renderer.CANVAS);
    goog.events.listen(button, 'click', newGame);
    
    var title = new lime.Label().setPosition(IPHONE_4_W/2, IPHONE_4_H/3).setFontSize(72);
    var transition;
    
    gameOverScene.appendChild(game.background)
    if (this.loser.isPlayer1) {
        title.setText("You Lose").setFontColor("Red");
        transition = lime.transitions.SlideInRight;
    }
    else {
        title.setText("You Win").setFontColor("Blue");
        transition = lime.transitions.SlideInLeft;
    }
    gameOverScene.appendChild(newBackground).appendChild(title).appendChild(button);
    
    game.director.replaceScene(gameOverScene, transition);
};

// --------------------------------------------------------------------------------------------------------------------------- Class Seperator

var newGame = function() {
    var oldDirector = game.director; 
    game = {
        player1: null, //friendly
        player2: null, //enemy
        turn: 0,
        unitLayer: null,
        director: null,
        cardFactory: null
    }
    game.director = oldDirector;
    
    Phases.current = -1;

    var scene = new lime.Scene();

    game.background = new lime.Sprite();
    game.background.setSize(IPHONE_4_W, IPHONE_4_H).setFill(0, 0, 0).setAnchorPoint(0, 0);

    scene.appendChild(game.background);
    
    game.cardFactory = new diamondrun.CardFactory();


    var player = new diamondrun.Player(true);
    game.player1 = player;
    
    game.player2 = new diamondrun.AIPlayer(false);
    game.player2.getBoard().setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 - 265);

    game.effectLayer = new lime.Layer();
    game.unitLayer = new lime.Layer();
    game.rubbleLayer = new lime.Layer();

    scene.appendChild(player.getBoard()).appendChild(game.player2.getBoard()).appendChild(player.getHand()).appendChild(game.rubbleLayer).appendChild(game.unitLayer).appendChild(game.effectLayer);

    // set current scene active
    game.director.replaceScene(scene, lime.transitions.SlideInUp);
    
    var phase_label = new lime.Label().setText('P').setPosition(50, 50);
    scene.appendChild(phase_label);
    lime.scheduleManager.schedule(function(dt) {
        phase_label.setText('P' + Phases.current);
    });

    game.director.makeMobileWebAppCapable();

    lime.scheduleManager.schedule(function(dt) {
        Commands.doNext();
    });

    //Commands.add(new diamondrun.NextPhaseCommand());
    Phases.next();
    
    player.getBoard().connectAttackPaths(game.player2.getBoard());
    game.player2.getBoard().connectAttackPaths(player.getBoard());

    style(game);
}