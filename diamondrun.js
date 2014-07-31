//set main namespace
goog.provide('diamondrun');

//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Sprite');
goog.require('lime.Layer');

goog.require('lime.animation.Spawn');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.FadeTo');
goog.require('lime.animation.ColorTo');

goog.require('diamondrun.Tile');
goog.require('diamondrun.Hand');
goog.require('diamondrun.Deck');
goog.require('diamondrun.Graveyard');
goog.require('diamondrun.Player');
goog.require('diamondrun.AIPlayer');
goog.require('diamondrun.Rubble');
goog.require('diamondrun.Effect');

var IPHONE_4_W = 640;
var IPHONE_4_H = 960;

var game = {
    player1: null, //friendly
    player2: null, //enemy
    turn: 0,
    unitLayer: null,
    director: null,
    cardFactory: null
}

var Phases = {
    p1_start: 0,
    p1_draw: 1,
    p1_play1: 2,
    p1_attack: 3,
    p1_play2: 4,
    p1_end: 5,

    p2_start: 6,
    p2_draw: 7,
    p2_play1: 8,
    p2_attack: 9,
    p2_play2: 10,
    p2_end: 11,

    current: -1,

    next: function() {

        this.current ++;

        if (this.current > Phases.p2_end) {
            this.current = 0;  
            game.turn ++;
        }

        switch (this.current) {

            case Phases.p1_start:
                // Signal P1 board that turn is starting
                game.player1.board.startTurn();
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p1_draw:
                var drawNum = 2;
                if (game.turn == 0) { 
                    drawNum = 4;
                    this.current = 3; // Probably bad practice but couldn't think of a more concise way to implement the first turn play order.
                }
                
                Commands.add(new diamondrun.DrawCardCommand(game.player1, drawNum));
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p1_play1:
            case Phases.p1_play2:
                game.player1.hand.refreshCardLocations();
                //wait for user action
                game.player1.beginPlayPhase(function() {
                    Commands.add(new diamondrun.NextPhaseCommand());
                });
                break;

            case Phases.p1_attack:
                game.player1.doAttack();
                break;

            case Phases.p1_end:
                // Signal P2 board that turn is ending
                game.player1.board.endTurn();
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p2_start:
                // Signal P2 board that turn is starting
                game.player2.board.startTurn();
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p2_play1:
            case Phases.p2_play2:
                game.player2.beginPlayPhase(function() {
                    Commands.add(new diamondrun.NextPhaseCommand());
                });
                break;
            
            case Phases.p2_attack:
                game.player2.doAttack();
                break;

            case Phases.p2_draw:
                var drawNum = 2;
                if (game.turn == 0) drawNum = 6;
                
                Commands.add(new diamondrun.DrawCardCommand(game.player2, drawNum));
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p2_end:
                // Signal P2 board that turn is ending
                game.player2.board.endTurn();
                Commands.add(new diamondrun.NextPhaseCommand());
                break;
        }
    }


};

var Commands = {
    history: [],
    queue: [],
    add: function(command) {
        this.queue.push(command);
    },
    doNext: function() {
        if (this.queue.length > 0) {
            var cmd = this.queue.shift();
            cmd.execute();
            this.history.push(cmd);    
        }
    }
};

function style(game) {

    var p1Tiles = game.player1.board.getTiles().slice(0);
    var p2Tiles = game.player2.board.getTiles().slice(0);
    p1Tiles.shuffle();
    p2Tiles.shuffle();

    var delay = 0;

    for (var i = 0; i < p1Tiles.length; i ++) {

        var t1 = p1Tiles[i];
        var t2 = p2Tiles[i];

        t1.setSize(TILE_SIZE, TILE_SIZE).setFill(255,255,255, 0.1);
        t2.setSize(TILE_SIZE, TILE_SIZE).setFill(255,255,255, 0.1);

        t1.runAction(new lime.animation.Sequence(
            new lime.animation.FadeTo(1).setDuration(delay),
            new lime.animation.Spawn(
                new lime.animation.ColorTo(255, 255, 255, 1),
                new lime.animation.RotateBy(90)
            ).setDuration(0.3)
        ));

        t2.runAction(new lime.animation.Sequence(
            new lime.animation.FadeTo(1).setDuration(delay),
            new lime.animation.Spawn(
                new lime.animation.ColorTo(255, 255, 255, 1),
                new lime.animation.RotateBy(90)
            ).setDuration(0.3)
        ));

        delay += 0.2;
    }
}

// entrypoint
diamondrun.start = function(){
    
    game.director = new lime.Director(document.body,IPHONE_4_W,IPHONE_4_H);
    var scene = new lime.Scene();

    game.background = new lime.Sprite();
    game.background.setSize(IPHONE_4_W, IPHONE_4_H).setFill(0, 0, 0).setAnchorPoint(0, 0);

    scene.appendChild(game.background);
    
    // set current scene active
    game.director.replaceScene(scene);
    
    game.cardFactory = new diamondrun.CardFactory();

    game.effectLayer = new lime.Layer();
    game.unitLayer = new lime.Layer();
    game.rubbleLayer = new lime.Layer();
    game.UILayer = new lime.Layer();

    var player = new diamondrun.Player(true);
    game.player1 = player;
    
    game.player2 = new diamondrun.AIPlayer(false);
    game.player2.getBoard().setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 - 265);

    scene.appendChild(player.getBoard()).appendChild(game.player2.getBoard()).appendChild(player.getHand()).appendChild(game.rubbleLayer).appendChild(game.unitLayer).appendChild(game.effectLayer).appendChild(game.UILayer);

    var phase_label = new lime.Label().setText('P').setPosition(500, 50).setFontColor("White");
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
};

goog.exportSymbol('diamondrun.start', diamondrun.start);


Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Array.prototype.shuffle = function() {
    var counter = this.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = (Math.random() * counter--) | 0;

        // And swap the last element with it
        temp = this[counter];
        this[counter] = this[index];
        this[index] = temp;
    }
};
