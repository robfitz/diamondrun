//set main namespace
goog.provide('diamondrun');

//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');

goog.require('diamondrun.Tile');
goog.require('diamondrun.Hand');
goog.require('diamondrun.Deck');
goog.require('diamondrun.Graveyard');
goog.require('diamondrun.Player');

var IPHONE_4_W = 640;
var IPHONE_4_H = 960;

var Commands = {
    history: [],
    queue: [],
    add: function(command) {
        this.queue.push(command);
    },
    doNext: function() {
        var cmd = this.queue.shift();
        if (cmd) {
            this.history.push(cmd);
            cmd.execute();
        }
    }
};

// entrypoint
diamondrun.start = function(){

    var director = new lime.Director(document.body,IPHONE_4_W,IPHONE_4_H),
        scene = new lime.Scene(),
        enemy_board = new diamondrun.Board(false).setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 - 265);

    var player = new diamondrun.Player();


    scene.appendChild(player.getBoard()).appendChild(enemy_board).appendChild(player.getGraveyard()).appendChild(player.getHand());

    for (var i = 0; i < 5; i ++) {
        player.getHand().drawCard();
    }

    director.makeMobileWebAppCapable();

    // set current scene active
    director.replaceScene(scene);
    lime.scheduleManager.schedule(function(dt) {
        Commands.doNext();
    });

}

goog.exportSymbol('diamondrun.start', diamondrun.start);
