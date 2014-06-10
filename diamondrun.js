//set main namespace
goog.provide('diamondrun');

//get requirements
goog.require('lime.Director');
goog.require('lime.Scene');

goog.require('diamondrun.Tile');
goog.require('diamondrun.Hand');
goog.require('diamondrun.Deck');
goog.require('diamondrun.Graveyard');

var IPHONE_4_W = 640;
var IPHONE_4_H = 960;

// entrypoint
diamondrun.start = function(){

    var director = new lime.Director(document.body,IPHONE_4_W,IPHONE_4_H),
        scene = new lime.Scene(),
        friendly_board = new diamondrun.Board(true).setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 + 265),
        enemy_board = new diamondrun.Board(false).setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 - 265),
        graveyard = new diamondrun.Graveyard().setPosition(IPHONE_4_W - 110, IPHONE_4_H - 110);

    scene.appendChild(friendly_board).appendChild(enemy_board).appendChild(graveyard);

    var deck = new diamondrun.Deck(friendly_board, enemy_board, graveyard);
    var hand = new diamondrun.Hand(deck).setPosition(IPHONE_4_W / 2, IPHONE_4_H - 50 - 5);
    scene.appendChild(hand);
    for (var i = 0; i < 5; i ++) {
        hand.draw();
    }

    director.makeMobileWebAppCapable();

    // set current scene active
    director.replaceScene(scene);

}


//this is required for outside access after code is compiled in ADVANCED_COMPILATIONS mode
goog.exportSymbol('diamondrun.start', diamondrun.start);
