diamondrun
==========

### local setup

`git clone https://github.com/digitalfruit/limejs.git`

`cd limejs`

`bin/lime.py init`

`bin/lime.py create diamondrun`
	-delete auto-generated files diamondrun/diamondrun.js and diamondrun/diamondrun.html

`git clone git@github.com:robftz/diamondrun.git`

`python bin/lime.py update`

`open diamondrun/diamondrun.html`

Setup Notes for Windows Users:
	-Make sure python 2.6+ is installed and in your PATH variables
	
	
Fix a bug in lime around spritesheets:

limejs/lime/src/helper/parser/json.js

Change line 41: `for(var i in root){`

To: `for (var i = 0; i < root.length; i ++) {`
    
