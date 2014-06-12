//set main namespace
goog.provide('diamondrun');

//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');
goog.require('lime.Layer');

goog.require('diamondrun.Tile');
goog.require('diamondrun.Hand');
goog.require('diamondrun.Deck');
goog.require('diamondrun.Graveyard');
goog.require('diamondrun.Player');

var IPHONE_4_W = 640;
var IPHONE_4_H = 960;

var game = {
    player1: null, //friendly
    player2: null, //enemy
    turn: 0,
    unitLayer: null
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
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p1_draw:
                var drawNum = 2;
                if (game.turn == 0) drawNum = 5;
                
                Commands.add(new diamondrun.DrawCardCommand(game.player1, drawNum));
                Commands.add(new diamondrun.NextPhaseCommand());
                break;

            case Phases.p1_play1:
            case Phases.p1_play2:
                //wait for user action
                //TODO: add turn timer
                game.player1.beginPlayPhase(function() {
                    Commands.add(new diamondrun.NextPhaseCommand());
                });
                break;

            case Phases.p1_attack:
                //TODO: combat
                console.log('attack');

                //run through all the units on my side and tell them to figure out their attack, which will cause them to add a bunch of animations and other stuff to the animation queue. once the animations are done, we can go ahead to the next phase
                var callbacks = [];
                var units = game.player1.getBoard().getUnits();
                var contexts = [];
                for (var i = units.length - 1; i >= 0; i --) {
                    callbacks.push(units[i].doAttack);
                    contexts.push(units[i]);
                }   
                //TODO: i'm sure i'm going to regret this callback chain
                //sometime soon, but i haven't yet figured out a
                //better way to get the animations and phase advance
                //to happen sequentially
                var firstCall = callbacks.shift();
                var firstContext = contexts.shift();
                firstCall.call(firstContext, contexts, callbacks);
                
                break;

            case Phases.p1_end:
                Commands.add(new diamondrun.NextPhaseCommand());
                break;


            case Phases.p2_start:
            case Phases.p2_draw:
            case Phases.p2_play1:
            case Phases.p2_attack:
            case Phases.p2_play2:
            case Phases.p2_end:
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

// entrypoint
diamondrun.start = function(){

    var director = new lime.Director(document.body,IPHONE_4_W,IPHONE_4_H),
        scene = new lime.Scene(),
        enemy_board = new diamondrun.Board(false).setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 - 265);

    var player = new diamondrun.Player();
    game.player1 = player;

    game.unitLayer = new lime.Layer();

    scene.appendChild(player.getBoard()).appendChild(enemy_board).appendChild(player.getGraveyard()).appendChild(player.getHand()).appendChild(game.unitLayer);

    var phase_label = new lime.Label().setText('P').setPosition(50, 50);
    scene.appendChild(phase_label);
    lime.scheduleManager.schedule(function(dt) {
        phase_label.setText('P' + Phases.current);
    });

    director.makeMobileWebAppCapable();

    // set current scene active
    director.replaceScene(scene);
    lime.scheduleManager.schedule(function(dt) {
        Commands.doNext();
    });

    //Commands.add(new diamondrun.NextPhaseCommand());
    Phases.next();

    player.getBoard().connectAttackPaths(enemy_board);
    enemy_board.connectAttackPaths(player.getBoard());
}

goog.exportSymbol('diamondrun.start', diamondrun.start);


Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};
