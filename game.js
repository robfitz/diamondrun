goog.provide('diamondrun.Player');


diamondrun.Player = function(isPlayer1, board, hand, deck, graveyard) {
    this.board = new diamondrun.Board(isPlayer1).setPosition(IPHONE_4_W / 2, IPHONE_4_H / 2 + 265);
	this.board.owner = this;
    this.graveyard = new diamondrun.Graveyard().setPosition(IPHONE_4_W - 110, IPHONE_4_H - 110);
    this.hand = new diamondrun.Hand(this).setPosition(IPHONE_4_W / 2, IPHONE_4_H - 50 - 5);
    this.deck = new diamondrun.Deck(this);
    this.activeEffects = [];
    
    this.techLevel = 1;
    this.life = 10;
    this.canActThisPhase = false;
    this.actionCallback = null;
    this.isPlayer1 = isPlayer1;
    
    // Start of just UI stuff
    // TODO: Possibly seperate into its own class
    if(isPlayer1) this.lifeLabel = new lime.Label(this.life).setPosition(250 * 1, 0);
    else this.lifeLabel = new lime.Label(this.life).setPosition( 250 * -1, 0);
    this.lifeLabel.setFontSize(100).setAlign("center").setFontColor('white');
    
    this.timerBar = new lime.Sprite().setPosition(-IPHONE_4_W,-TILE_SIZE*2.5 - TILE_SPACING * 3).setSize(IPHONE_4_W, TILE_SPACING).setFill(100,100,100);
    var button4 = new lime.GlossyButton("Menu").setPosition(IPHONE_4_W /12, 40).setSize(IPHONE_4_W/6, 38).setRenderer(lime.Renderer.CANVAS);
    var self = this;
    
    goog.events.listen(button4, 'click', function() {
        // TODO: fix bug that calls this twice.
        Commands.add(new diamondrun.MenuToggleCommand(self));
    });
    
    this.board.appendChild(this.timerBar);
    this.board.appendChild(this.lifeLabel);
    
    // Player settings
    this.soundOn = true;
    this.sideBar = new lime.Sprite().setSize(IPHONE_4_W/6, IPHONE_4_H).setFill(200, 200, 200).setAnchorPoint(0, 0);  
    var button = new lime.GlossyButton("Sound").setPosition(IPHONE_4_W /12, IPHONE_4_H - 126).setSize(IPHONE_4_W/6, 38).setRenderer(lime.Renderer.CANVAS);
    var button2 = new lime.GlossyButton("Options").setPosition(IPHONE_4_W /12, IPHONE_4_H - 88).setSize(IPHONE_4_W/6, 38).setRenderer(lime.Renderer.CANVAS);
    var button3 = new lime.GlossyButton("Surrender").setPosition(IPHONE_4_W /12, IPHONE_4_H - 50).setSize(IPHONE_4_W/6, 38).setRenderer(lime.Renderer.CANVAS);
    
    this.sideBar.runAction(new lime.animation.MoveTo(-IPHONE_4_W/6, 0).setDuration(0));
    
    game.UILayer.appendChild(this.sideBar.appendChild(button).appendChild(button2).appendChild(button3)).appendChild(button4);
};

diamondrun.Player.prototype.doAttack = function() {
    // Run through all the units on my side and tell them to figure out their attack, which will cause them to add a bunch of animations 
    // and other stuff to the animation queue. once the animations are done, we can go ahead to the next phase
    var callbacks = [];
    var units = this.board.getUnits();
    var contexts = [];
    
    // Next Phase if player has no units
    if (units.length == 0) {
        Commands.add(new diamondrun.NextPhaseCommand());
        return;
    }
    
    // Run through units
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

};

diamondrun.Player.prototype.playCard = function(card, tile) {
    // Remove Timer
    lime.scheduleManager.unschedule(this.timeOver, this);

    var cmd = new diamondrun.PlayCardCommand(this, card, tile);
    Commands.add(cmd);

    // End phase needs to wait for animation if spell. TODO: Possibly use callbacks to accomplish.
    this.endPlayPhase();     
};

diamondrun.Player.prototype.endPlayPhase = function() {    
    for (var i = 0; i < this.hand.cards.length; i ++) {
    // this.hands.cards[i].disableDragging();
    }
    this.canActThisPhase = false;
    if (this.actionCallback) {
        this.actionCallback();
        this.actionCallback = null;
    }
};

diamondrun.Player.prototype.beginPlayPhase = function(callback) {
    // Begin timer for this play phase
    this.turnTimer = lime.scheduleManager.callAfter(this.timeOver, this, 10000);
    this.timerBar.setPosition(0,-TILE_SIZE*2.5 - TILE_SPACING * 3);
    this.timerBar.runAction(new lime.animation.MoveTo(-IPHONE_4_W,-TILE_SIZE*2.5 - TILE_SPACING * 3).setDuration(10).setEasing(lime.animation.Easing.LINEAR));
    
    // Update current tech level
    this.techLevel = this.board.techTile.techLevel;
    
    this.canActThisPhase = true;
    this.actionCallback = callback;
	
    for (var i = 0; i < this.hand.cards.length; i ++) {
    // this.hand.cards[i].enableDragging();
    }
};

diamondrun.Player.prototype.timeOver = function() {
    Commands.add(new diamondrun.TimeOutCommand());
};

diamondrun.Player.prototype.takeDamage = function(damage) {
    // Ignore leftover callbacks after game is over.
    if (this.life > 0) {
        this.life -= damage;
        this.lifeLabel.setText(this.life);
        
        // Check if this user has lost.
        if (this.life <= 0) this.lose();
    }
};

diamondrun.Player.prototype.lose = function() {
    // TODO: refactor for networking/multiplayer
    Commands.add(new diamondrun.EndGameCommand(this));
};

diamondrun.Player.prototype.getCanAct = function() {
    return this.canActThisPhase;
};

diamondrun.Player.prototype.draw = function(drawNum) {
    this.hand.drawCard(drawNum);
};

diamondrun.Player.prototype.getBoard = function() {
    return this.board;
};

diamondrun.Player.prototype.getEnemyBoard = function() {
    if (this.isPlayer1) return game.player2.getBoard();
    else return game.player1.getBoard();
};

diamondrun.Player.prototype.getHand = function() {
    return this.hand;
};

diamondrun.Player.prototype.getDeck = function() {
    return this.deck;
};

diamondrun.Player.prototype.getGraveyard = function() {
    return this.graveyard;
};
