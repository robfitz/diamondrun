goog.provide('diamondrun.Util');

// Utility functions for diamondrun
diamondrun.Util = function() {
    goog.base(this);
};

goog.inherits(diamondrun.Util, lime.Node);

// Interpolation between two vectors
diamondrun.Util.prototype.lerp = function(a, b, t) {
    var len = a.length;
    if(b.length != len) return;

    var x = [];
    for(var i = 0; i < len; i++)
        x.push(a[i] + t * (b[i] - a[i]));
    return x;
};