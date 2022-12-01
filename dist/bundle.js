/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/3d-view-controls/camera.js":
/*!*************************************************!*\
  !*** ./node_modules/3d-view-controls/camera.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = createCamera

var now         = __webpack_require__(/*! right-now */ "./node_modules/right-now/browser.js")
var createView  = __webpack_require__(/*! 3d-view */ "./node_modules/3d-view/view.js")
var mouseChange = __webpack_require__(/*! mouse-change */ "./node_modules/mouse-change/mouse-listen.js")
var mouseWheel  = __webpack_require__(/*! mouse-wheel */ "./node_modules/mouse-wheel/wheel.js")
var mouseOffset = __webpack_require__(/*! mouse-event-offset */ "./node_modules/mouse-event-offset/index.js")
var hasPassive  = __webpack_require__(/*! has-passive-events */ "./node_modules/has-passive-events/index.js")

function createCamera(element, options) {
  element = element || document.body
  options = options || {}

  var limits  = [ 0.01, Infinity ]
  if('distanceLimits' in options) {
    limits[0] = options.distanceLimits[0]
    limits[1] = options.distanceLimits[1]
  }
  if('zoomMin' in options) {
    limits[0] = options.zoomMin
  }
  if('zoomMax' in options) {
    limits[1] = options.zoomMax
  }

  var view = createView({
    center: options.center || [0,0,0],
    up:     options.up     || [0,1,0],
    eye:    options.eye    || [0,0,10],
    mode:   options.mode   || 'orbit',
    distanceLimits: limits
  })

  var pmatrix = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  var distance = 0.0
  var width   = element.clientWidth
  var height  = element.clientHeight

  var camera = {
    view:               view,
    element:            element,
    delay:              options.delay          || 16,
    rotateSpeed:        options.rotateSpeed    || 1,
    zoomSpeed:          options.zoomSpeed      || 1,
    translateSpeed:     options.translateSpeed || 1,
    flipX:              !!options.flipX,
    flipY:              !!options.flipY,
    modes:              view.modes,
    tick: function() {
      var t = now()
      var delay = this.delay
      view.idle(t-delay)
      view.flush(t-(100+delay*2))
      var ctime = t - 2 * delay
      view.recalcMatrix(ctime)
      var allEqual = true
      var matrix = view.computedMatrix
      for(var i=0; i<16; ++i) {
        allEqual = allEqual && (pmatrix[i] === matrix[i])
        pmatrix[i] = matrix[i]
      }
      var sizeChanged =
          element.clientWidth === width &&
          element.clientHeight === height
      width  = element.clientWidth
      height = element.clientHeight
      if(allEqual) {
        return !sizeChanged
      }
      distance = Math.exp(view.computedRadius[0])
      return true
    },
    lookAt: function(center, eye, up) {
      view.lookAt(view.lastT(), center, eye, up)
    },
    rotate: function(pitch, yaw, roll) {
      view.rotate(view.lastT(), pitch, yaw, roll)
    },
    pan: function(dx, dy, dz) {
      view.pan(view.lastT(), dx, dy, dz)
    },
    translate: function(dx, dy, dz) {
      view.translate(view.lastT(), dx, dy, dz)
    }
  }

  Object.defineProperties(camera, {
    matrix: {
      get: function() {
        return view.computedMatrix
      },
      set: function(mat) {
        view.setMatrix(view.lastT(), mat)
        return view.computedMatrix
      },
      enumerable: true
    },
    mode: {
      get: function() {
        return view.getMode()
      },
      set: function(mode) {
        view.setMode(mode)
        return view.getMode()
      },
      enumerable: true
    },
    center: {
      get: function() {
        return view.computedCenter
      },
      set: function(ncenter) {
        view.lookAt(view.lastT(), ncenter)
        return view.computedCenter
      },
      enumerable: true
    },
    eye: {
      get: function() {
        return view.computedEye
      },
      set: function(neye) {
        view.lookAt(view.lastT(), null, neye)
        return view.computedEye
      },
      enumerable: true
    },
    up: {
      get: function() {
        return view.computedUp
      },
      set: function(nup) {
        view.lookAt(view.lastT(), null, null, nup)
        return view.computedUp
      },
      enumerable: true
    },
    distance: {
      get: function() {
        return distance
      },
      set: function(d) {
        view.setDistance(view.lastT(), d)
        return d
      },
      enumerable: true
    },
    distanceLimits: {
      get: function() {
        return view.getDistanceLimits(limits)
      },
      set: function(v) {
        view.setDistanceLimits(v)
        return v
      },
      enumerable: true
    }
  })

  element.addEventListener('contextmenu', function(ev) {
    ev.preventDefault()
    return false
  })

  var lastX = 0, lastY = 0, lastMods = {shift: false, control: false, alt: false, meta: false}
  mouseChange(element, handleInteraction)

  //enable simple touch interactions
  element.addEventListener('touchstart', function (ev) {
    var xy = mouseOffset(ev.changedTouches[0], element)
    handleInteraction(0, xy[0], xy[1], lastMods)
    handleInteraction(1, xy[0], xy[1], lastMods)

    ev.preventDefault()
  }, hasPassive ? {passive: false} : false)

  element.addEventListener('touchmove', function (ev) {
    var xy = mouseOffset(ev.changedTouches[0], element)
    handleInteraction(1, xy[0], xy[1], lastMods)

    ev.preventDefault()
  }, hasPassive ? {passive: false} : false)

  element.addEventListener('touchend', function (ev) {
    var xy = mouseOffset(ev.changedTouches[0], element)
    handleInteraction(0, lastX, lastY, lastMods)

    ev.preventDefault()
  }, hasPassive ? {passive: false} : false)

  function handleInteraction (buttons, x, y, mods) {
    var scale = 1.0 / element.clientHeight
    var dx    = scale * (x - lastX)
    var dy    = scale * (y - lastY)

    var flipX = camera.flipX ? 1 : -1
    var flipY = camera.flipY ? 1 : -1

    var drot  = Math.PI * camera.rotateSpeed

    var t = now()

    if(buttons & 1) {
      if(mods.shift) {
        view.rotate(t, 0, 0, -dx * drot)
      } else {
        view.rotate(t, flipX * drot * dx, -flipY * drot * dy, 0)
      }
    } else if(buttons & 2) {
      view.pan(t, -camera.translateSpeed * dx * distance, camera.translateSpeed * dy * distance, 0)
    } else if(buttons & 4) {
      var kzoom = camera.zoomSpeed * dy / window.innerHeight * (t - view.lastT()) * 50.0
      view.pan(t, 0, 0, distance * (Math.exp(kzoom) - 1))
    }

    lastX = x
    lastY = y
    lastMods = mods
  }

  mouseWheel(element, function(dx, dy, dz) {
    var flipX = camera.flipX ? 1 : -1
    var flipY = camera.flipY ? 1 : -1
    var t = now()
    if(Math.abs(dx) > Math.abs(dy)) {
      view.rotate(t, 0, 0, -dx * flipX * Math.PI * camera.rotateSpeed / window.innerWidth)
    } else {
      var kzoom = camera.zoomSpeed * flipY * dy / window.innerHeight * (t - view.lastT()) / 100.0
      view.pan(t, 0, 0, distance * (Math.exp(kzoom) - 1))
    }
  }, true)

  return camera
}


/***/ }),

/***/ "./node_modules/3d-view/view.js":
/*!**************************************!*\
  !*** ./node_modules/3d-view/view.js ***!
  \**************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = createViewController

var createTurntable = __webpack_require__(/*! turntable-camera-controller */ "./node_modules/turntable-camera-controller/turntable.js")
var createOrbit     = __webpack_require__(/*! orbit-camera-controller */ "./node_modules/orbit-camera-controller/orbit.js")
var createMatrix    = __webpack_require__(/*! matrix-camera-controller */ "./node_modules/matrix-camera-controller/matrix.js")

function ViewController(controllers, mode) {
  this._controllerNames = Object.keys(controllers)
  this._controllerList = this._controllerNames.map(function(n) {
    return controllers[n]
  })
  this._mode   = mode
  this._active = controllers[mode]
  if(!this._active) {
    this._mode   = 'turntable'
    this._active = controllers.turntable
  }
  this.modes = this._controllerNames
  this.computedMatrix = this._active.computedMatrix
  this.computedEye    = this._active.computedEye
  this.computedUp     = this._active.computedUp
  this.computedCenter = this._active.computedCenter
  this.computedRadius = this._active.computedRadius
}

var proto = ViewController.prototype

proto.flush = function(a0) {
  var cc = this._controllerList
  for (var i = 0; i < cc.length; ++i) {
    cc[i].flush(a0)
  }
}
proto.idle = function(a0) {
  var cc = this._controllerList
  for (var i = 0; i < cc.length; ++i) {
    cc[i].idle(a0)
  }
}
proto.lookAt = function(a0, a1, a2, a3) {
  var cc = this._controllerList
  for (var i = 0; i < cc.length; ++i) {
    cc[i].lookAt(a0, a1, a2, a3)
  }
}
proto.rotate = function(a0, a1, a2, a3) {
  var cc = this._controllerList
  for (var i = 0; i < cc.length; ++i) {
    cc[i].rotate(a0, a1, a2, a3)
  }
}
proto.pan = function(a0, a1, a2, a3) {
  var cc = this._controllerList
  for (var i = 0; i < cc.length; ++i) {
    cc[i].pan(a0, a1, a2, a3)
  }
}
proto.translate = function(a0, a1, a2, a3) {
  var cc = this._controllerList
  for (var i = 0; i < cc.length; ++i) {
    cc[i].translate(a0, a1, a2, a3)
  }
}
proto.setMatrix = function(a0, a1) {
  var cc = this._controllerList
  for (var i = 0; i < cc.length; ++i) {
    cc[i].setMatrix(a0, a1)
  }
}
proto.setDistanceLimits = function(a0, a1) {
  var cc = this._controllerList
  for (var i = 0; i < cc.length; ++i) {
    cc[i].setDistanceLimits(a0, a1)
  }
}
proto.setDistance = function(a0, a1) {
  var cc = this._controllerList
  for (var i = 0; i < cc.length; ++i) {
    cc[i].setDistance(a0, a1)
  }
}

proto.recalcMatrix = function(t) {
  this._active.recalcMatrix(t)
}

proto.getDistance = function(t) {
  return this._active.getDistance(t)
}
proto.getDistanceLimits = function(out) {
  return this._active.getDistanceLimits(out)
}

proto.lastT = function() {
  return this._active.lastT()
}

proto.setMode = function(mode) {
  if(mode === this._mode) {
    return
  }
  var idx = this._controllerNames.indexOf(mode)
  if(idx < 0) {
    return
  }
  var prev  = this._active
  var next  = this._controllerList[idx]
  var lastT = Math.max(prev.lastT(), next.lastT())

  prev.recalcMatrix(lastT)
  next.setMatrix(lastT, prev.computedMatrix)

  this._active = next
  this._mode   = mode

  //Update matrix properties
  this.computedMatrix = this._active.computedMatrix
  this.computedEye    = this._active.computedEye
  this.computedUp     = this._active.computedUp
  this.computedCenter = this._active.computedCenter
  this.computedRadius = this._active.computedRadius
}

proto.getMode = function() {
  return this._mode
}

function createViewController(options) {
  options = options || {}

  var eye       = options.eye    || [0,0,1]
  var center    = options.center || [0,0,0]
  var up        = options.up     || [0,1,0]
  var limits    = options.distanceLimits || [0, Infinity]
  var mode      = options.mode   || 'turntable'

  var turntable = createTurntable()
  var orbit     = createOrbit()
  var matrix    = createMatrix()

  turntable.setDistanceLimits(limits[0], limits[1])
  turntable.lookAt(0, eye, center, up)
  orbit.setDistanceLimits(limits[0], limits[1])
  orbit.lookAt(0, eye, center, up)
  matrix.setDistanceLimits(limits[0], limits[1])
  matrix.lookAt(0, eye, center, up)

  return new ViewController({
    turntable: turntable,
    orbit: orbit,
    matrix: matrix
  }, mode)
}

/***/ }),

/***/ "./node_modules/binary-search-bounds/search-bounds.js":
/*!************************************************************!*\
  !*** ./node_modules/binary-search-bounds/search-bounds.js ***!
  \************************************************************/
/***/ ((module) => {

"use strict";


// (a, y, c, l, h) = (array, y[, cmp, lo, hi])

function ge(a, y, c, l, h) {
  var i = h + 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p >= 0) { i = m; h = m - 1 } else { l = m + 1 }
  }
  return i;
};

function gt(a, y, c, l, h) {
  var i = h + 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p > 0) { i = m; h = m - 1 } else { l = m + 1 }
  }
  return i;
};

function lt(a, y, c, l, h) {
  var i = l - 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p < 0) { i = m; l = m + 1 } else { h = m - 1 }
  }
  return i;
};

function le(a, y, c, l, h) {
  var i = l - 1;
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p <= 0) { i = m; l = m + 1 } else { h = m - 1 }
  }
  return i;
};

function eq(a, y, c, l, h) {
  while (l <= h) {
    var m = (l + h) >>> 1, x = a[m];
    var p = (c !== undefined) ? c(x, y) : (x - y);
    if (p === 0) { return m }
    if (p <= 0) { l = m + 1 } else { h = m - 1 }
  }
  return -1;
};

function norm(a, y, c, l, h, f) {
  if (typeof c === 'function') {
    return f(a, y, c, (l === undefined) ? 0 : l | 0, (h === undefined) ? a.length - 1 : h | 0);
  }
  return f(a, y, undefined, (c === undefined) ? 0 : c | 0, (l === undefined) ? a.length - 1 : l | 0);
}

module.exports = {
  ge: function(a, y, c, l, h) { return norm(a, y, c, l, h, ge)},
  gt: function(a, y, c, l, h) { return norm(a, y, c, l, h, gt)},
  lt: function(a, y, c, l, h) { return norm(a, y, c, l, h, lt)},
  le: function(a, y, c, l, h) { return norm(a, y, c, l, h, le)},
  eq: function(a, y, c, l, h) { return norm(a, y, c, l, h, eq)}
}


/***/ }),

/***/ "./node_modules/cubic-hermite/hermite.js":
/*!***********************************************!*\
  !*** ./node_modules/cubic-hermite/hermite.js ***!
  \***********************************************/
/***/ ((module) => {

"use strict";


function dcubicHermite(p0, v0, p1, v1, t, f) {
  var dh00 = 6*t*t-6*t,
      dh10 = 3*t*t-4*t + 1,
      dh01 = -6*t*t+6*t,
      dh11 = 3*t*t-2*t
  if(p0.length) {
    if(!f) {
      f = new Array(p0.length)
    }
    for(var i=p0.length-1; i>=0; --i) {
      f[i] = dh00*p0[i] + dh10*v0[i] + dh01*p1[i] + dh11*v1[i]
    }
    return f
  }
  return dh00*p0 + dh10*v0 + dh01*p1[i] + dh11*v1
}

function cubicHermite(p0, v0, p1, v1, t, f) {
  var ti  = (t-1), t2 = t*t, ti2 = ti*ti,
      h00 = (1+2*t)*ti2,
      h10 = t*ti2,
      h01 = t2*(3-2*t),
      h11 = t2*ti
  if(p0.length) {
    if(!f) {
      f = new Array(p0.length)
    }
    for(var i=p0.length-1; i>=0; --i) {
      f[i] = h00*p0[i] + h10*v0[i] + h01*p1[i] + h11*v1[i]
    }
    return f
  }
  return h00*p0 + h10*v0 + h01*p1 + h11*v1
}

module.exports = cubicHermite
module.exports.derivative = dcubicHermite

/***/ }),

/***/ "./node_modules/dat.gui/build/dat.gui.module.js":
/*!******************************************************!*\
  !*** ./node_modules/dat.gui/build/dat.gui.module.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "GUI": () => (/* binding */ GUI$1),
/* harmony export */   "color": () => (/* binding */ color),
/* harmony export */   "controllers": () => (/* binding */ controllers),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "dom": () => (/* binding */ dom$1),
/* harmony export */   "gui": () => (/* binding */ gui)
/* harmony export */ });
/**
 * dat-gui JavaScript Controller Library
 * https://github.com/dataarts/dat.gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

function ___$insertStyle(css) {
  if (!css) {
    return;
  }
  if (typeof window === 'undefined') {
    return;
  }

  var style = document.createElement('style');

  style.setAttribute('type', 'text/css');
  style.innerHTML = css;
  document.head.appendChild(style);

  return css;
}

function colorToString (color, forceCSSHex) {
  var colorFormat = color.__state.conversionName.toString();
  var r = Math.round(color.r);
  var g = Math.round(color.g);
  var b = Math.round(color.b);
  var a = color.a;
  var h = Math.round(color.h);
  var s = color.s.toFixed(1);
  var v = color.v.toFixed(1);
  if (forceCSSHex || colorFormat === 'THREE_CHAR_HEX' || colorFormat === 'SIX_CHAR_HEX') {
    var str = color.hex.toString(16);
    while (str.length < 6) {
      str = '0' + str;
    }
    return '#' + str;
  } else if (colorFormat === 'CSS_RGB') {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  } else if (colorFormat === 'CSS_RGBA') {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  } else if (colorFormat === 'HEX') {
    return '0x' + color.hex.toString(16);
  } else if (colorFormat === 'RGB_ARRAY') {
    return '[' + r + ',' + g + ',' + b + ']';
  } else if (colorFormat === 'RGBA_ARRAY') {
    return '[' + r + ',' + g + ',' + b + ',' + a + ']';
  } else if (colorFormat === 'RGB_OBJ') {
    return '{r:' + r + ',g:' + g + ',b:' + b + '}';
  } else if (colorFormat === 'RGBA_OBJ') {
    return '{r:' + r + ',g:' + g + ',b:' + b + ',a:' + a + '}';
  } else if (colorFormat === 'HSV_OBJ') {
    return '{h:' + h + ',s:' + s + ',v:' + v + '}';
  } else if (colorFormat === 'HSVA_OBJ') {
    return '{h:' + h + ',s:' + s + ',v:' + v + ',a:' + a + '}';
  }
  return 'unknown format';
}

var ARR_EACH = Array.prototype.forEach;
var ARR_SLICE = Array.prototype.slice;
var Common = {
  BREAK: {},
  extend: function extend(target) {
    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
      var keys = this.isObject(obj) ? Object.keys(obj) : [];
      keys.forEach(function (key) {
        if (!this.isUndefined(obj[key])) {
          target[key] = obj[key];
        }
      }.bind(this));
    }, this);
    return target;
  },
  defaults: function defaults(target) {
    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
      var keys = this.isObject(obj) ? Object.keys(obj) : [];
      keys.forEach(function (key) {
        if (this.isUndefined(target[key])) {
          target[key] = obj[key];
        }
      }.bind(this));
    }, this);
    return target;
  },
  compose: function compose() {
    var toCall = ARR_SLICE.call(arguments);
    return function () {
      var args = ARR_SLICE.call(arguments);
      for (var i = toCall.length - 1; i >= 0; i--) {
        args = [toCall[i].apply(this, args)];
      }
      return args[0];
    };
  },
  each: function each(obj, itr, scope) {
    if (!obj) {
      return;
    }
    if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
      obj.forEach(itr, scope);
    } else if (obj.length === obj.length + 0) {
      var key = void 0;
      var l = void 0;
      for (key = 0, l = obj.length; key < l; key++) {
        if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
          return;
        }
      }
    } else {
      for (var _key in obj) {
        if (itr.call(scope, obj[_key], _key) === this.BREAK) {
          return;
        }
      }
    }
  },
  defer: function defer(fnc) {
    setTimeout(fnc, 0);
  },
  debounce: function debounce(func, threshold, callImmediately) {
    var timeout = void 0;
    return function () {
      var obj = this;
      var args = arguments;
      function delayed() {
        timeout = null;
        if (!callImmediately) func.apply(obj, args);
      }
      var callNow = callImmediately || !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(delayed, threshold);
      if (callNow) {
        func.apply(obj, args);
      }
    };
  },
  toArray: function toArray(obj) {
    if (obj.toArray) return obj.toArray();
    return ARR_SLICE.call(obj);
  },
  isUndefined: function isUndefined(obj) {
    return obj === undefined;
  },
  isNull: function isNull(obj) {
    return obj === null;
  },
  isNaN: function (_isNaN) {
    function isNaN(_x) {
      return _isNaN.apply(this, arguments);
    }
    isNaN.toString = function () {
      return _isNaN.toString();
    };
    return isNaN;
  }(function (obj) {
    return isNaN(obj);
  }),
  isArray: Array.isArray || function (obj) {
    return obj.constructor === Array;
  },
  isObject: function isObject(obj) {
    return obj === Object(obj);
  },
  isNumber: function isNumber(obj) {
    return obj === obj + 0;
  },
  isString: function isString(obj) {
    return obj === obj + '';
  },
  isBoolean: function isBoolean(obj) {
    return obj === false || obj === true;
  },
  isFunction: function isFunction(obj) {
    return obj instanceof Function;
  }
};

var INTERPRETATIONS = [
{
  litmus: Common.isString,
  conversions: {
    THREE_CHAR_HEX: {
      read: function read(original) {
        var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
        if (test === null) {
          return false;
        }
        return {
          space: 'HEX',
          hex: parseInt('0x' + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
        };
      },
      write: colorToString
    },
    SIX_CHAR_HEX: {
      read: function read(original) {
        var test = original.match(/^#([A-F0-9]{6})$/i);
        if (test === null) {
          return false;
        }
        return {
          space: 'HEX',
          hex: parseInt('0x' + test[1].toString(), 0)
        };
      },
      write: colorToString
    },
    CSS_RGB: {
      read: function read(original) {
        var test = original.match(/^rgb\(\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*\)/);
        if (test === null) {
          return false;
        }
        return {
          space: 'RGB',
          r: parseFloat(test[1]),
          g: parseFloat(test[2]),
          b: parseFloat(test[3])
        };
      },
      write: colorToString
    },
    CSS_RGBA: {
      read: function read(original) {
        var test = original.match(/^rgba\(\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*,\s*(\S+)\s*\)/);
        if (test === null) {
          return false;
        }
        return {
          space: 'RGB',
          r: parseFloat(test[1]),
          g: parseFloat(test[2]),
          b: parseFloat(test[3]),
          a: parseFloat(test[4])
        };
      },
      write: colorToString
    }
  }
},
{
  litmus: Common.isNumber,
  conversions: {
    HEX: {
      read: function read(original) {
        return {
          space: 'HEX',
          hex: original,
          conversionName: 'HEX'
        };
      },
      write: function write(color) {
        return color.hex;
      }
    }
  }
},
{
  litmus: Common.isArray,
  conversions: {
    RGB_ARRAY: {
      read: function read(original) {
        if (original.length !== 3) {
          return false;
        }
        return {
          space: 'RGB',
          r: original[0],
          g: original[1],
          b: original[2]
        };
      },
      write: function write(color) {
        return [color.r, color.g, color.b];
      }
    },
    RGBA_ARRAY: {
      read: function read(original) {
        if (original.length !== 4) return false;
        return {
          space: 'RGB',
          r: original[0],
          g: original[1],
          b: original[2],
          a: original[3]
        };
      },
      write: function write(color) {
        return [color.r, color.g, color.b, color.a];
      }
    }
  }
},
{
  litmus: Common.isObject,
  conversions: {
    RGBA_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
          return {
            space: 'RGB',
            r: original.r,
            g: original.g,
            b: original.b,
            a: original.a
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          r: color.r,
          g: color.g,
          b: color.b,
          a: color.a
        };
      }
    },
    RGB_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
          return {
            space: 'RGB',
            r: original.r,
            g: original.g,
            b: original.b
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          r: color.r,
          g: color.g,
          b: color.b
        };
      }
    },
    HSVA_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
          return {
            space: 'HSV',
            h: original.h,
            s: original.s,
            v: original.v,
            a: original.a
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          h: color.h,
          s: color.s,
          v: color.v,
          a: color.a
        };
      }
    },
    HSV_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
          return {
            space: 'HSV',
            h: original.h,
            s: original.s,
            v: original.v
          };
        }
        return false;
      },
      write: function write(color) {
        return {
          h: color.h,
          s: color.s,
          v: color.v
        };
      }
    }
  }
}];
var result = void 0;
var toReturn = void 0;
var interpret = function interpret() {
  toReturn = false;
  var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
  Common.each(INTERPRETATIONS, function (family) {
    if (family.litmus(original)) {
      Common.each(family.conversions, function (conversion, conversionName) {
        result = conversion.read(original);
        if (toReturn === false && result !== false) {
          toReturn = result;
          result.conversionName = conversionName;
          result.conversion = conversion;
          return Common.BREAK;
        }
      });
      return Common.BREAK;
    }
  });
  return toReturn;
};

var tmpComponent = void 0;
var ColorMath = {
  hsv_to_rgb: function hsv_to_rgb(h, s, v) {
    var hi = Math.floor(h / 60) % 6;
    var f = h / 60 - Math.floor(h / 60);
    var p = v * (1.0 - s);
    var q = v * (1.0 - f * s);
    var t = v * (1.0 - (1.0 - f) * s);
    var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
    return {
      r: c[0] * 255,
      g: c[1] * 255,
      b: c[2] * 255
    };
  },
  rgb_to_hsv: function rgb_to_hsv(r, g, b) {
    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    var delta = max - min;
    var h = void 0;
    var s = void 0;
    if (max !== 0) {
      s = delta / max;
    } else {
      return {
        h: NaN,
        s: 0,
        v: 0
      };
    }
    if (r === max) {
      h = (g - b) / delta;
    } else if (g === max) {
      h = 2 + (b - r) / delta;
    } else {
      h = 4 + (r - g) / delta;
    }
    h /= 6;
    if (h < 0) {
      h += 1;
    }
    return {
      h: h * 360,
      s: s,
      v: max / 255
    };
  },
  rgb_to_hex: function rgb_to_hex(r, g, b) {
    var hex = this.hex_with_component(0, 2, r);
    hex = this.hex_with_component(hex, 1, g);
    hex = this.hex_with_component(hex, 0, b);
    return hex;
  },
  component_from_hex: function component_from_hex(hex, componentIndex) {
    return hex >> componentIndex * 8 & 0xFF;
  },
  hex_with_component: function hex_with_component(hex, componentIndex, value) {
    return value << (tmpComponent = componentIndex * 8) | hex & ~(0xFF << tmpComponent);
  }
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var Color = function () {
  function Color() {
    classCallCheck(this, Color);
    this.__state = interpret.apply(this, arguments);
    if (this.__state === false) {
      throw new Error('Failed to interpret color arguments');
    }
    this.__state.a = this.__state.a || 1;
  }
  createClass(Color, [{
    key: 'toString',
    value: function toString() {
      return colorToString(this);
    }
  }, {
    key: 'toHexString',
    value: function toHexString() {
      return colorToString(this, true);
    }
  }, {
    key: 'toOriginal',
    value: function toOriginal() {
      return this.__state.conversion.write(this);
    }
  }]);
  return Color;
}();
function defineRGBComponent(target, component, componentHexIndex) {
  Object.defineProperty(target, component, {
    get: function get$$1() {
      if (this.__state.space === 'RGB') {
        return this.__state[component];
      }
      Color.recalculateRGB(this, component, componentHexIndex);
      return this.__state[component];
    },
    set: function set$$1(v) {
      if (this.__state.space !== 'RGB') {
        Color.recalculateRGB(this, component, componentHexIndex);
        this.__state.space = 'RGB';
      }
      this.__state[component] = v;
    }
  });
}
function defineHSVComponent(target, component) {
  Object.defineProperty(target, component, {
    get: function get$$1() {
      if (this.__state.space === 'HSV') {
        return this.__state[component];
      }
      Color.recalculateHSV(this);
      return this.__state[component];
    },
    set: function set$$1(v) {
      if (this.__state.space !== 'HSV') {
        Color.recalculateHSV(this);
        this.__state.space = 'HSV';
      }
      this.__state[component] = v;
    }
  });
}
Color.recalculateRGB = function (color, component, componentHexIndex) {
  if (color.__state.space === 'HEX') {
    color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
  } else if (color.__state.space === 'HSV') {
    Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
  } else {
    throw new Error('Corrupted color state');
  }
};
Color.recalculateHSV = function (color) {
  var result = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
  Common.extend(color.__state, {
    s: result.s,
    v: result.v
  });
  if (!Common.isNaN(result.h)) {
    color.__state.h = result.h;
  } else if (Common.isUndefined(color.__state.h)) {
    color.__state.h = 0;
  }
};
Color.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];
defineRGBComponent(Color.prototype, 'r', 2);
defineRGBComponent(Color.prototype, 'g', 1);
defineRGBComponent(Color.prototype, 'b', 0);
defineHSVComponent(Color.prototype, 'h');
defineHSVComponent(Color.prototype, 's');
defineHSVComponent(Color.prototype, 'v');
Object.defineProperty(Color.prototype, 'a', {
  get: function get$$1() {
    return this.__state.a;
  },
  set: function set$$1(v) {
    this.__state.a = v;
  }
});
Object.defineProperty(Color.prototype, 'hex', {
  get: function get$$1() {
    if (this.__state.space !== 'HEX') {
      this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
      this.__state.space = 'HEX';
    }
    return this.__state.hex;
  },
  set: function set$$1(v) {
    this.__state.space = 'HEX';
    this.__state.hex = v;
  }
});

var Controller = function () {
  function Controller(object, property) {
    classCallCheck(this, Controller);
    this.initialValue = object[property];
    this.domElement = document.createElement('div');
    this.object = object;
    this.property = property;
    this.__onChange = undefined;
    this.__onFinishChange = undefined;
  }
  createClass(Controller, [{
    key: 'onChange',
    value: function onChange(fnc) {
      this.__onChange = fnc;
      return this;
    }
  }, {
    key: 'onFinishChange',
    value: function onFinishChange(fnc) {
      this.__onFinishChange = fnc;
      return this;
    }
  }, {
    key: 'setValue',
    value: function setValue(newValue) {
      this.object[this.property] = newValue;
      if (this.__onChange) {
        this.__onChange.call(this, newValue);
      }
      this.updateDisplay();
      return this;
    }
  }, {
    key: 'getValue',
    value: function getValue() {
      return this.object[this.property];
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      return this;
    }
  }, {
    key: 'isModified',
    value: function isModified() {
      return this.initialValue !== this.getValue();
    }
  }]);
  return Controller;
}();

var EVENT_MAP = {
  HTMLEvents: ['change'],
  MouseEvents: ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
  KeyboardEvents: ['keydown']
};
var EVENT_MAP_INV = {};
Common.each(EVENT_MAP, function (v, k) {
  Common.each(v, function (e) {
    EVENT_MAP_INV[e] = k;
  });
});
var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;
function cssValueToPixels(val) {
  if (val === '0' || Common.isUndefined(val)) {
    return 0;
  }
  var match = val.match(CSS_VALUE_PIXELS);
  if (!Common.isNull(match)) {
    return parseFloat(match[1]);
  }
  return 0;
}
var dom = {
  makeSelectable: function makeSelectable(elem, selectable) {
    if (elem === undefined || elem.style === undefined) return;
    elem.onselectstart = selectable ? function () {
      return false;
    } : function () {};
    elem.style.MozUserSelect = selectable ? 'auto' : 'none';
    elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
    elem.unselectable = selectable ? 'on' : 'off';
  },
  makeFullscreen: function makeFullscreen(elem, hor, vert) {
    var vertical = vert;
    var horizontal = hor;
    if (Common.isUndefined(horizontal)) {
      horizontal = true;
    }
    if (Common.isUndefined(vertical)) {
      vertical = true;
    }
    elem.style.position = 'absolute';
    if (horizontal) {
      elem.style.left = 0;
      elem.style.right = 0;
    }
    if (vertical) {
      elem.style.top = 0;
      elem.style.bottom = 0;
    }
  },
  fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
    var params = pars || {};
    var className = EVENT_MAP_INV[eventType];
    if (!className) {
      throw new Error('Event type ' + eventType + ' not supported.');
    }
    var evt = document.createEvent(className);
    switch (className) {
      case 'MouseEvents':
        {
          var clientX = params.x || params.clientX || 0;
          var clientY = params.y || params.clientY || 0;
          evt.initMouseEvent(eventType, params.bubbles || false, params.cancelable || true, window, params.clickCount || 1, 0,
          0,
          clientX,
          clientY,
          false, false, false, false, 0, null);
          break;
        }
      case 'KeyboardEvents':
        {
          var init = evt.initKeyboardEvent || evt.initKeyEvent;
          Common.defaults(params, {
            cancelable: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            keyCode: undefined,
            charCode: undefined
          });
          init(eventType, params.bubbles || false, params.cancelable, window, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.keyCode, params.charCode);
          break;
        }
      default:
        {
          evt.initEvent(eventType, params.bubbles || false, params.cancelable || true);
          break;
        }
    }
    Common.defaults(evt, aux);
    elem.dispatchEvent(evt);
  },
  bind: function bind(elem, event, func, newBool) {
    var bool = newBool || false;
    if (elem.addEventListener) {
      elem.addEventListener(event, func, bool);
    } else if (elem.attachEvent) {
      elem.attachEvent('on' + event, func);
    }
    return dom;
  },
  unbind: function unbind(elem, event, func, newBool) {
    var bool = newBool || false;
    if (elem.removeEventListener) {
      elem.removeEventListener(event, func, bool);
    } else if (elem.detachEvent) {
      elem.detachEvent('on' + event, func);
    }
    return dom;
  },
  addClass: function addClass(elem, className) {
    if (elem.className === undefined) {
      elem.className = className;
    } else if (elem.className !== className) {
      var classes = elem.className.split(/ +/);
      if (classes.indexOf(className) === -1) {
        classes.push(className);
        elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
      }
    }
    return dom;
  },
  removeClass: function removeClass(elem, className) {
    if (className) {
      if (elem.className === className) {
        elem.removeAttribute('class');
      } else {
        var classes = elem.className.split(/ +/);
        var index = classes.indexOf(className);
        if (index !== -1) {
          classes.splice(index, 1);
          elem.className = classes.join(' ');
        }
      }
    } else {
      elem.className = undefined;
    }
    return dom;
  },
  hasClass: function hasClass(elem, className) {
    return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
  },
  getWidth: function getWidth(elem) {
    var style = getComputedStyle(elem);
    return cssValueToPixels(style['border-left-width']) + cssValueToPixels(style['border-right-width']) + cssValueToPixels(style['padding-left']) + cssValueToPixels(style['padding-right']) + cssValueToPixels(style.width);
  },
  getHeight: function getHeight(elem) {
    var style = getComputedStyle(elem);
    return cssValueToPixels(style['border-top-width']) + cssValueToPixels(style['border-bottom-width']) + cssValueToPixels(style['padding-top']) + cssValueToPixels(style['padding-bottom']) + cssValueToPixels(style.height);
  },
  getOffset: function getOffset(el) {
    var elem = el;
    var offset = { left: 0, top: 0 };
    if (elem.offsetParent) {
      do {
        offset.left += elem.offsetLeft;
        offset.top += elem.offsetTop;
        elem = elem.offsetParent;
      } while (elem);
    }
    return offset;
  },
  isActive: function isActive(elem) {
    return elem === document.activeElement && (elem.type || elem.href);
  }
};

var BooleanController = function (_Controller) {
  inherits(BooleanController, _Controller);
  function BooleanController(object, property) {
    classCallCheck(this, BooleanController);
    var _this2 = possibleConstructorReturn(this, (BooleanController.__proto__ || Object.getPrototypeOf(BooleanController)).call(this, object, property));
    var _this = _this2;
    _this2.__prev = _this2.getValue();
    _this2.__checkbox = document.createElement('input');
    _this2.__checkbox.setAttribute('type', 'checkbox');
    function onChange() {
      _this.setValue(!_this.__prev);
    }
    dom.bind(_this2.__checkbox, 'change', onChange, false);
    _this2.domElement.appendChild(_this2.__checkbox);
    _this2.updateDisplay();
    return _this2;
  }
  createClass(BooleanController, [{
    key: 'setValue',
    value: function setValue(v) {
      var toReturn = get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'setValue', this).call(this, v);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
      this.__prev = this.getValue();
      return toReturn;
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (this.getValue() === true) {
        this.__checkbox.setAttribute('checked', 'checked');
        this.__checkbox.checked = true;
        this.__prev = true;
      } else {
        this.__checkbox.checked = false;
        this.__prev = false;
      }
      return get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return BooleanController;
}(Controller);

var OptionController = function (_Controller) {
  inherits(OptionController, _Controller);
  function OptionController(object, property, opts) {
    classCallCheck(this, OptionController);
    var _this2 = possibleConstructorReturn(this, (OptionController.__proto__ || Object.getPrototypeOf(OptionController)).call(this, object, property));
    var options = opts;
    var _this = _this2;
    _this2.__select = document.createElement('select');
    if (Common.isArray(options)) {
      var map = {};
      Common.each(options, function (element) {
        map[element] = element;
      });
      options = map;
    }
    Common.each(options, function (value, key) {
      var opt = document.createElement('option');
      opt.innerHTML = key;
      opt.setAttribute('value', value);
      _this.__select.appendChild(opt);
    });
    _this2.updateDisplay();
    dom.bind(_this2.__select, 'change', function () {
      var desiredValue = this.options[this.selectedIndex].value;
      _this.setValue(desiredValue);
    });
    _this2.domElement.appendChild(_this2.__select);
    return _this2;
  }
  createClass(OptionController, [{
    key: 'setValue',
    value: function setValue(v) {
      var toReturn = get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'setValue', this).call(this, v);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
      return toReturn;
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (dom.isActive(this.__select)) return this;
      this.__select.value = this.getValue();
      return get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return OptionController;
}(Controller);

var StringController = function (_Controller) {
  inherits(StringController, _Controller);
  function StringController(object, property) {
    classCallCheck(this, StringController);
    var _this2 = possibleConstructorReturn(this, (StringController.__proto__ || Object.getPrototypeOf(StringController)).call(this, object, property));
    var _this = _this2;
    function onChange() {
      _this.setValue(_this.__input.value);
    }
    function onBlur() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    _this2.__input = document.createElement('input');
    _this2.__input.setAttribute('type', 'text');
    dom.bind(_this2.__input, 'keyup', onChange);
    dom.bind(_this2.__input, 'change', onChange);
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        this.blur();
      }
    });
    _this2.updateDisplay();
    _this2.domElement.appendChild(_this2.__input);
    return _this2;
  }
  createClass(StringController, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (!dom.isActive(this.__input)) {
        this.__input.value = this.getValue();
      }
      return get(StringController.prototype.__proto__ || Object.getPrototypeOf(StringController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return StringController;
}(Controller);

function numDecimals(x) {
  var _x = x.toString();
  if (_x.indexOf('.') > -1) {
    return _x.length - _x.indexOf('.') - 1;
  }
  return 0;
}
var NumberController = function (_Controller) {
  inherits(NumberController, _Controller);
  function NumberController(object, property, params) {
    classCallCheck(this, NumberController);
    var _this = possibleConstructorReturn(this, (NumberController.__proto__ || Object.getPrototypeOf(NumberController)).call(this, object, property));
    var _params = params || {};
    _this.__min = _params.min;
    _this.__max = _params.max;
    _this.__step = _params.step;
    if (Common.isUndefined(_this.__step)) {
      if (_this.initialValue === 0) {
        _this.__impliedStep = 1;
      } else {
        _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
      }
    } else {
      _this.__impliedStep = _this.__step;
    }
    _this.__precision = numDecimals(_this.__impliedStep);
    return _this;
  }
  createClass(NumberController, [{
    key: 'setValue',
    value: function setValue(v) {
      var _v = v;
      if (this.__min !== undefined && _v < this.__min) {
        _v = this.__min;
      } else if (this.__max !== undefined && _v > this.__max) {
        _v = this.__max;
      }
      if (this.__step !== undefined && _v % this.__step !== 0) {
        _v = Math.round(_v / this.__step) * this.__step;
      }
      return get(NumberController.prototype.__proto__ || Object.getPrototypeOf(NumberController.prototype), 'setValue', this).call(this, _v);
    }
  }, {
    key: 'min',
    value: function min(minValue) {
      this.__min = minValue;
      return this;
    }
  }, {
    key: 'max',
    value: function max(maxValue) {
      this.__max = maxValue;
      return this;
    }
  }, {
    key: 'step',
    value: function step(stepValue) {
      this.__step = stepValue;
      this.__impliedStep = stepValue;
      this.__precision = numDecimals(stepValue);
      return this;
    }
  }]);
  return NumberController;
}(Controller);

function roundToDecimal(value, decimals) {
  var tenTo = Math.pow(10, decimals);
  return Math.round(value * tenTo) / tenTo;
}
var NumberControllerBox = function (_NumberController) {
  inherits(NumberControllerBox, _NumberController);
  function NumberControllerBox(object, property, params) {
    classCallCheck(this, NumberControllerBox);
    var _this2 = possibleConstructorReturn(this, (NumberControllerBox.__proto__ || Object.getPrototypeOf(NumberControllerBox)).call(this, object, property, params));
    _this2.__truncationSuspended = false;
    var _this = _this2;
    var prevY = void 0;
    function onChange() {
      var attempted = parseFloat(_this.__input.value);
      if (!Common.isNaN(attempted)) {
        _this.setValue(attempted);
      }
    }
    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    function onBlur() {
      onFinish();
    }
    function onMouseDrag(e) {
      var diff = prevY - e.clientY;
      _this.setValue(_this.getValue() + diff * _this.__impliedStep);
      prevY = e.clientY;
    }
    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
      onFinish();
    }
    function onMouseDown(e) {
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      prevY = e.clientY;
    }
    _this2.__input = document.createElement('input');
    _this2.__input.setAttribute('type', 'text');
    dom.bind(_this2.__input, 'change', onChange);
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__input, 'mousedown', onMouseDown);
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        _this.__truncationSuspended = true;
        this.blur();
        _this.__truncationSuspended = false;
        onFinish();
      }
    });
    _this2.updateDisplay();
    _this2.domElement.appendChild(_this2.__input);
    return _this2;
  }
  createClass(NumberControllerBox, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
      return get(NumberControllerBox.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return NumberControllerBox;
}(NumberController);

function map(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}
var NumberControllerSlider = function (_NumberController) {
  inherits(NumberControllerSlider, _NumberController);
  function NumberControllerSlider(object, property, min, max, step) {
    classCallCheck(this, NumberControllerSlider);
    var _this2 = possibleConstructorReturn(this, (NumberControllerSlider.__proto__ || Object.getPrototypeOf(NumberControllerSlider)).call(this, object, property, { min: min, max: max, step: step }));
    var _this = _this2;
    _this2.__background = document.createElement('div');
    _this2.__foreground = document.createElement('div');
    dom.bind(_this2.__background, 'mousedown', onMouseDown);
    dom.bind(_this2.__background, 'touchstart', onTouchStart);
    dom.addClass(_this2.__background, 'slider');
    dom.addClass(_this2.__foreground, 'slider-fg');
    function onMouseDown(e) {
      document.activeElement.blur();
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      onMouseDrag(e);
    }
    function onMouseDrag(e) {
      e.preventDefault();
      var bgRect = _this.__background.getBoundingClientRect();
      _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
      return false;
    }
    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    function onTouchStart(e) {
      if (e.touches.length !== 1) {
        return;
      }
      dom.bind(window, 'touchmove', onTouchMove);
      dom.bind(window, 'touchend', onTouchEnd);
      onTouchMove(e);
    }
    function onTouchMove(e) {
      var clientX = e.touches[0].clientX;
      var bgRect = _this.__background.getBoundingClientRect();
      _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
    }
    function onTouchEnd() {
      dom.unbind(window, 'touchmove', onTouchMove);
      dom.unbind(window, 'touchend', onTouchEnd);
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }
    _this2.updateDisplay();
    _this2.__background.appendChild(_this2.__foreground);
    _this2.domElement.appendChild(_this2.__background);
    return _this2;
  }
  createClass(NumberControllerSlider, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      var pct = (this.getValue() - this.__min) / (this.__max - this.__min);
      this.__foreground.style.width = pct * 100 + '%';
      return get(NumberControllerSlider.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return NumberControllerSlider;
}(NumberController);

var FunctionController = function (_Controller) {
  inherits(FunctionController, _Controller);
  function FunctionController(object, property, text) {
    classCallCheck(this, FunctionController);
    var _this2 = possibleConstructorReturn(this, (FunctionController.__proto__ || Object.getPrototypeOf(FunctionController)).call(this, object, property));
    var _this = _this2;
    _this2.__button = document.createElement('div');
    _this2.__button.innerHTML = text === undefined ? 'Fire' : text;
    dom.bind(_this2.__button, 'click', function (e) {
      e.preventDefault();
      _this.fire();
      return false;
    });
    dom.addClass(_this2.__button, 'button');
    _this2.domElement.appendChild(_this2.__button);
    return _this2;
  }
  createClass(FunctionController, [{
    key: 'fire',
    value: function fire() {
      if (this.__onChange) {
        this.__onChange.call(this);
      }
      this.getValue().call(this.object);
      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
    }
  }]);
  return FunctionController;
}(Controller);

var ColorController = function (_Controller) {
  inherits(ColorController, _Controller);
  function ColorController(object, property) {
    classCallCheck(this, ColorController);
    var _this2 = possibleConstructorReturn(this, (ColorController.__proto__ || Object.getPrototypeOf(ColorController)).call(this, object, property));
    _this2.__color = new Color(_this2.getValue());
    _this2.__temp = new Color(0);
    var _this = _this2;
    _this2.domElement = document.createElement('div');
    dom.makeSelectable(_this2.domElement, false);
    _this2.__selector = document.createElement('div');
    _this2.__selector.className = 'selector';
    _this2.__saturation_field = document.createElement('div');
    _this2.__saturation_field.className = 'saturation-field';
    _this2.__field_knob = document.createElement('div');
    _this2.__field_knob.className = 'field-knob';
    _this2.__field_knob_border = '2px solid ';
    _this2.__hue_knob = document.createElement('div');
    _this2.__hue_knob.className = 'hue-knob';
    _this2.__hue_field = document.createElement('div');
    _this2.__hue_field.className = 'hue-field';
    _this2.__input = document.createElement('input');
    _this2.__input.type = 'text';
    _this2.__input_textShadow = '0 1px 1px ';
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        onBlur.call(this);
      }
    });
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__selector, 'mousedown', function () {
      dom.addClass(this, 'drag').bind(window, 'mouseup', function () {
        dom.removeClass(_this.__selector, 'drag');
      });
    });
    dom.bind(_this2.__selector, 'touchstart', function () {
      dom.addClass(this, 'drag').bind(window, 'touchend', function () {
        dom.removeClass(_this.__selector, 'drag');
      });
    });
    var valueField = document.createElement('div');
    Common.extend(_this2.__selector.style, {
      width: '122px',
      height: '102px',
      padding: '3px',
      backgroundColor: '#222',
      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
    });
    Common.extend(_this2.__field_knob.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? '#fff' : '#000'),
      boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
      borderRadius: '12px',
      zIndex: 1
    });
    Common.extend(_this2.__hue_knob.style, {
      position: 'absolute',
      width: '15px',
      height: '2px',
      borderRight: '4px solid #fff',
      zIndex: 1
    });
    Common.extend(_this2.__saturation_field.style, {
      width: '100px',
      height: '100px',
      border: '1px solid #555',
      marginRight: '3px',
      display: 'inline-block',
      cursor: 'pointer'
    });
    Common.extend(valueField.style, {
      width: '100%',
      height: '100%',
      background: 'none'
    });
    linearGradient(valueField, 'top', 'rgba(0,0,0,0)', '#000');
    Common.extend(_this2.__hue_field.style, {
      width: '15px',
      height: '100px',
      border: '1px solid #555',
      cursor: 'ns-resize',
      position: 'absolute',
      top: '3px',
      right: '3px'
    });
    hueGradient(_this2.__hue_field);
    Common.extend(_this2.__input.style, {
      outline: 'none',
      textAlign: 'center',
      color: '#fff',
      border: 0,
      fontWeight: 'bold',
      textShadow: _this2.__input_textShadow + 'rgba(0,0,0,0.7)'
    });
    dom.bind(_this2.__saturation_field, 'mousedown', fieldDown);
    dom.bind(_this2.__saturation_field, 'touchstart', fieldDown);
    dom.bind(_this2.__field_knob, 'mousedown', fieldDown);
    dom.bind(_this2.__field_knob, 'touchstart', fieldDown);
    dom.bind(_this2.__hue_field, 'mousedown', fieldDownH);
    dom.bind(_this2.__hue_field, 'touchstart', fieldDownH);
    function fieldDown(e) {
      setSV(e);
      dom.bind(window, 'mousemove', setSV);
      dom.bind(window, 'touchmove', setSV);
      dom.bind(window, 'mouseup', fieldUpSV);
      dom.bind(window, 'touchend', fieldUpSV);
    }
    function fieldDownH(e) {
      setH(e);
      dom.bind(window, 'mousemove', setH);
      dom.bind(window, 'touchmove', setH);
      dom.bind(window, 'mouseup', fieldUpH);
      dom.bind(window, 'touchend', fieldUpH);
    }
    function fieldUpSV() {
      dom.unbind(window, 'mousemove', setSV);
      dom.unbind(window, 'touchmove', setSV);
      dom.unbind(window, 'mouseup', fieldUpSV);
      dom.unbind(window, 'touchend', fieldUpSV);
      onFinish();
    }
    function fieldUpH() {
      dom.unbind(window, 'mousemove', setH);
      dom.unbind(window, 'touchmove', setH);
      dom.unbind(window, 'mouseup', fieldUpH);
      dom.unbind(window, 'touchend', fieldUpH);
      onFinish();
    }
    function onBlur() {
      var i = interpret(this.value);
      if (i !== false) {
        _this.__color.__state = i;
        _this.setValue(_this.__color.toOriginal());
      } else {
        this.value = _this.__color.toString();
      }
    }
    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.__color.toOriginal());
      }
    }
    _this2.__saturation_field.appendChild(valueField);
    _this2.__selector.appendChild(_this2.__field_knob);
    _this2.__selector.appendChild(_this2.__saturation_field);
    _this2.__selector.appendChild(_this2.__hue_field);
    _this2.__hue_field.appendChild(_this2.__hue_knob);
    _this2.domElement.appendChild(_this2.__input);
    _this2.domElement.appendChild(_this2.__selector);
    _this2.updateDisplay();
    function setSV(e) {
      if (e.type.indexOf('touch') === -1) {
        e.preventDefault();
      }
      var fieldRect = _this.__saturation_field.getBoundingClientRect();
      var _ref = e.touches && e.touches[0] || e,
          clientX = _ref.clientX,
          clientY = _ref.clientY;
      var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
      var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
      if (v > 1) {
        v = 1;
      } else if (v < 0) {
        v = 0;
      }
      if (s > 1) {
        s = 1;
      } else if (s < 0) {
        s = 0;
      }
      _this.__color.v = v;
      _this.__color.s = s;
      _this.setValue(_this.__color.toOriginal());
      return false;
    }
    function setH(e) {
      if (e.type.indexOf('touch') === -1) {
        e.preventDefault();
      }
      var fieldRect = _this.__hue_field.getBoundingClientRect();
      var _ref2 = e.touches && e.touches[0] || e,
          clientY = _ref2.clientY;
      var h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
      if (h > 1) {
        h = 1;
      } else if (h < 0) {
        h = 0;
      }
      _this.__color.h = h * 360;
      _this.setValue(_this.__color.toOriginal());
      return false;
    }
    return _this2;
  }
  createClass(ColorController, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      var i = interpret(this.getValue());
      if (i !== false) {
        var mismatch = false;
        Common.each(Color.COMPONENTS, function (component) {
          if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
            mismatch = true;
            return {};
          }
        }, this);
        if (mismatch) {
          Common.extend(this.__color.__state, i);
        }
      }
      Common.extend(this.__temp.__state, this.__color.__state);
      this.__temp.a = 1;
      var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;
      var _flip = 255 - flip;
      Common.extend(this.__field_knob.style, {
        marginLeft: 100 * this.__color.s - 7 + 'px',
        marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
        backgroundColor: this.__temp.toHexString(),
        border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
      });
      this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';
      this.__temp.s = 1;
      this.__temp.v = 1;
      linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toHexString());
      this.__input.value = this.__color.toString();
      Common.extend(this.__input.style, {
        backgroundColor: this.__color.toHexString(),
        color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
        textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
      });
    }
  }]);
  return ColorController;
}(Controller);
var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];
function linearGradient(elem, x, a, b) {
  elem.style.background = '';
  Common.each(vendors, function (vendor) {
    elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
  });
}
function hueGradient(elem) {
  elem.style.background = '';
  elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
  elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
}

var css = {
  load: function load(url, indoc) {
    var doc = indoc || document;
    var link = doc.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = url;
    doc.getElementsByTagName('head')[0].appendChild(link);
  },
  inject: function inject(cssContent, indoc) {
    var doc = indoc || document;
    var injected = document.createElement('style');
    injected.type = 'text/css';
    injected.innerHTML = cssContent;
    var head = doc.getElementsByTagName('head')[0];
    try {
      head.appendChild(injected);
    } catch (e) {
    }
  }
};

var saveDialogContents = "<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>";

var ControllerFactory = function ControllerFactory(object, property) {
  var initialValue = object[property];
  if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
    return new OptionController(object, property, arguments[2]);
  }
  if (Common.isNumber(initialValue)) {
    if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
      if (Common.isNumber(arguments[4])) {
        return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
      }
      return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
    }
    if (Common.isNumber(arguments[4])) {
      return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3], step: arguments[4] });
    }
    return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3] });
  }
  if (Common.isString(initialValue)) {
    return new StringController(object, property);
  }
  if (Common.isFunction(initialValue)) {
    return new FunctionController(object, property, '');
  }
  if (Common.isBoolean(initialValue)) {
    return new BooleanController(object, property);
  }
  return null;
};

function requestAnimationFrame(callback) {
  setTimeout(callback, 1000 / 60);
}
var requestAnimationFrame$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame;

var CenteredDiv = function () {
  function CenteredDiv() {
    classCallCheck(this, CenteredDiv);
    this.backgroundElement = document.createElement('div');
    Common.extend(this.backgroundElement.style, {
      backgroundColor: 'rgba(0,0,0,0.8)',
      top: 0,
      left: 0,
      display: 'none',
      zIndex: '1000',
      opacity: 0,
      WebkitTransition: 'opacity 0.2s linear',
      transition: 'opacity 0.2s linear'
    });
    dom.makeFullscreen(this.backgroundElement);
    this.backgroundElement.style.position = 'fixed';
    this.domElement = document.createElement('div');
    Common.extend(this.domElement.style, {
      position: 'fixed',
      display: 'none',
      zIndex: '1001',
      opacity: 0,
      WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
      transition: 'transform 0.2s ease-out, opacity 0.2s linear'
    });
    document.body.appendChild(this.backgroundElement);
    document.body.appendChild(this.domElement);
    var _this = this;
    dom.bind(this.backgroundElement, 'click', function () {
      _this.hide();
    });
  }
  createClass(CenteredDiv, [{
    key: 'show',
    value: function show() {
      var _this = this;
      this.backgroundElement.style.display = 'block';
      this.domElement.style.display = 'block';
      this.domElement.style.opacity = 0;
      this.domElement.style.webkitTransform = 'scale(1.1)';
      this.layout();
      Common.defer(function () {
        _this.backgroundElement.style.opacity = 1;
        _this.domElement.style.opacity = 1;
        _this.domElement.style.webkitTransform = 'scale(1)';
      });
    }
  }, {
    key: 'hide',
    value: function hide() {
      var _this = this;
      var hide = function hide() {
        _this.domElement.style.display = 'none';
        _this.backgroundElement.style.display = 'none';
        dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
        dom.unbind(_this.domElement, 'transitionend', hide);
        dom.unbind(_this.domElement, 'oTransitionEnd', hide);
      };
      dom.bind(this.domElement, 'webkitTransitionEnd', hide);
      dom.bind(this.domElement, 'transitionend', hide);
      dom.bind(this.domElement, 'oTransitionEnd', hide);
      this.backgroundElement.style.opacity = 0;
      this.domElement.style.opacity = 0;
      this.domElement.style.webkitTransform = 'scale(1.1)';
    }
  }, {
    key: 'layout',
    value: function layout() {
      this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
      this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
    }
  }]);
  return CenteredDiv;
}();

var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .cr.function .property-name{width:100%}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");

css.inject(styleSheet);
var CSS_NAMESPACE = 'dg';
var HIDE_KEY_CODE = 72;
var CLOSE_BUTTON_HEIGHT = 20;
var DEFAULT_DEFAULT_PRESET_NAME = 'Default';
var SUPPORTS_LOCAL_STORAGE = function () {
  try {
    return !!window.localStorage;
  } catch (e) {
    return false;
  }
}();
var SAVE_DIALOGUE = void 0;
var autoPlaceVirgin = true;
var autoPlaceContainer = void 0;
var hide = false;
var hideableGuis = [];
var GUI = function GUI(pars) {
  var _this = this;
  var params = pars || {};
  this.domElement = document.createElement('div');
  this.__ul = document.createElement('ul');
  this.domElement.appendChild(this.__ul);
  dom.addClass(this.domElement, CSS_NAMESPACE);
  this.__folders = {};
  this.__controllers = [];
  this.__rememberedObjects = [];
  this.__rememberedObjectIndecesToControllers = [];
  this.__listening = [];
  params = Common.defaults(params, {
    closeOnTop: false,
    autoPlace: true,
    width: GUI.DEFAULT_WIDTH
  });
  params = Common.defaults(params, {
    resizable: params.autoPlace,
    hideable: params.autoPlace
  });
  if (!Common.isUndefined(params.load)) {
    if (params.preset) {
      params.load.preset = params.preset;
    }
  } else {
    params.load = { preset: DEFAULT_DEFAULT_PRESET_NAME };
  }
  if (Common.isUndefined(params.parent) && params.hideable) {
    hideableGuis.push(this);
  }
  params.resizable = Common.isUndefined(params.parent) && params.resizable;
  if (params.autoPlace && Common.isUndefined(params.scrollable)) {
    params.scrollable = true;
  }
  var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';
  var saveToLocalStorage = void 0;
  var titleRow = void 0;
  Object.defineProperties(this,
  {
    parent: {
      get: function get$$1() {
        return params.parent;
      }
    },
    scrollable: {
      get: function get$$1() {
        return params.scrollable;
      }
    },
    autoPlace: {
      get: function get$$1() {
        return params.autoPlace;
      }
    },
    closeOnTop: {
      get: function get$$1() {
        return params.closeOnTop;
      }
    },
    preset: {
      get: function get$$1() {
        if (_this.parent) {
          return _this.getRoot().preset;
        }
        return params.load.preset;
      },
      set: function set$$1(v) {
        if (_this.parent) {
          _this.getRoot().preset = v;
        } else {
          params.load.preset = v;
        }
        setPresetSelectIndex(this);
        _this.revert();
      }
    },
    width: {
      get: function get$$1() {
        return params.width;
      },
      set: function set$$1(v) {
        params.width = v;
        setWidth(_this, v);
      }
    },
    name: {
      get: function get$$1() {
        return params.name;
      },
      set: function set$$1(v) {
        params.name = v;
        if (titleRow) {
          titleRow.innerHTML = params.name;
        }
      }
    },
    closed: {
      get: function get$$1() {
        return params.closed;
      },
      set: function set$$1(v) {
        params.closed = v;
        if (params.closed) {
          dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
        } else {
          dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
        }
        this.onResize();
        if (_this.__closeButton) {
          _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
        }
      }
    },
    load: {
      get: function get$$1() {
        return params.load;
      }
    },
    useLocalStorage: {
      get: function get$$1() {
        return useLocalStorage;
      },
      set: function set$$1(bool) {
        if (SUPPORTS_LOCAL_STORAGE) {
          useLocalStorage = bool;
          if (bool) {
            dom.bind(window, 'unload', saveToLocalStorage);
          } else {
            dom.unbind(window, 'unload', saveToLocalStorage);
          }
          localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
        }
      }
    }
  });
  if (Common.isUndefined(params.parent)) {
    this.closed = params.closed || false;
    dom.addClass(this.domElement, GUI.CLASS_MAIN);
    dom.makeSelectable(this.domElement, false);
    if (SUPPORTS_LOCAL_STORAGE) {
      if (useLocalStorage) {
        _this.useLocalStorage = true;
        var savedGui = localStorage.getItem(getLocalStorageHash(this, 'gui'));
        if (savedGui) {
          params.load = JSON.parse(savedGui);
        }
      }
    }
    this.__closeButton = document.createElement('div');
    this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
    dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);
    if (params.closeOnTop) {
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_TOP);
      this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
    } else {
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BOTTOM);
      this.domElement.appendChild(this.__closeButton);
    }
    dom.bind(this.__closeButton, 'click', function () {
      _this.closed = !_this.closed;
    });
  } else {
    if (params.closed === undefined) {
      params.closed = true;
    }
    var titleRowName = document.createTextNode(params.name);
    dom.addClass(titleRowName, 'controller-name');
    titleRow = addRow(_this, titleRowName);
    var onClickTitle = function onClickTitle(e) {
      e.preventDefault();
      _this.closed = !_this.closed;
      return false;
    };
    dom.addClass(this.__ul, GUI.CLASS_CLOSED);
    dom.addClass(titleRow, 'title');
    dom.bind(titleRow, 'click', onClickTitle);
    if (!params.closed) {
      this.closed = false;
    }
  }
  if (params.autoPlace) {
    if (Common.isUndefined(params.parent)) {
      if (autoPlaceVirgin) {
        autoPlaceContainer = document.createElement('div');
        dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
        dom.addClass(autoPlaceContainer, GUI.CLASS_AUTO_PLACE_CONTAINER);
        document.body.appendChild(autoPlaceContainer);
        autoPlaceVirgin = false;
      }
      autoPlaceContainer.appendChild(this.domElement);
      dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);
    }
    if (!this.parent) {
      setWidth(_this, params.width);
    }
  }
  this.__resizeHandler = function () {
    _this.onResizeDebounced();
  };
  dom.bind(window, 'resize', this.__resizeHandler);
  dom.bind(this.__ul, 'webkitTransitionEnd', this.__resizeHandler);
  dom.bind(this.__ul, 'transitionend', this.__resizeHandler);
  dom.bind(this.__ul, 'oTransitionEnd', this.__resizeHandler);
  this.onResize();
  if (params.resizable) {
    addResizeHandle(this);
  }
  saveToLocalStorage = function saveToLocalStorage() {
    if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
      localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
    }
  };
  this.saveToLocalStorageIfPossible = saveToLocalStorage;
  function resetWidth() {
    var root = _this.getRoot();
    root.width += 1;
    Common.defer(function () {
      root.width -= 1;
    });
  }
  if (!params.parent) {
    resetWidth();
  }
};
GUI.toggleHide = function () {
  hide = !hide;
  Common.each(hideableGuis, function (gui) {
    gui.domElement.style.display = hide ? 'none' : '';
  });
};
GUI.CLASS_AUTO_PLACE = 'a';
GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
GUI.CLASS_MAIN = 'main';
GUI.CLASS_CONTROLLER_ROW = 'cr';
GUI.CLASS_TOO_TALL = 'taller-than-window';
GUI.CLASS_CLOSED = 'closed';
GUI.CLASS_CLOSE_BUTTON = 'close-button';
GUI.CLASS_CLOSE_TOP = 'close-top';
GUI.CLASS_CLOSE_BOTTOM = 'close-bottom';
GUI.CLASS_DRAG = 'drag';
GUI.DEFAULT_WIDTH = 245;
GUI.TEXT_CLOSED = 'Close Controls';
GUI.TEXT_OPEN = 'Open Controls';
GUI._keydownHandler = function (e) {
  if (document.activeElement.type !== 'text' && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
    GUI.toggleHide();
  }
};
dom.bind(window, 'keydown', GUI._keydownHandler, false);
Common.extend(GUI.prototype,
{
  add: function add(object, property) {
    return _add(this, object, property, {
      factoryArgs: Array.prototype.slice.call(arguments, 2)
    });
  },
  addColor: function addColor(object, property) {
    return _add(this, object, property, {
      color: true
    });
  },
  remove: function remove(controller) {
    this.__ul.removeChild(controller.__li);
    this.__controllers.splice(this.__controllers.indexOf(controller), 1);
    var _this = this;
    Common.defer(function () {
      _this.onResize();
    });
  },
  destroy: function destroy() {
    if (this.parent) {
      throw new Error('Only the root GUI should be removed with .destroy(). ' + 'For subfolders, use gui.removeFolder(folder) instead.');
    }
    if (this.autoPlace) {
      autoPlaceContainer.removeChild(this.domElement);
    }
    var _this = this;
    Common.each(this.__folders, function (subfolder) {
      _this.removeFolder(subfolder);
    });
    dom.unbind(window, 'keydown', GUI._keydownHandler, false);
    removeListeners(this);
  },
  addFolder: function addFolder(name) {
    if (this.__folders[name] !== undefined) {
      throw new Error('You already have a folder in this GUI by the' + ' name "' + name + '"');
    }
    var newGuiParams = { name: name, parent: this };
    newGuiParams.autoPlace = this.autoPlace;
    if (this.load &&
    this.load.folders &&
    this.load.folders[name]) {
      newGuiParams.closed = this.load.folders[name].closed;
      newGuiParams.load = this.load.folders[name];
    }
    var gui = new GUI(newGuiParams);
    this.__folders[name] = gui;
    var li = addRow(this, gui.domElement);
    dom.addClass(li, 'folder');
    return gui;
  },
  removeFolder: function removeFolder(folder) {
    this.__ul.removeChild(folder.domElement.parentElement);
    delete this.__folders[folder.name];
    if (this.load &&
    this.load.folders &&
    this.load.folders[folder.name]) {
      delete this.load.folders[folder.name];
    }
    removeListeners(folder);
    var _this = this;
    Common.each(folder.__folders, function (subfolder) {
      folder.removeFolder(subfolder);
    });
    Common.defer(function () {
      _this.onResize();
    });
  },
  open: function open() {
    this.closed = false;
  },
  close: function close() {
    this.closed = true;
  },
  hide: function hide() {
    this.domElement.style.display = 'none';
  },
  show: function show() {
    this.domElement.style.display = '';
  },
  onResize: function onResize() {
    var root = this.getRoot();
    if (root.scrollable) {
      var top = dom.getOffset(root.__ul).top;
      var h = 0;
      Common.each(root.__ul.childNodes, function (node) {
        if (!(root.autoPlace && node === root.__save_row)) {
          h += dom.getHeight(node);
        }
      });
      if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
        dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
        root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
      } else {
        dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
        root.__ul.style.height = 'auto';
      }
    }
    if (root.__resize_handle) {
      Common.defer(function () {
        root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
      });
    }
    if (root.__closeButton) {
      root.__closeButton.style.width = root.width + 'px';
    }
  },
  onResizeDebounced: Common.debounce(function () {
    this.onResize();
  }, 50),
  remember: function remember() {
    if (Common.isUndefined(SAVE_DIALOGUE)) {
      SAVE_DIALOGUE = new CenteredDiv();
      SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
    }
    if (this.parent) {
      throw new Error('You can only call remember on a top level GUI.');
    }
    var _this = this;
    Common.each(Array.prototype.slice.call(arguments), function (object) {
      if (_this.__rememberedObjects.length === 0) {
        addSaveMenu(_this);
      }
      if (_this.__rememberedObjects.indexOf(object) === -1) {
        _this.__rememberedObjects.push(object);
      }
    });
    if (this.autoPlace) {
      setWidth(this, this.width);
    }
  },
  getRoot: function getRoot() {
    var gui = this;
    while (gui.parent) {
      gui = gui.parent;
    }
    return gui;
  },
  getSaveObject: function getSaveObject() {
    var toReturn = this.load;
    toReturn.closed = this.closed;
    if (this.__rememberedObjects.length > 0) {
      toReturn.preset = this.preset;
      if (!toReturn.remembered) {
        toReturn.remembered = {};
      }
      toReturn.remembered[this.preset] = getCurrentPreset(this);
    }
    toReturn.folders = {};
    Common.each(this.__folders, function (element, key) {
      toReturn.folders[key] = element.getSaveObject();
    });
    return toReturn;
  },
  save: function save() {
    if (!this.load.remembered) {
      this.load.remembered = {};
    }
    this.load.remembered[this.preset] = getCurrentPreset(this);
    markPresetModified(this, false);
    this.saveToLocalStorageIfPossible();
  },
  saveAs: function saveAs(presetName) {
    if (!this.load.remembered) {
      this.load.remembered = {};
      this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
    }
    this.load.remembered[presetName] = getCurrentPreset(this);
    this.preset = presetName;
    addPresetOption(this, presetName, true);
    this.saveToLocalStorageIfPossible();
  },
  revert: function revert(gui) {
    Common.each(this.__controllers, function (controller) {
      if (!this.getRoot().load.remembered) {
        controller.setValue(controller.initialValue);
      } else {
        recallSavedValue(gui || this.getRoot(), controller);
      }
      if (controller.__onFinishChange) {
        controller.__onFinishChange.call(controller, controller.getValue());
      }
    }, this);
    Common.each(this.__folders, function (folder) {
      folder.revert(folder);
    });
    if (!gui) {
      markPresetModified(this.getRoot(), false);
    }
  },
  listen: function listen(controller) {
    var init = this.__listening.length === 0;
    this.__listening.push(controller);
    if (init) {
      updateDisplays(this.__listening);
    }
  },
  updateDisplay: function updateDisplay() {
    Common.each(this.__controllers, function (controller) {
      controller.updateDisplay();
    });
    Common.each(this.__folders, function (folder) {
      folder.updateDisplay();
    });
  }
});
function addRow(gui, newDom, liBefore) {
  var li = document.createElement('li');
  if (newDom) {
    li.appendChild(newDom);
  }
  if (liBefore) {
    gui.__ul.insertBefore(li, liBefore);
  } else {
    gui.__ul.appendChild(li);
  }
  gui.onResize();
  return li;
}
function removeListeners(gui) {
  dom.unbind(window, 'resize', gui.__resizeHandler);
  if (gui.saveToLocalStorageIfPossible) {
    dom.unbind(window, 'unload', gui.saveToLocalStorageIfPossible);
  }
}
function markPresetModified(gui, modified) {
  var opt = gui.__preset_select[gui.__preset_select.selectedIndex];
  if (modified) {
    opt.innerHTML = opt.value + '*';
  } else {
    opt.innerHTML = opt.value;
  }
}
function augmentController(gui, li, controller) {
  controller.__li = li;
  controller.__gui = gui;
  Common.extend(controller, {
    options: function options(_options) {
      if (arguments.length > 1) {
        var nextSibling = controller.__li.nextElementSibling;
        controller.remove();
        return _add(gui, controller.object, controller.property, {
          before: nextSibling,
          factoryArgs: [Common.toArray(arguments)]
        });
      }
      if (Common.isArray(_options) || Common.isObject(_options)) {
        var _nextSibling = controller.__li.nextElementSibling;
        controller.remove();
        return _add(gui, controller.object, controller.property, {
          before: _nextSibling,
          factoryArgs: [_options]
        });
      }
    },
    name: function name(_name) {
      controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
      return controller;
    },
    listen: function listen() {
      controller.__gui.listen(controller);
      return controller;
    },
    remove: function remove() {
      controller.__gui.remove(controller);
      return controller;
    }
  });
  if (controller instanceof NumberControllerSlider) {
    var box = new NumberControllerBox(controller.object, controller.property, { min: controller.__min, max: controller.__max, step: controller.__step });
    Common.each(['updateDisplay', 'onChange', 'onFinishChange', 'step', 'min', 'max'], function (method) {
      var pc = controller[method];
      var pb = box[method];
      controller[method] = box[method] = function () {
        var args = Array.prototype.slice.call(arguments);
        pb.apply(box, args);
        return pc.apply(controller, args);
      };
    });
    dom.addClass(li, 'has-slider');
    controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
  } else if (controller instanceof NumberControllerBox) {
    var r = function r(returned) {
      if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
        var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
        var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
        controller.remove();
        var newController = _add(gui, controller.object, controller.property, {
          before: controller.__li.nextElementSibling,
          factoryArgs: [controller.__min, controller.__max, controller.__step]
        });
        newController.name(oldName);
        if (wasListening) newController.listen();
        return newController;
      }
      return returned;
    };
    controller.min = Common.compose(r, controller.min);
    controller.max = Common.compose(r, controller.max);
  } else if (controller instanceof BooleanController) {
    dom.bind(li, 'click', function () {
      dom.fakeEvent(controller.__checkbox, 'click');
    });
    dom.bind(controller.__checkbox, 'click', function (e) {
      e.stopPropagation();
    });
  } else if (controller instanceof FunctionController) {
    dom.bind(li, 'click', function () {
      dom.fakeEvent(controller.__button, 'click');
    });
    dom.bind(li, 'mouseover', function () {
      dom.addClass(controller.__button, 'hover');
    });
    dom.bind(li, 'mouseout', function () {
      dom.removeClass(controller.__button, 'hover');
    });
  } else if (controller instanceof ColorController) {
    dom.addClass(li, 'color');
    controller.updateDisplay = Common.compose(function (val) {
      li.style.borderLeftColor = controller.__color.toString();
      return val;
    }, controller.updateDisplay);
    controller.updateDisplay();
  }
  controller.setValue = Common.compose(function (val) {
    if (gui.getRoot().__preset_select && controller.isModified()) {
      markPresetModified(gui.getRoot(), true);
    }
    return val;
  }, controller.setValue);
}
function recallSavedValue(gui, controller) {
  var root = gui.getRoot();
  var matchedIndex = root.__rememberedObjects.indexOf(controller.object);
  if (matchedIndex !== -1) {
    var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];
    if (controllerMap === undefined) {
      controllerMap = {};
      root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
    }
    controllerMap[controller.property] = controller;
    if (root.load && root.load.remembered) {
      var presetMap = root.load.remembered;
      var preset = void 0;
      if (presetMap[gui.preset]) {
        preset = presetMap[gui.preset];
      } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
        preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
      } else {
        return;
      }
      if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== undefined) {
        var value = preset[matchedIndex][controller.property];
        controller.initialValue = value;
        controller.setValue(value);
      }
    }
  }
}
function _add(gui, object, property, params) {
  if (object[property] === undefined) {
    throw new Error('Object "' + object + '" has no property "' + property + '"');
  }
  var controller = void 0;
  if (params.color) {
    controller = new ColorController(object, property);
  } else {
    var factoryArgs = [object, property].concat(params.factoryArgs);
    controller = ControllerFactory.apply(gui, factoryArgs);
  }
  if (params.before instanceof Controller) {
    params.before = params.before.__li;
  }
  recallSavedValue(gui, controller);
  dom.addClass(controller.domElement, 'c');
  var name = document.createElement('span');
  dom.addClass(name, 'property-name');
  name.innerHTML = controller.property;
  var container = document.createElement('div');
  container.appendChild(name);
  container.appendChild(controller.domElement);
  var li = addRow(gui, container, params.before);
  dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);
  if (controller instanceof ColorController) {
    dom.addClass(li, 'color');
  } else {
    dom.addClass(li, _typeof(controller.getValue()));
  }
  augmentController(gui, li, controller);
  gui.__controllers.push(controller);
  return controller;
}
function getLocalStorageHash(gui, key) {
  return document.location.href + '.' + key;
}
function addPresetOption(gui, name, setSelected) {
  var opt = document.createElement('option');
  opt.innerHTML = name;
  opt.value = name;
  gui.__preset_select.appendChild(opt);
  if (setSelected) {
    gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
  }
}
function showHideExplain(gui, explain) {
  explain.style.display = gui.useLocalStorage ? 'block' : 'none';
}
function addSaveMenu(gui) {
  var div = gui.__save_row = document.createElement('li');
  dom.addClass(gui.domElement, 'has-save');
  gui.__ul.insertBefore(div, gui.__ul.firstChild);
  dom.addClass(div, 'save-row');
  var gears = document.createElement('span');
  gears.innerHTML = '&nbsp;';
  dom.addClass(gears, 'button gears');
  var button = document.createElement('span');
  button.innerHTML = 'Save';
  dom.addClass(button, 'button');
  dom.addClass(button, 'save');
  var button2 = document.createElement('span');
  button2.innerHTML = 'New';
  dom.addClass(button2, 'button');
  dom.addClass(button2, 'save-as');
  var button3 = document.createElement('span');
  button3.innerHTML = 'Revert';
  dom.addClass(button3, 'button');
  dom.addClass(button3, 'revert');
  var select = gui.__preset_select = document.createElement('select');
  if (gui.load && gui.load.remembered) {
    Common.each(gui.load.remembered, function (value, key) {
      addPresetOption(gui, key, key === gui.preset);
    });
  } else {
    addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
  }
  dom.bind(select, 'change', function () {
    for (var index = 0; index < gui.__preset_select.length; index++) {
      gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
    }
    gui.preset = this.value;
  });
  div.appendChild(select);
  div.appendChild(gears);
  div.appendChild(button);
  div.appendChild(button2);
  div.appendChild(button3);
  if (SUPPORTS_LOCAL_STORAGE) {
    var explain = document.getElementById('dg-local-explain');
    var localStorageCheckBox = document.getElementById('dg-local-storage');
    var saveLocally = document.getElementById('dg-save-locally');
    saveLocally.style.display = 'block';
    if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
      localStorageCheckBox.setAttribute('checked', 'checked');
    }
    showHideExplain(gui, explain);
    dom.bind(localStorageCheckBox, 'change', function () {
      gui.useLocalStorage = !gui.useLocalStorage;
      showHideExplain(gui, explain);
    });
  }
  var newConstructorTextArea = document.getElementById('dg-new-constructor');
  dom.bind(newConstructorTextArea, 'keydown', function (e) {
    if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
      SAVE_DIALOGUE.hide();
    }
  });
  dom.bind(gears, 'click', function () {
    newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
    SAVE_DIALOGUE.show();
    newConstructorTextArea.focus();
    newConstructorTextArea.select();
  });
  dom.bind(button, 'click', function () {
    gui.save();
  });
  dom.bind(button2, 'click', function () {
    var presetName = prompt('Enter a new preset name.');
    if (presetName) {
      gui.saveAs(presetName);
    }
  });
  dom.bind(button3, 'click', function () {
    gui.revert();
  });
}
function addResizeHandle(gui) {
  var pmouseX = void 0;
  gui.__resize_handle = document.createElement('div');
  Common.extend(gui.__resize_handle.style, {
    width: '6px',
    marginLeft: '-3px',
    height: '200px',
    cursor: 'ew-resize',
    position: 'absolute'
  });
  function drag(e) {
    e.preventDefault();
    gui.width += pmouseX - e.clientX;
    gui.onResize();
    pmouseX = e.clientX;
    return false;
  }
  function dragStop() {
    dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
    dom.unbind(window, 'mousemove', drag);
    dom.unbind(window, 'mouseup', dragStop);
  }
  function dragStart(e) {
    e.preventDefault();
    pmouseX = e.clientX;
    dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
    dom.bind(window, 'mousemove', drag);
    dom.bind(window, 'mouseup', dragStop);
    return false;
  }
  dom.bind(gui.__resize_handle, 'mousedown', dragStart);
  dom.bind(gui.__closeButton, 'mousedown', dragStart);
  gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);
}
function setWidth(gui, w) {
  gui.domElement.style.width = w + 'px';
  if (gui.__save_row && gui.autoPlace) {
    gui.__save_row.style.width = w + 'px';
  }
  if (gui.__closeButton) {
    gui.__closeButton.style.width = w + 'px';
  }
}
function getCurrentPreset(gui, useInitialValues) {
  var toReturn = {};
  Common.each(gui.__rememberedObjects, function (val, index) {
    var savedValues = {};
    var controllerMap = gui.__rememberedObjectIndecesToControllers[index];
    Common.each(controllerMap, function (controller, property) {
      savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
    });
    toReturn[index] = savedValues;
  });
  return toReturn;
}
function setPresetSelectIndex(gui) {
  for (var index = 0; index < gui.__preset_select.length; index++) {
    if (gui.__preset_select[index].value === gui.preset) {
      gui.__preset_select.selectedIndex = index;
    }
  }
}
function updateDisplays(controllerArray) {
  if (controllerArray.length !== 0) {
    requestAnimationFrame$1.call(window, function () {
      updateDisplays(controllerArray);
    });
  }
  Common.each(controllerArray, function (c) {
    c.updateDisplay();
  });
}

var color = {
  Color: Color,
  math: ColorMath,
  interpret: interpret
};
var controllers = {
  Controller: Controller,
  BooleanController: BooleanController,
  OptionController: OptionController,
  StringController: StringController,
  NumberController: NumberController,
  NumberControllerBox: NumberControllerBox,
  NumberControllerSlider: NumberControllerSlider,
  FunctionController: FunctionController,
  ColorController: ColorController
};
var dom$1 = { dom: dom };
var gui = { GUI: GUI };
var GUI$1 = GUI;
var index = {
  color: color,
  controllers: controllers,
  dom: dom$1,
  gui: gui,
  GUI: GUI$1
};


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (index);
//# sourceMappingURL=dat.gui.module.js.map


/***/ }),

/***/ "./node_modules/filtered-vector/fvec.js":
/*!**********************************************!*\
  !*** ./node_modules/filtered-vector/fvec.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = createFilteredVector

var cubicHermite = __webpack_require__(/*! cubic-hermite */ "./node_modules/cubic-hermite/hermite.js")
var bsearch = __webpack_require__(/*! binary-search-bounds */ "./node_modules/binary-search-bounds/search-bounds.js")

function clamp(lo, hi, x) {
  return Math.min(hi, Math.max(lo, x))
}

function FilteredVector(state0, velocity0, t0) {
  this.dimension  = state0.length
  this.bounds     = [ new Array(this.dimension), new Array(this.dimension) ]
  for(var i=0; i<this.dimension; ++i) {
    this.bounds[0][i] = -Infinity
    this.bounds[1][i] = Infinity
  }
  this._state     = state0.slice().reverse()
  this._velocity  = velocity0.slice().reverse()
  this._time      = [ t0 ]
  this._scratch   = [ state0.slice(), state0.slice(), state0.slice(), state0.slice(), state0.slice() ]
}

var proto = FilteredVector.prototype

proto.flush = function(t) {
  var idx = bsearch.gt(this._time, t) - 1
  if(idx <= 0) {
    return
  }
  this._time.splice(0, idx)
  this._state.splice(0, idx * this.dimension)
  this._velocity.splice(0, idx * this.dimension)
}

proto.curve = function(t) {
  var time      = this._time
  var n         = time.length
  var idx       = bsearch.le(time, t)
  var result    = this._scratch[0]
  var state     = this._state
  var velocity  = this._velocity
  var d         = this.dimension
  var bounds    = this.bounds
  if(idx < 0) {
    var ptr = d-1
    for(var i=0; i<d; ++i, --ptr) {
      result[i] = state[ptr]
    }
  } else if(idx >= n-1) {
    var ptr = state.length-1
    var tf = t - time[n-1]
    for(var i=0; i<d; ++i, --ptr) {
      result[i] = state[ptr] + tf * velocity[ptr]
    }
  } else {
    var ptr = d * (idx+1) - 1
    var t0  = time[idx]
    var t1  = time[idx+1]
    var dt  = (t1 - t0) || 1.0
    var x0  = this._scratch[1]
    var x1  = this._scratch[2]
    var v0  = this._scratch[3]
    var v1  = this._scratch[4]
    var steady = true
    for(var i=0; i<d; ++i, --ptr) {
      x0[i] = state[ptr]
      v0[i] = velocity[ptr] * dt
      x1[i] = state[ptr+d]
      v1[i] = velocity[ptr+d] * dt
      steady = steady && (x0[i] === x1[i] && v0[i] === v1[i] && v0[i] === 0.0)
    }
    if(steady) {
      for(var i=0; i<d; ++i) {
        result[i] = x0[i]
      }
    } else {
      cubicHermite(x0, v0, x1, v1, (t-t0)/dt, result)
    }
  }
  var lo = bounds[0]
  var hi = bounds[1]
  for(var i=0; i<d; ++i) {
    result[i] = clamp(lo[i], hi[i], result[i])
  }
  return result
}

proto.dcurve = function(t) {
  var time     = this._time
  var n        = time.length
  var idx      = bsearch.le(time, t)
  var result   = this._scratch[0]
  var state    = this._state
  var velocity = this._velocity
  var d        = this.dimension
  if(idx >= n-1) {
    var ptr = state.length-1
    var tf = t - time[n-1]
    for(var i=0; i<d; ++i, --ptr) {
      result[i] = velocity[ptr]
    }
  } else {
    var ptr = d * (idx+1) - 1
    var t0 = time[idx]
    var t1 = time[idx+1]
    var dt = (t1 - t0) || 1.0
    var x0 = this._scratch[1]
    var x1 = this._scratch[2]
    var v0 = this._scratch[3]
    var v1 = this._scratch[4]
    var steady = true
    for(var i=0; i<d; ++i, --ptr) {
      x0[i] = state[ptr]
      v0[i] = velocity[ptr] * dt
      x1[i] = state[ptr+d]
      v1[i] = velocity[ptr+d] * dt
      steady = steady && (x0[i] === x1[i] && v0[i] === v1[i] && v0[i] === 0.0)
    }
    if(steady) {
      for(var i=0; i<d; ++i) {
        result[i] = 0.0
      }
    } else {
      cubicHermite.derivative(x0, v0, x1, v1, (t-t0)/dt, result)
      for(var i=0; i<d; ++i) {
        result[i] /= dt
      }
    }
  }
  return result
}

proto.lastT = function() {
  var time = this._time
  return time[time.length-1]
}

proto.stable = function() {
  var velocity = this._velocity
  var ptr = velocity.length
  for(var i=this.dimension-1; i>=0; --i) {
    if(velocity[--ptr]) {
      return false
    }
  }
  return true
}

proto.jump = function(t) {
  var t0 = this.lastT()
  var d  = this.dimension
  if(t < t0 || arguments.length !== d+1) {
    return
  }
  var state     = this._state
  var velocity  = this._velocity
  var ptr       = state.length-this.dimension
  var bounds    = this.bounds
  var lo        = bounds[0]
  var hi        = bounds[1]
  this._time.push(t0, t)
  for(var j=0; j<2; ++j) {
    for(var i=0; i<d; ++i) {
      state.push(state[ptr++])
      velocity.push(0)
    }
  }
  this._time.push(t)
  for(var i=d; i>0; --i) {
    state.push(clamp(lo[i-1], hi[i-1], arguments[i]))
    velocity.push(0)
  }
}

proto.push = function(t) {
  var t0 = this.lastT()
  var d  = this.dimension
  if(t < t0 || arguments.length !== d+1) {
    return
  }
  var state     = this._state
  var velocity  = this._velocity
  var ptr       = state.length-this.dimension
  var dt        = t - t0
  var bounds    = this.bounds
  var lo        = bounds[0]
  var hi        = bounds[1]
  var sf        = (dt > 1e-6) ? 1/dt : 0
  this._time.push(t)
  for(var i=d; i>0; --i) {
    var xc = clamp(lo[i-1], hi[i-1], arguments[i])
    state.push(xc)
    velocity.push((xc - state[ptr++]) * sf)
  }
}

proto.set = function(t) {
  var d = this.dimension
  if(t < this.lastT() || arguments.length !== d+1) {
    return
  }
  var state     = this._state
  var velocity  = this._velocity
  var bounds    = this.bounds
  var lo        = bounds[0]
  var hi        = bounds[1]
  this._time.push(t)
  for(var i=d; i>0; --i) {
    state.push(clamp(lo[i-1], hi[i-1], arguments[i]))
    velocity.push(0)
  }
}

proto.move = function(t) {
  var t0 = this.lastT()
  var d  = this.dimension
  if(t <= t0 || arguments.length !== d+1) {
    return
  }
  var state    = this._state
  var velocity = this._velocity
  var statePtr = state.length - this.dimension
  var bounds   = this.bounds
  var lo       = bounds[0]
  var hi       = bounds[1]
  var dt       = t - t0
  var sf       = (dt > 1e-6) ? 1/dt : 0.0
  this._time.push(t)
  for(var i=d; i>0; --i) {
    var dx = arguments[i]
    state.push(clamp(lo[i-1], hi[i-1], state[statePtr++] + dx))
    velocity.push(dx * sf)
  }
}

proto.idle = function(t) {
  var t0 = this.lastT()
  if(t < t0) {
    return
  }
  var d        = this.dimension
  var state    = this._state
  var velocity = this._velocity
  var statePtr = state.length-d
  var bounds   = this.bounds
  var lo       = bounds[0]
  var hi       = bounds[1]
  var dt       = t - t0
  this._time.push(t)
  for(var i=d-1; i>=0; --i) {
    state.push(clamp(lo[i], hi[i], state[statePtr] + dt * velocity[statePtr]))
    velocity.push(0)
    statePtr += 1
  }
}

function getZero(d) {
  var result = new Array(d)
  for(var i=0; i<d; ++i) {
    result[i] = 0.0
  }
  return result
}

function createFilteredVector(initState, initVelocity, initTime) {
  switch(arguments.length) {
    case 0:
      return new FilteredVector([0], [0], 0)
    case 1:
      if(typeof initState === 'number') {
        var zero = getZero(initState)
        return new FilteredVector(zero, zero, 0)
      } else {
        return new FilteredVector(initState, getZero(initState.length), 0)
      }
    case 2:
      if(typeof initVelocity === 'number') {
        var zero = getZero(initState.length)
        return new FilteredVector(initState, zero, +initVelocity)
      } else {
        initTime = 0
      }
    case 3:
      if(initState.length !== initVelocity.length) {
        throw new Error('state and velocity lengths must match')
      }
      return new FilteredVector(initState, initVelocity, initTime)
  }
}


/***/ }),

/***/ "./node_modules/gl-mat4/clone.js":
/*!***************************************!*\
  !*** ./node_modules/gl-mat4/clone.js ***!
  \***************************************/
/***/ ((module) => {

module.exports = clone;

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
function clone(a) {
    var out = new Float32Array(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/create.js":
/*!****************************************!*\
  !*** ./node_modules/gl-mat4/create.js ***!
  \****************************************/
/***/ ((module) => {

module.exports = create;

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
function create() {
    var out = new Float32Array(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/determinant.js":
/*!*********************************************!*\
  !*** ./node_modules/gl-mat4/determinant.js ***!
  \*********************************************/
/***/ ((module) => {

module.exports = determinant;

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
function determinant(a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/***/ }),

/***/ "./node_modules/gl-mat4/fromQuat.js":
/*!******************************************!*\
  !*** ./node_modules/gl-mat4/fromQuat.js ***!
  \******************************************/
/***/ ((module) => {

module.exports = fromQuat;

/**
 * Creates a matrix from a quaternion rotation.
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @returns {mat4} out
 */
function fromQuat(out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;

    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;

    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/fromRotationTranslation.js":
/*!*********************************************************!*\
  !*** ./node_modules/gl-mat4/fromRotationTranslation.js ***!
  \*********************************************************/
/***/ ((module) => {

module.exports = fromRotationTranslation;

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
function fromRotationTranslation(out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/identity.js":
/*!******************************************!*\
  !*** ./node_modules/gl-mat4/identity.js ***!
  \******************************************/
/***/ ((module) => {

module.exports = identity;

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
function identity(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/invert.js":
/*!****************************************!*\
  !*** ./node_modules/gl-mat4/invert.js ***!
  \****************************************/
/***/ ((module) => {

module.exports = invert;

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function invert(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/lookAt.js":
/*!****************************************!*\
  !*** ./node_modules/gl-mat4/lookAt.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var identity = __webpack_require__(/*! ./identity */ "./node_modules/gl-mat4/identity.js");

module.exports = lookAt;

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
function lookAt(out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < 0.000001 &&
        Math.abs(eyey - centery) < 0.000001 &&
        Math.abs(eyez - centerz) < 0.000001) {
        return identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/multiply.js":
/*!******************************************!*\
  !*** ./node_modules/gl-mat4/multiply.js ***!
  \******************************************/
/***/ ((module) => {

module.exports = multiply;

/**
 * Multiplies two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
function multiply(out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/rotate.js":
/*!****************************************!*\
  !*** ./node_modules/gl-mat4/rotate.js ***!
  \****************************************/
/***/ ((module) => {

module.exports = rotate;

/**
 * Rotates a mat4 by the given angle
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
function rotate(out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < 0.000001) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/rotateX.js":
/*!*****************************************!*\
  !*** ./node_modules/gl-mat4/rotateX.js ***!
  \*****************************************/
/***/ ((module) => {

module.exports = rotateX;

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateX(out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/rotateY.js":
/*!*****************************************!*\
  !*** ./node_modules/gl-mat4/rotateY.js ***!
  \*****************************************/
/***/ ((module) => {

module.exports = rotateY;

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateY(out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/rotateZ.js":
/*!*****************************************!*\
  !*** ./node_modules/gl-mat4/rotateZ.js ***!
  \*****************************************/
/***/ ((module) => {

module.exports = rotateZ;

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
function rotateZ(out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/scale.js":
/*!***************************************!*\
  !*** ./node_modules/gl-mat4/scale.js ***!
  \***************************************/
/***/ ((module) => {

module.exports = scale;

/**
 * Scales the mat4 by the dimensions in the given vec3
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
function scale(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/translate.js":
/*!*******************************************!*\
  !*** ./node_modules/gl-mat4/translate.js ***!
  \*******************************************/
/***/ ((module) => {

module.exports = translate;

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
function translate(out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};

/***/ }),

/***/ "./node_modules/gl-mat4/transpose.js":
/*!*******************************************!*\
  !*** ./node_modules/gl-mat4/transpose.js ***!
  \*******************************************/
/***/ ((module) => {

module.exports = transpose;

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
function transpose(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }
    
    return out;
};

/***/ }),

/***/ "./node_modules/gl-matrix/esm/common.js":
/*!**********************************************!*\
  !*** ./node_modules/gl-matrix/esm/common.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ARRAY_TYPE": () => (/* binding */ ARRAY_TYPE),
/* harmony export */   "EPSILON": () => (/* binding */ EPSILON),
/* harmony export */   "RANDOM": () => (/* binding */ RANDOM),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "setMatrixArrayType": () => (/* binding */ setMatrixArrayType),
/* harmony export */   "toRadian": () => (/* binding */ toRadian)
/* harmony export */ });
/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
var RANDOM = Math.random;
/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Float32ArrayConstructor | ArrayConstructor} type Array type, such as Float32Array or Array
 */

function setMatrixArrayType(type) {
  ARRAY_TYPE = type;
}
var degree = Math.PI / 180;
/**
 * Convert Degree To Radian
 *
 * @param {Number} a Angle in Degrees
 */

function toRadian(a) {
  return a * degree;
}
/**
 * Tests whether or not the arguments have approximately the same value, within an absolute
 * or relative tolerance of glMatrix.EPSILON (an absolute tolerance is used for values less
 * than or equal to 1.0, and a relative tolerance is used for larger values)
 *
 * @param {Number} a The first number to test.
 * @param {Number} b The second number to test.
 * @returns {Boolean} True if the numbers are approximately equal, false otherwise.
 */

function equals(a, b) {
  return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

/***/ }),

/***/ "./node_modules/gl-matrix/esm/mat4.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/mat4.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "adjoint": () => (/* binding */ adjoint),
/* harmony export */   "clone": () => (/* binding */ clone),
/* harmony export */   "copy": () => (/* binding */ copy),
/* harmony export */   "create": () => (/* binding */ create),
/* harmony export */   "determinant": () => (/* binding */ determinant),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "exactEquals": () => (/* binding */ exactEquals),
/* harmony export */   "frob": () => (/* binding */ frob),
/* harmony export */   "fromQuat": () => (/* binding */ fromQuat),
/* harmony export */   "fromQuat2": () => (/* binding */ fromQuat2),
/* harmony export */   "fromRotation": () => (/* binding */ fromRotation),
/* harmony export */   "fromRotationTranslation": () => (/* binding */ fromRotationTranslation),
/* harmony export */   "fromRotationTranslationScale": () => (/* binding */ fromRotationTranslationScale),
/* harmony export */   "fromRotationTranslationScaleOrigin": () => (/* binding */ fromRotationTranslationScaleOrigin),
/* harmony export */   "fromScaling": () => (/* binding */ fromScaling),
/* harmony export */   "fromTranslation": () => (/* binding */ fromTranslation),
/* harmony export */   "fromValues": () => (/* binding */ fromValues),
/* harmony export */   "fromXRotation": () => (/* binding */ fromXRotation),
/* harmony export */   "fromYRotation": () => (/* binding */ fromYRotation),
/* harmony export */   "fromZRotation": () => (/* binding */ fromZRotation),
/* harmony export */   "frustum": () => (/* binding */ frustum),
/* harmony export */   "getRotation": () => (/* binding */ getRotation),
/* harmony export */   "getScaling": () => (/* binding */ getScaling),
/* harmony export */   "getTranslation": () => (/* binding */ getTranslation),
/* harmony export */   "identity": () => (/* binding */ identity),
/* harmony export */   "invert": () => (/* binding */ invert),
/* harmony export */   "lookAt": () => (/* binding */ lookAt),
/* harmony export */   "mul": () => (/* binding */ mul),
/* harmony export */   "multiply": () => (/* binding */ multiply),
/* harmony export */   "multiplyScalar": () => (/* binding */ multiplyScalar),
/* harmony export */   "multiplyScalarAndAdd": () => (/* binding */ multiplyScalarAndAdd),
/* harmony export */   "ortho": () => (/* binding */ ortho),
/* harmony export */   "orthoNO": () => (/* binding */ orthoNO),
/* harmony export */   "orthoZO": () => (/* binding */ orthoZO),
/* harmony export */   "perspective": () => (/* binding */ perspective),
/* harmony export */   "perspectiveFromFieldOfView": () => (/* binding */ perspectiveFromFieldOfView),
/* harmony export */   "perspectiveNO": () => (/* binding */ perspectiveNO),
/* harmony export */   "perspectiveZO": () => (/* binding */ perspectiveZO),
/* harmony export */   "rotate": () => (/* binding */ rotate),
/* harmony export */   "rotateX": () => (/* binding */ rotateX),
/* harmony export */   "rotateY": () => (/* binding */ rotateY),
/* harmony export */   "rotateZ": () => (/* binding */ rotateZ),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "set": () => (/* binding */ set),
/* harmony export */   "str": () => (/* binding */ str),
/* harmony export */   "sub": () => (/* binding */ sub),
/* harmony export */   "subtract": () => (/* binding */ subtract),
/* harmony export */   "targetTo": () => (/* binding */ targetTo),
/* harmony export */   "translate": () => (/* binding */ translate),
/* harmony export */   "transpose": () => (/* binding */ transpose)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(16);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }

  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {ReadonlyMat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(16);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Create a new mat4 with the given values
 *
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} A new mat4
 */

function fromValues(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(16);
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set the components of a mat4 to the given values
 *
 * @param {mat4} out the receiving matrix
 * @param {Number} m00 Component in column 0, row 0 position (index 0)
 * @param {Number} m01 Component in column 0, row 1 position (index 1)
 * @param {Number} m02 Component in column 0, row 2 position (index 2)
 * @param {Number} m03 Component in column 0, row 3 position (index 3)
 * @param {Number} m10 Component in column 1, row 0 position (index 4)
 * @param {Number} m11 Component in column 1, row 1 position (index 5)
 * @param {Number} m12 Component in column 1, row 2 position (index 6)
 * @param {Number} m13 Component in column 1, row 3 position (index 7)
 * @param {Number} m20 Component in column 2, row 0 position (index 8)
 * @param {Number} m21 Component in column 2, row 1 position (index 9)
 * @param {Number} m22 Component in column 2, row 2 position (index 10)
 * @param {Number} m23 Component in column 2, row 3 position (index 11)
 * @param {Number} m30 Component in column 3, row 0 position (index 12)
 * @param {Number} m31 Component in column 3, row 1 position (index 13)
 * @param {Number} m32 Component in column 3, row 2 position (index 14)
 * @param {Number} m33 Component in column 3, row 3 position (index 15)
 * @returns {mat4} out
 */

function set(out, m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33) {
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  out[12] = m30;
  out[13] = m31;
  out[14] = m32;
  out[15] = m33;
  return out;
}
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */

function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function transpose(out, a) {
  // If we are transposing ourselves we can skip a few steps but have to cache some values
  if (out === a) {
    var a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a12 = a[6],
        a13 = a[7];
    var a23 = a[11];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a01;
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a02;
    out[9] = a12;
    out[11] = a[14];
    out[12] = a03;
    out[13] = a13;
    out[14] = a23;
  } else {
    out[0] = a[0];
    out[1] = a[4];
    out[2] = a[8];
    out[3] = a[12];
    out[4] = a[1];
    out[5] = a[5];
    out[6] = a[9];
    out[7] = a[13];
    out[8] = a[2];
    out[9] = a[6];
    out[10] = a[10];
    out[11] = a[14];
    out[12] = a[3];
    out[13] = a[7];
    out[14] = a[11];
    out[15] = a[15];
  }

  return out;
}
/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function invert(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) {
    return null;
  }

  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
  return out;
}
/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function adjoint(out, a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  out[0] = a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22);
  out[1] = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
  out[2] = a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12);
  out[3] = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
  out[4] = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
  out[5] = a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22);
  out[6] = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
  out[7] = a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12);
  out[8] = a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21);
  out[9] = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
  out[10] = a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11);
  out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
  out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
  out[13] = a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21);
  out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
  out[15] = a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11);
  return out;
}
/**
 * Calculates the determinant of a mat4
 *
 * @param {ReadonlyMat4} a the source matrix
 * @returns {Number} determinant of a
 */

function determinant(a) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15];
  var b00 = a00 * a11 - a01 * a10;
  var b01 = a00 * a12 - a02 * a10;
  var b02 = a00 * a13 - a03 * a10;
  var b03 = a01 * a12 - a02 * a11;
  var b04 = a01 * a13 - a03 * a11;
  var b05 = a02 * a13 - a03 * a12;
  var b06 = a20 * a31 - a21 * a30;
  var b07 = a20 * a32 - a22 * a30;
  var b08 = a20 * a33 - a23 * a30;
  var b09 = a21 * a32 - a22 * a31;
  var b10 = a21 * a33 - a23 * a31;
  var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */

function translate(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;

  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }

  return out;
}
/**
 * Scales the mat4 by the dimensions in the given vec3 not using vectorization
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {ReadonlyVec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/

function scale(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  out[0] = a[0] * x;
  out[1] = a[1] * x;
  out[2] = a[2] * x;
  out[3] = a[3] * x;
  out[4] = a[4] * y;
  out[5] = a[5] * y;
  out[6] = a[6] * y;
  out[7] = a[7] * y;
  out[8] = a[8] * z;
  out[9] = a[9] * z;
  out[10] = a[10] * z;
  out[11] = a[11] * z;
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */

function rotate(out, a, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;

  if (len < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11]; // Construct the elements of the rotation matrix

  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  return out;
}
/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateX(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[4] = a10 * c + a20 * s;
  out[5] = a11 * c + a21 * s;
  out[6] = a12 * c + a22 * s;
  out[7] = a13 * c + a23 * s;
  out[8] = a20 * c - a10 * s;
  out[9] = a21 * c - a11 * s;
  out[10] = a22 * c - a12 * s;
  out[11] = a23 * c - a13 * s;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateY(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a20 = a[8];
  var a21 = a[9];
  var a22 = a[10];
  var a23 = a[11];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged rows
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c - a20 * s;
  out[1] = a01 * c - a21 * s;
  out[2] = a02 * c - a22 * s;
  out[3] = a03 * c - a23 * s;
  out[8] = a00 * s + a20 * c;
  out[9] = a01 * s + a21 * c;
  out[10] = a02 * s + a22 * c;
  out[11] = a03 * s + a23 * c;
  return out;
}
/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function rotateZ(out, a, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var a00 = a[0];
  var a01 = a[1];
  var a02 = a[2];
  var a03 = a[3];
  var a10 = a[4];
  var a11 = a[5];
  var a12 = a[6];
  var a13 = a[7];

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  } // Perform axis-specific matrix multiplication


  out[0] = a00 * c + a10 * s;
  out[1] = a01 * c + a11 * s;
  out[2] = a02 * c + a12 * s;
  out[3] = a03 * c + a13 * s;
  out[4] = a10 * c - a00 * s;
  out[5] = a11 * c - a01 * s;
  out[6] = a12 * c - a02 * s;
  out[7] = a13 * c - a03 * s;
  return out;
}
/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */

function fromTranslation(out, v) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyVec3} v Scaling vector
 * @returns {mat4} out
 */

function fromScaling(out, v) {
  out[0] = v[0];
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = v[1];
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = v[2];
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */

function fromRotation(out, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;

  if (len < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c; // Perform rotation-specific matrix multiplication

  out[0] = x * x * t + c;
  out[1] = y * x * t + z * s;
  out[2] = z * x * t - y * s;
  out[3] = 0;
  out[4] = x * y * t - z * s;
  out[5] = y * y * t + c;
  out[6] = z * y * t + x * s;
  out[7] = 0;
  out[8] = x * z * t + y * s;
  out[9] = y * z * t - x * s;
  out[10] = z * z * t + c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromXRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = c;
  out[6] = s;
  out[7] = 0;
  out[8] = 0;
  out[9] = -s;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromYRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = 0;
  out[2] = -s;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = s;
  out[9] = 0;
  out[10] = c;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */

function fromZRotation(out, rad) {
  var s = Math.sin(rad);
  var c = Math.cos(rad); // Perform axis-specific matrix multiplication

  out[0] = c;
  out[1] = s;
  out[2] = 0;
  out[3] = 0;
  out[4] = -s;
  out[5] = c;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @returns {mat4} out
 */

function fromRotationTranslation(out, q, v) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - (yy + zz);
  out[1] = xy + wz;
  out[2] = xz - wy;
  out[3] = 0;
  out[4] = xy - wz;
  out[5] = 1 - (xx + zz);
  out[6] = yz + wx;
  out[7] = 0;
  out[8] = xz + wy;
  out[9] = yz - wx;
  out[10] = 1 - (xx + yy);
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a new mat4 from a dual quat.
 *
 * @param {mat4} out Matrix
 * @param {ReadonlyQuat2} a Dual Quaternion
 * @returns {mat4} mat4 receiving operation result
 */

function fromQuat2(out, a) {
  var translation = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  var bx = -a[0],
      by = -a[1],
      bz = -a[2],
      bw = a[3],
      ax = a[4],
      ay = a[5],
      az = a[6],
      aw = a[7];
  var magnitude = bx * bx + by * by + bz * bz + bw * bw; //Only scale if it makes sense

  if (magnitude > 0) {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2 / magnitude;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2 / magnitude;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2 / magnitude;
  } else {
    translation[0] = (ax * bw + aw * bx + ay * bz - az * by) * 2;
    translation[1] = (ay * bw + aw * by + az * bx - ax * bz) * 2;
    translation[2] = (az * bw + aw * bz + ax * by - ay * bx) * 2;
  }

  fromRotationTranslation(out, a, translation);
  return out;
}
/**
 * Returns the translation vector component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslation,
 *  the returned vector will be the same as the translation vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive translation component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */

function getTranslation(out, mat) {
  out[0] = mat[12];
  out[1] = mat[13];
  out[2] = mat[14];
  return out;
}
/**
 * Returns the scaling factor component of a transformation
 *  matrix. If a matrix is built with fromRotationTranslationScale
 *  with a normalized Quaternion paramter, the returned vector will be
 *  the same as the scaling vector
 *  originally supplied.
 * @param  {vec3} out Vector to receive scaling factor component
 * @param  {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {vec3} out
 */

function getScaling(out, mat) {
  var m11 = mat[0];
  var m12 = mat[1];
  var m13 = mat[2];
  var m21 = mat[4];
  var m22 = mat[5];
  var m23 = mat[6];
  var m31 = mat[8];
  var m32 = mat[9];
  var m33 = mat[10];
  out[0] = Math.hypot(m11, m12, m13);
  out[1] = Math.hypot(m21, m22, m23);
  out[2] = Math.hypot(m31, m32, m33);
  return out;
}
/**
 * Returns a quaternion representing the rotational component
 *  of a transformation matrix. If a matrix is built with
 *  fromRotationTranslation, the returned quaternion will be the
 *  same as the quaternion originally supplied.
 * @param {quat} out Quaternion to receive the rotation component
 * @param {ReadonlyMat4} mat Matrix to be decomposed (input)
 * @return {quat} out
 */

function getRotation(out, mat) {
  var scaling = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  getScaling(scaling, mat);
  var is1 = 1 / scaling[0];
  var is2 = 1 / scaling[1];
  var is3 = 1 / scaling[2];
  var sm11 = mat[0] * is1;
  var sm12 = mat[1] * is2;
  var sm13 = mat[2] * is3;
  var sm21 = mat[4] * is1;
  var sm22 = mat[5] * is2;
  var sm23 = mat[6] * is3;
  var sm31 = mat[8] * is1;
  var sm32 = mat[9] * is2;
  var sm33 = mat[10] * is3;
  var trace = sm11 + sm22 + sm33;
  var S = 0;

  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (sm23 - sm32) / S;
    out[1] = (sm31 - sm13) / S;
    out[2] = (sm12 - sm21) / S;
  } else if (sm11 > sm22 && sm11 > sm33) {
    S = Math.sqrt(1.0 + sm11 - sm22 - sm33) * 2;
    out[3] = (sm23 - sm32) / S;
    out[0] = 0.25 * S;
    out[1] = (sm12 + sm21) / S;
    out[2] = (sm31 + sm13) / S;
  } else if (sm22 > sm33) {
    S = Math.sqrt(1.0 + sm22 - sm11 - sm33) * 2;
    out[3] = (sm31 - sm13) / S;
    out[0] = (sm12 + sm21) / S;
    out[1] = 0.25 * S;
    out[2] = (sm23 + sm32) / S;
  } else {
    S = Math.sqrt(1.0 + sm33 - sm11 - sm22) * 2;
    out[3] = (sm12 - sm21) / S;
    out[0] = (sm31 + sm13) / S;
    out[1] = (sm23 + sm32) / S;
    out[2] = 0.25 * S;
  }

  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @returns {mat4} out
 */

function fromRotationTranslationScale(out, q, v, s) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  out[0] = (1 - (yy + zz)) * sx;
  out[1] = (xy + wz) * sx;
  out[2] = (xz - wy) * sx;
  out[3] = 0;
  out[4] = (xy - wz) * sy;
  out[5] = (1 - (xx + zz)) * sy;
  out[6] = (yz + wx) * sy;
  out[7] = 0;
  out[8] = (xz + wy) * sz;
  out[9] = (yz - wx) * sz;
  out[10] = (1 - (xx + yy)) * sz;
  out[11] = 0;
  out[12] = v[0];
  out[13] = v[1];
  out[14] = v[2];
  out[15] = 1;
  return out;
}
/**
 * Creates a matrix from a quaternion rotation, vector translation and vector scale, rotating and scaling around the given origin
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     mat4.translate(dest, origin);
 *     let quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *     mat4.scale(dest, scale)
 *     mat4.translate(dest, negativeOrigin);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {ReadonlyVec3} v Translation vector
 * @param {ReadonlyVec3} s Scaling vector
 * @param {ReadonlyVec3} o The origin vector around which to scale and rotate
 * @returns {mat4} out
 */

function fromRotationTranslationScaleOrigin(out, q, v, s, o) {
  // Quaternion math
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var xy = x * y2;
  var xz = x * z2;
  var yy = y * y2;
  var yz = y * z2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  var sx = s[0];
  var sy = s[1];
  var sz = s[2];
  var ox = o[0];
  var oy = o[1];
  var oz = o[2];
  var out0 = (1 - (yy + zz)) * sx;
  var out1 = (xy + wz) * sx;
  var out2 = (xz - wy) * sx;
  var out4 = (xy - wz) * sy;
  var out5 = (1 - (xx + zz)) * sy;
  var out6 = (yz + wx) * sy;
  var out8 = (xz + wy) * sz;
  var out9 = (yz - wx) * sz;
  var out10 = (1 - (xx + yy)) * sz;
  out[0] = out0;
  out[1] = out1;
  out[2] = out2;
  out[3] = 0;
  out[4] = out4;
  out[5] = out5;
  out[6] = out6;
  out[7] = 0;
  out[8] = out8;
  out[9] = out9;
  out[10] = out10;
  out[11] = 0;
  out[12] = v[0] + ox - (out0 * ox + out4 * oy + out8 * oz);
  out[13] = v[1] + oy - (out1 * ox + out5 * oy + out9 * oz);
  out[14] = v[2] + oz - (out2 * ox + out6 * oy + out10 * oz);
  out[15] = 1;
  return out;
}
/**
 * Calculates a 4x4 matrix from the given quaternion
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {ReadonlyQuat} q Quaternion to create matrix from
 *
 * @returns {mat4} out
 */

function fromQuat(out, q) {
  var x = q[0],
      y = q[1],
      z = q[2],
      w = q[3];
  var x2 = x + x;
  var y2 = y + y;
  var z2 = z + z;
  var xx = x * x2;
  var yx = y * x2;
  var yy = y * y2;
  var zx = z * x2;
  var zy = z * y2;
  var zz = z * z2;
  var wx = w * x2;
  var wy = w * y2;
  var wz = w * z2;
  out[0] = 1 - yy - zz;
  out[1] = yx + wz;
  out[2] = zx - wy;
  out[3] = 0;
  out[4] = yx - wz;
  out[5] = 1 - xx - zz;
  out[6] = zy + wx;
  out[7] = 0;
  out[8] = zx + wy;
  out[9] = zy - wx;
  out[10] = 1 - xx - yy;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */

function frustum(out, left, right, bottom, top, near, far) {
  var rl = 1 / (right - left);
  var tb = 1 / (top - bottom);
  var nf = 1 / (near - far);
  out[0] = near * 2 * rl;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = near * 2 * tb;
  out[6] = 0;
  out[7] = 0;
  out[8] = (right + left) * rl;
  out[9] = (top + bottom) * tb;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = far * near * 2 * nf;
  out[15] = 0;
  return out;
}
/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */

var perspective = perspectiveNO;
/**
 * Generates a perspective projection matrix suitable for WebGPU with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveZO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = far * nf;
    out[14] = far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -near;
  }

  return out;
}
/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Object} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function perspectiveFromFieldOfView(out, fov, near, far) {
  var upTan = Math.tan(fov.upDegrees * Math.PI / 180.0);
  var downTan = Math.tan(fov.downDegrees * Math.PI / 180.0);
  var leftTan = Math.tan(fov.leftDegrees * Math.PI / 180.0);
  var rightTan = Math.tan(fov.rightDegrees * Math.PI / 180.0);
  var xScale = 2.0 / (leftTan + rightTan);
  var yScale = 2.0 / (upTan + downTan);
  out[0] = xScale;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  out[4] = 0.0;
  out[5] = yScale;
  out[6] = 0.0;
  out[7] = 0.0;
  out[8] = -((leftTan - rightTan) * xScale * 0.5);
  out[9] = (upTan - downTan) * yScale * 0.5;
  out[10] = far / (near - far);
  out[11] = -1.0;
  out[12] = 0.0;
  out[13] = 0.0;
  out[14] = far * near / (near - far);
  out[15] = 0.0;
  return out;
}
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoNO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}
/**
 * Alias for {@link mat4.orthoNO}
 * @function
 */

var ortho = orthoNO;
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [0, 1],
 * which matches WebGPU/Vulkan/DirectX/Metal's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoZO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = near * nf;
  out[15] = 1;
  return out;
}
/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON && Math.abs(eyey - centery) < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON && Math.abs(eyez - centerz) < _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON) {
    return identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);

  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);

  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}
/**
 * Generates a matrix that makes something look at something else.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function targetTo(out, eye, target, up) {
  var eyex = eye[0],
      eyey = eye[1],
      eyez = eye[2],
      upx = up[0],
      upy = up[1],
      upz = up[2];
  var z0 = eyex - target[0],
      z1 = eyey - target[1],
      z2 = eyez - target[2];
  var len = z0 * z0 + z1 * z1 + z2 * z2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    z0 *= len;
    z1 *= len;
    z2 *= len;
  }

  var x0 = upy * z2 - upz * z1,
      x1 = upz * z0 - upx * z2,
      x2 = upx * z1 - upy * z0;
  len = x0 * x0 + x1 * x1 + x2 * x2;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  out[0] = x0;
  out[1] = x1;
  out[2] = x2;
  out[3] = 0;
  out[4] = z1 * x2 - z2 * x1;
  out[5] = z2 * x0 - z0 * x2;
  out[6] = z0 * x1 - z1 * x0;
  out[7] = 0;
  out[8] = z0;
  out[9] = z1;
  out[10] = z2;
  out[11] = 0;
  out[12] = eyex;
  out[13] = eyey;
  out[14] = eyez;
  out[15] = 1;
  return out;
}
/**
 * Returns a string representation of a mat4
 *
 * @param {ReadonlyMat4} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */

function str(a) {
  return "mat4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ", " + a[4] + ", " + a[5] + ", " + a[6] + ", " + a[7] + ", " + a[8] + ", " + a[9] + ", " + a[10] + ", " + a[11] + ", " + a[12] + ", " + a[13] + ", " + a[14] + ", " + a[15] + ")";
}
/**
 * Returns Frobenius norm of a mat4
 *
 * @param {ReadonlyMat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */

function frob(a) {
  return Math.hypot(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
}
/**
 * Adds two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  out[4] = a[4] + b[4];
  out[5] = a[5] + b[5];
  out[6] = a[6] + b[6];
  out[7] = a[7] + b[7];
  out[8] = a[8] + b[8];
  out[9] = a[9] + b[9];
  out[10] = a[10] + b[10];
  out[11] = a[11] + b[11];
  out[12] = a[12] + b[12];
  out[13] = a[13] + b[13];
  out[14] = a[14] + b[14];
  out[15] = a[15] + b[15];
  return out;
}
/**
 * Subtracts matrix b from matrix a
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  out[4] = a[4] - b[4];
  out[5] = a[5] - b[5];
  out[6] = a[6] - b[6];
  out[7] = a[7] - b[7];
  out[8] = a[8] - b[8];
  out[9] = a[9] - b[9];
  out[10] = a[10] - b[10];
  out[11] = a[11] - b[11];
  out[12] = a[12] - b[12];
  out[13] = a[13] - b[13];
  out[14] = a[14] - b[14];
  out[15] = a[15] - b[15];
  return out;
}
/**
 * Multiply each element of the matrix by a scalar.
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to scale
 * @param {Number} b amount to scale the matrix's elements by
 * @returns {mat4} out
 */

function multiplyScalar(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  out[4] = a[4] * b;
  out[5] = a[5] * b;
  out[6] = a[6] * b;
  out[7] = a[7] * b;
  out[8] = a[8] * b;
  out[9] = a[9] * b;
  out[10] = a[10] * b;
  out[11] = a[11] * b;
  out[12] = a[12] * b;
  out[13] = a[13] * b;
  out[14] = a[14] * b;
  out[15] = a[15] * b;
  return out;
}
/**
 * Adds two mat4's after multiplying each element of the second operand by a scalar value.
 *
 * @param {mat4} out the receiving vector
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @param {Number} scale the amount to scale b's elements by before adding
 * @returns {mat4} out
 */

function multiplyScalarAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  out[4] = a[4] + b[4] * scale;
  out[5] = a[5] + b[5] * scale;
  out[6] = a[6] + b[6] * scale;
  out[7] = a[7] + b[7] * scale;
  out[8] = a[8] + b[8] * scale;
  out[9] = a[9] + b[9] * scale;
  out[10] = a[10] + b[10] * scale;
  out[11] = a[11] + b[11] * scale;
  out[12] = a[12] + b[12] * scale;
  out[13] = a[13] + b[13] * scale;
  out[14] = a[14] + b[14] * scale;
  out[15] = a[15] + b[15] * scale;
  return out;
}
/**
 * Returns whether or not the matrices have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4] && a[5] === b[5] && a[6] === b[6] && a[7] === b[7] && a[8] === b[8] && a[9] === b[9] && a[10] === b[10] && a[11] === b[11] && a[12] === b[12] && a[13] === b[13] && a[14] === b[14] && a[15] === b[15];
}
/**
 * Returns whether or not the matrices have approximately the same elements in the same position.
 *
 * @param {ReadonlyMat4} a The first matrix.
 * @param {ReadonlyMat4} b The second matrix.
 * @returns {Boolean} True if the matrices are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var a4 = a[4],
      a5 = a[5],
      a6 = a[6],
      a7 = a[7];
  var a8 = a[8],
      a9 = a[9],
      a10 = a[10],
      a11 = a[11];
  var a12 = a[12],
      a13 = a[13],
      a14 = a[14],
      a15 = a[15];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  var b4 = b[4],
      b5 = b[5],
      b6 = b[6],
      b7 = b[7];
  var b8 = b[8],
      b9 = b[9],
      b10 = b[10],
      b11 = b[11];
  var b12 = b[12],
      b13 = b[13],
      b14 = b[14],
      b15 = b[15];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) && Math.abs(a4 - b4) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) && Math.abs(a5 - b5) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) && Math.abs(a6 - b6) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) && Math.abs(a7 - b7) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) && Math.abs(a8 - b8) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8)) && Math.abs(a9 - b9) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a9), Math.abs(b9)) && Math.abs(a10 - b10) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a10), Math.abs(b10)) && Math.abs(a11 - b11) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a11), Math.abs(b11)) && Math.abs(a12 - b12) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a12), Math.abs(b12)) && Math.abs(a13 - b13) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a13), Math.abs(b13)) && Math.abs(a14 - b14) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a14), Math.abs(b14)) && Math.abs(a15 - b15) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a15), Math.abs(b15));
}
/**
 * Alias for {@link mat4.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link mat4.subtract}
 * @function
 */

var sub = subtract;

/***/ }),

/***/ "./node_modules/gl-matrix/esm/vec3.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/vec3.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "angle": () => (/* binding */ angle),
/* harmony export */   "bezier": () => (/* binding */ bezier),
/* harmony export */   "ceil": () => (/* binding */ ceil),
/* harmony export */   "clone": () => (/* binding */ clone),
/* harmony export */   "copy": () => (/* binding */ copy),
/* harmony export */   "create": () => (/* binding */ create),
/* harmony export */   "cross": () => (/* binding */ cross),
/* harmony export */   "dist": () => (/* binding */ dist),
/* harmony export */   "distance": () => (/* binding */ distance),
/* harmony export */   "div": () => (/* binding */ div),
/* harmony export */   "divide": () => (/* binding */ divide),
/* harmony export */   "dot": () => (/* binding */ dot),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "exactEquals": () => (/* binding */ exactEquals),
/* harmony export */   "floor": () => (/* binding */ floor),
/* harmony export */   "forEach": () => (/* binding */ forEach),
/* harmony export */   "fromValues": () => (/* binding */ fromValues),
/* harmony export */   "hermite": () => (/* binding */ hermite),
/* harmony export */   "inverse": () => (/* binding */ inverse),
/* harmony export */   "len": () => (/* binding */ len),
/* harmony export */   "length": () => (/* binding */ length),
/* harmony export */   "lerp": () => (/* binding */ lerp),
/* harmony export */   "max": () => (/* binding */ max),
/* harmony export */   "min": () => (/* binding */ min),
/* harmony export */   "mul": () => (/* binding */ mul),
/* harmony export */   "multiply": () => (/* binding */ multiply),
/* harmony export */   "negate": () => (/* binding */ negate),
/* harmony export */   "normalize": () => (/* binding */ normalize),
/* harmony export */   "random": () => (/* binding */ random),
/* harmony export */   "rotateX": () => (/* binding */ rotateX),
/* harmony export */   "rotateY": () => (/* binding */ rotateY),
/* harmony export */   "rotateZ": () => (/* binding */ rotateZ),
/* harmony export */   "round": () => (/* binding */ round),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "scaleAndAdd": () => (/* binding */ scaleAndAdd),
/* harmony export */   "set": () => (/* binding */ set),
/* harmony export */   "sqrDist": () => (/* binding */ sqrDist),
/* harmony export */   "sqrLen": () => (/* binding */ sqrLen),
/* harmony export */   "squaredDistance": () => (/* binding */ squaredDistance),
/* harmony export */   "squaredLength": () => (/* binding */ squaredLength),
/* harmony export */   "str": () => (/* binding */ str),
/* harmony export */   "sub": () => (/* binding */ sub),
/* harmony export */   "subtract": () => (/* binding */ subtract),
/* harmony export */   "transformMat3": () => (/* binding */ transformMat3),
/* harmony export */   "transformMat4": () => (/* binding */ transformMat4),
/* harmony export */   "transformQuat": () => (/* binding */ transformQuat),
/* harmony export */   "zero": () => (/* binding */ zero)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {ReadonlyVec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */

function fromValues(x, y, z) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */

function set(out, x, y, z) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  return out;
}
/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  return out;
}
/**
 * Math.ceil the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to ceil
 * @returns {vec3} out
 */

function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  return out;
}
/**
 * Math.floor the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to floor
 * @returns {vec3} out
 */

function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  return out;
}
/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  return out;
}
/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  return out;
}
/**
 * Math.round the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to round
 * @returns {vec3} out
 */

function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.hypot(x, y, z);
}
/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return x * x + y * y + z * z;
}
/**
 * Calculates the squared length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return x * x + y * y + z * z;
}
/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to negate
 * @returns {vec3} out
 */

function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  return out;
}
/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to invert
 * @returns {vec3} out
 */

function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function cross(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  return out;
}
/**
 * Performs a hermite interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function hermite(out, a, b, c, d, t) {
  var factorTimes2 = t * t;
  var factor1 = factorTimes2 * (2 * t - 3) + 1;
  var factor2 = factorTimes2 * (t - 2) + t;
  var factor3 = factorTimes2 * (t - 1);
  var factor4 = factorTimes2 * (3 - 2 * t);
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Performs a bezier interpolation with two control points
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @param {ReadonlyVec3} c the third operand
 * @param {ReadonlyVec3} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec3} out
 */

function bezier(out, a, b, c, d, t) {
  var inverseFactor = 1 - t;
  var inverseFactorTimesTwo = inverseFactor * inverseFactor;
  var factorTimes2 = t * t;
  var factor1 = inverseFactorTimesTwo * inverseFactor;
  var factor2 = 3 * t * inverseFactorTimesTwo;
  var factor3 = 3 * factorTimes2 * inverseFactor;
  var factor4 = factorTimes2 * t;
  out[0] = a[0] * factor1 + b[0] * factor2 + c[0] * factor3 + d[0] * factor4;
  out[1] = a[1] * factor1 + b[1] * factor2 + c[1] * factor3 + d[1] * factor4;
  out[2] = a[2] * factor1 + b[2] * factor2 + c[2] * factor3 + d[2] * factor4;
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */

function random(out, scale) {
  scale = scale || 1.0;
  var r = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2.0 * Math.PI;
  var z = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2.0 - 1.0;
  var zScale = Math.sqrt(1.0 - z * z) * scale;
  out[0] = Math.cos(r) * zScale;
  out[1] = Math.sin(r) * zScale;
  out[2] = z * scale;
  return out;
}
/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */

function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat3} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */

function transformMat3(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  out[0] = x * m[0] + y * m[3] + z * m[6];
  out[1] = x * m[1] + y * m[4] + z * m[7];
  out[2] = x * m[2] + y * m[5] + z * m[8];
  return out;
}
/**
 * Transforms the vec3 with a quat
 * Can also be used for dual quaternions. (Multiply it with the real part)
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
 * @returns {vec3} out
 */

function transformQuat(out, a, q) {
  // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3];
  var x = a[0],
      y = a[1],
      z = a[2]; // var qvec = [qx, qy, qz];
  // var uv = vec3.cross([], qvec, a);

  var uvx = qy * z - qz * y,
      uvy = qz * x - qx * z,
      uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

  var uuvx = qy * uvz - qz * uvy,
      uuvy = qz * uvx - qx * uvz,
      uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

  var w2 = qw * 2;
  uvx *= w2;
  uvy *= w2;
  uvz *= w2; // vec3.scale(uuv, uuv, 2);

  uuvx *= 2;
  uuvy *= 2;
  uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

  out[0] = x + uvx + uuvx;
  out[1] = y + uvy + uuvy;
  out[2] = z + uvz + uuvz;
  return out;
}
/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateX(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0];
  r[1] = p[1] * Math.cos(rad) - p[2] * Math.sin(rad);
  r[2] = p[1] * Math.sin(rad) + p[2] * Math.cos(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateY(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[2] * Math.sin(rad) + p[0] * Math.cos(rad);
  r[1] = p[1];
  r[2] = p[2] * Math.cos(rad) - p[0] * Math.sin(rad); //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {ReadonlyVec3} a The vec3 point to rotate
 * @param {ReadonlyVec3} b The origin of the rotation
 * @param {Number} rad The angle of rotation in radians
 * @returns {vec3} out
 */

function rotateZ(out, a, b, rad) {
  var p = [],
      r = []; //Translate point to the origin

  p[0] = a[0] - b[0];
  p[1] = a[1] - b[1];
  p[2] = a[2] - b[2]; //perform rotation

  r[0] = p[0] * Math.cos(rad) - p[1] * Math.sin(rad);
  r[1] = p[0] * Math.sin(rad) + p[1] * Math.cos(rad);
  r[2] = p[2]; //translate to correct position

  out[0] = r[0] + b[0];
  out[1] = r[1] + b[1];
  out[2] = r[2] + b[2];
  return out;
}
/**
 * Get the angle between two 3D vectors
 * @param {ReadonlyVec3} a The first operand
 * @param {ReadonlyVec3} b The second operand
 * @returns {Number} The angle in radians
 */

function angle(a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2],
      bx = b[0],
      by = b[1],
      bz = b[2],
      mag1 = Math.sqrt(ax * ax + ay * ay + az * az),
      mag2 = Math.sqrt(bx * bx + by * by + bz * bz),
      mag = mag1 * mag2,
      cosine = mag && dot(a, b) / mag;
  return Math.acos(Math.min(Math.max(cosine, -1), 1));
}
/**
 * Set the components of a vec3 to zero
 *
 * @param {vec3} out the receiving vector
 * @returns {vec3} out
 */

function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec3} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str(a) {
  return "vec3(" + a[0] + ", " + a[1] + ", " + a[2] + ")";
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2));
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec3.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link vec3.divide}
 * @function
 */

var div = divide;
/**
 * Alias for {@link vec3.distance}
 * @function
 */

var dist = distance;
/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */

var sqrDist = squaredDistance;
/**
 * Alias for {@link vec3.length}
 * @function
 */

var len = length;
/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */

var sqrLen = squaredLength;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
}();

/***/ }),

/***/ "./node_modules/gl-matrix/esm/vec4.js":
/*!********************************************!*\
  !*** ./node_modules/gl-matrix/esm/vec4.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "add": () => (/* binding */ add),
/* harmony export */   "ceil": () => (/* binding */ ceil),
/* harmony export */   "clone": () => (/* binding */ clone),
/* harmony export */   "copy": () => (/* binding */ copy),
/* harmony export */   "create": () => (/* binding */ create),
/* harmony export */   "cross": () => (/* binding */ cross),
/* harmony export */   "dist": () => (/* binding */ dist),
/* harmony export */   "distance": () => (/* binding */ distance),
/* harmony export */   "div": () => (/* binding */ div),
/* harmony export */   "divide": () => (/* binding */ divide),
/* harmony export */   "dot": () => (/* binding */ dot),
/* harmony export */   "equals": () => (/* binding */ equals),
/* harmony export */   "exactEquals": () => (/* binding */ exactEquals),
/* harmony export */   "floor": () => (/* binding */ floor),
/* harmony export */   "forEach": () => (/* binding */ forEach),
/* harmony export */   "fromValues": () => (/* binding */ fromValues),
/* harmony export */   "inverse": () => (/* binding */ inverse),
/* harmony export */   "len": () => (/* binding */ len),
/* harmony export */   "length": () => (/* binding */ length),
/* harmony export */   "lerp": () => (/* binding */ lerp),
/* harmony export */   "max": () => (/* binding */ max),
/* harmony export */   "min": () => (/* binding */ min),
/* harmony export */   "mul": () => (/* binding */ mul),
/* harmony export */   "multiply": () => (/* binding */ multiply),
/* harmony export */   "negate": () => (/* binding */ negate),
/* harmony export */   "normalize": () => (/* binding */ normalize),
/* harmony export */   "random": () => (/* binding */ random),
/* harmony export */   "round": () => (/* binding */ round),
/* harmony export */   "scale": () => (/* binding */ scale),
/* harmony export */   "scaleAndAdd": () => (/* binding */ scaleAndAdd),
/* harmony export */   "set": () => (/* binding */ set),
/* harmony export */   "sqrDist": () => (/* binding */ sqrDist),
/* harmony export */   "sqrLen": () => (/* binding */ sqrLen),
/* harmony export */   "squaredDistance": () => (/* binding */ squaredDistance),
/* harmony export */   "squaredLength": () => (/* binding */ squaredLength),
/* harmony export */   "str": () => (/* binding */ str),
/* harmony export */   "sub": () => (/* binding */ sub),
/* harmony export */   "subtract": () => (/* binding */ subtract),
/* harmony export */   "transformMat4": () => (/* binding */ transformMat4),
/* harmony export */   "transformQuat": () => (/* binding */ transformQuat),
/* harmony export */   "zero": () => (/* binding */ zero)
/* harmony export */ });
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common.js */ "./node_modules/gl-matrix/esm/common.js");

/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */

function create() {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(4);

  if (_common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }

  return out;
}
/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {ReadonlyVec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */

function clone(a) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(4);
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */

function fromValues(x, y, z, w) {
  var out = new _common_js__WEBPACK_IMPORTED_MODULE_0__.ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the source vector
 * @returns {vec4} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  return out;
}
/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */

function set(out, x, y, z, w) {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  out[3] = a[3] + b[3];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  out[3] = a[3] - b[3];
  return out;
}
/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function multiply(out, a, b) {
  out[0] = a[0] * b[0];
  out[1] = a[1] * b[1];
  out[2] = a[2] * b[2];
  out[3] = a[3] * b[3];
  return out;
}
/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function divide(out, a, b) {
  out[0] = a[0] / b[0];
  out[1] = a[1] / b[1];
  out[2] = a[2] / b[2];
  out[3] = a[3] / b[3];
  return out;
}
/**
 * Math.ceil the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to ceil
 * @returns {vec4} out
 */

function ceil(out, a) {
  out[0] = Math.ceil(a[0]);
  out[1] = Math.ceil(a[1]);
  out[2] = Math.ceil(a[2]);
  out[3] = Math.ceil(a[3]);
  return out;
}
/**
 * Math.floor the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to floor
 * @returns {vec4} out
 */

function floor(out, a) {
  out[0] = Math.floor(a[0]);
  out[1] = Math.floor(a[1]);
  out[2] = Math.floor(a[2]);
  out[3] = Math.floor(a[3]);
  return out;
}
/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function min(out, a, b) {
  out[0] = Math.min(a[0], b[0]);
  out[1] = Math.min(a[1], b[1]);
  out[2] = Math.min(a[2], b[2]);
  out[3] = Math.min(a[3], b[3]);
  return out;
}
/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {vec4} out
 */

function max(out, a, b) {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
  out[2] = Math.max(a[2], b[2]);
  out[3] = Math.max(a[3], b[3]);
  return out;
}
/**
 * Math.round the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to round
 * @returns {vec4} out
 */

function round(out, a) {
  out[0] = Math.round(a[0]);
  out[1] = Math.round(a[1]);
  out[2] = Math.round(a[2]);
  out[3] = Math.round(a[3]);
  return out;
}
/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  out[3] = a[3] * b;
  return out;
}
/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */

function scaleAndAdd(out, a, b, scale) {
  out[0] = a[0] + b[0] * scale;
  out[1] = a[1] + b[1] * scale;
  out[2] = a[2] + b[2] * scale;
  out[3] = a[3] + b[3] * scale;
  return out;
}
/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return Math.hypot(x, y, z, w);
}
/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} squared distance between a and b
 */

function squaredDistance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  var w = b[3] - a[3];
  return x * x + y * y + z * z + w * w;
}
/**
 * Calculates the length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return Math.hypot(x, y, z, w);
}
/**
 * Calculates the squared length of a vec4
 *
 * @param {ReadonlyVec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */

function squaredLength(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  return x * x + y * y + z * z + w * w;
}
/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to negate
 * @returns {vec4} out
 */

function negate(out, a) {
  out[0] = -a[0];
  out[1] = -a[1];
  out[2] = -a[2];
  out[3] = -a[3];
  return out;
}
/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to invert
 * @returns {vec4} out
 */

function inverse(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
}
/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */

function normalize(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }

  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}
/**
 * Calculates the dot product of two vec4's
 *
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}
/**
 * Returns the cross-product of three vectors in a 4-dimensional space
 *
 * @param {ReadonlyVec4} result the receiving vector
 * @param {ReadonlyVec4} U the first vector
 * @param {ReadonlyVec4} V the second vector
 * @param {ReadonlyVec4} W the third vector
 * @returns {vec4} result
 */

function cross(out, u, v, w) {
  var A = v[0] * w[1] - v[1] * w[0],
      B = v[0] * w[2] - v[2] * w[0],
      C = v[0] * w[3] - v[3] * w[0],
      D = v[1] * w[2] - v[2] * w[1],
      E = v[1] * w[3] - v[3] * w[1],
      F = v[2] * w[3] - v[3] * w[2];
  var G = u[0];
  var H = u[1];
  var I = u[2];
  var J = u[3];
  out[0] = H * F - I * E + J * D;
  out[1] = -(G * F) + I * C - J * B;
  out[2] = G * E - H * C + J * A;
  out[3] = -(G * D) + H * B - I * A;
  return out;
}
/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the first operand
 * @param {ReadonlyVec4} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {vec4} out
 */

function lerp(out, a, b, t) {
  var ax = a[0];
  var ay = a[1];
  var az = a[2];
  var aw = a[3];
  out[0] = ax + t * (b[0] - ax);
  out[1] = ay + t * (b[1] - ay);
  out[2] = az + t * (b[2] - az);
  out[3] = aw + t * (b[3] - aw);
  return out;
}
/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */

function random(out, scale) {
  scale = scale || 1.0; // Marsaglia, George. Choosing a Point from the Surface of a
  // Sphere. Ann. Math. Statist. 43 (1972), no. 2, 645--646.
  // http://projecteuclid.org/euclid.aoms/1177692644;

  var v1, v2, v3, v4;
  var s1, s2;

  do {
    v1 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    v2 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    s1 = v1 * v1 + v2 * v2;
  } while (s1 >= 1);

  do {
    v3 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    v4 = _common_js__WEBPACK_IMPORTED_MODULE_0__.RANDOM() * 2 - 1;
    s2 = v3 * v3 + v4 * v4;
  } while (s2 >= 1);

  var d = Math.sqrt((1 - s1) / s2);
  out[0] = scale * v1;
  out[1] = scale * v2;
  out[2] = scale * v3 * d;
  out[3] = scale * v4 * d;
  return out;
}
/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec4} out
 */

function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2],
      w = a[3];
  out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
  out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
  out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
  out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
  return out;
}
/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a the vector to transform
 * @param {ReadonlyQuat} q quaternion to transform with
 * @returns {vec4} out
 */

function transformQuat(out, a, q) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var qx = q[0],
      qy = q[1],
      qz = q[2],
      qw = q[3]; // calculate quat * vec

  var ix = qw * x + qy * z - qz * y;
  var iy = qw * y + qz * x - qx * z;
  var iz = qw * z + qx * y - qy * x;
  var iw = -qx * x - qy * y - qz * z; // calculate result * inverse quat

  out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  out[3] = a[3];
  return out;
}
/**
 * Set the components of a vec4 to zero
 *
 * @param {vec4} out the receiving vector
 * @returns {vec4} out
 */

function zero(out) {
  out[0] = 0.0;
  out[1] = 0.0;
  out[2] = 0.0;
  out[3] = 0.0;
  return out;
}
/**
 * Returns a string representation of a vector
 *
 * @param {ReadonlyVec4} a vector to represent as a string
 * @returns {String} string representation of the vector
 */

function str(a) {
  return "vec4(" + a[0] + ", " + a[1] + ", " + a[2] + ", " + a[3] + ")";
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}
/**
 * Returns whether or not the vectors have approximately the same elements in the same position.
 *
 * @param {ReadonlyVec4} a The first vector.
 * @param {ReadonlyVec4} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function equals(a, b) {
  var a0 = a[0],
      a1 = a[1],
      a2 = a[2],
      a3 = a[3];
  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  return Math.abs(a0 - b0) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) && Math.abs(a1 - b1) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) && Math.abs(a2 - b2) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) && Math.abs(a3 - b3) <= _common_js__WEBPACK_IMPORTED_MODULE_0__.EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3));
}
/**
 * Alias for {@link vec4.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec4.multiply}
 * @function
 */

var mul = multiply;
/**
 * Alias for {@link vec4.divide}
 * @function
 */

var div = divide;
/**
 * Alias for {@link vec4.distance}
 * @function
 */

var dist = distance;
/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */

var sqrDist = squaredDistance;
/**
 * Alias for {@link vec4.length}
 * @function
 */

var len = length;
/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */

var sqrLen = squaredLength;
/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

var forEach = function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }

    return a;
  };
}();

/***/ }),

/***/ "./node_modules/gl-quat/slerp.js":
/*!***************************************!*\
  !*** ./node_modules/gl-quat/slerp.js ***!
  \***************************************/
/***/ ((module) => {

module.exports = slerp

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
function slerp (out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations

  var ax = a[0], ay = a[1], az = a[2], aw = a[3],
    bx = b[0], by = b[1], bz = b[2], bw = b[3]

  var omega, cosom, sinom, scale0, scale1

  // calc cosine
  cosom = ax * bx + ay * by + az * bz + aw * bw
  // adjust signs (if necessary)
  if (cosom < 0.0) {
    cosom = -cosom
    bx = -bx
    by = -by
    bz = -bz
    bw = -bw
  }
  // calculate coefficients
  if ((1.0 - cosom) > 0.000001) {
    // standard case (slerp)
    omega = Math.acos(cosom)
    sinom = Math.sin(omega)
    scale0 = Math.sin((1.0 - t) * omega) / sinom
    scale1 = Math.sin(t * omega) / sinom
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t
    scale1 = t
  }
  // calculate final values
  out[0] = scale0 * ax + scale1 * bx
  out[1] = scale0 * ay + scale1 * by
  out[2] = scale0 * az + scale1 * bz
  out[3] = scale0 * aw + scale1 * bw

  return out
}


/***/ }),

/***/ "./node_modules/gl-vec3/cross.js":
/*!***************************************!*\
  !*** ./node_modules/gl-vec3/cross.js ***!
  \***************************************/
/***/ ((module) => {

module.exports = cross;

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function cross(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2]

    out[0] = ay * bz - az * by
    out[1] = az * bx - ax * bz
    out[2] = ax * by - ay * bx
    return out
}

/***/ }),

/***/ "./node_modules/gl-vec3/dot.js":
/*!*************************************!*\
  !*** ./node_modules/gl-vec3/dot.js ***!
  \*************************************/
/***/ ((module) => {

module.exports = dot;

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

/***/ }),

/***/ "./node_modules/gl-vec3/length.js":
/*!****************************************!*\
  !*** ./node_modules/gl-vec3/length.js ***!
  \****************************************/
/***/ ((module) => {

module.exports = length;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    return Math.sqrt(x*x + y*y + z*z)
}

/***/ }),

/***/ "./node_modules/gl-vec3/lerp.js":
/*!**************************************!*\
  !*** ./node_modules/gl-vec3/lerp.js ***!
  \**************************************/
/***/ ((module) => {

module.exports = lerp;

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
function lerp(out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2]
    out[0] = ax + t * (b[0] - ax)
    out[1] = ay + t * (b[1] - ay)
    out[2] = az + t * (b[2] - az)
    return out
}

/***/ }),

/***/ "./node_modules/gl-vec3/normalize.js":
/*!*******************************************!*\
  !*** ./node_modules/gl-vec3/normalize.js ***!
  \*******************************************/
/***/ ((module) => {

module.exports = normalize;

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
function normalize(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    var len = x*x + y*y + z*z
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len)
        out[0] = a[0] * len
        out[1] = a[1] * len
        out[2] = a[2] * len
    }
    return out
}

/***/ }),

/***/ "./node_modules/has-passive-events/index.js":
/*!**************************************************!*\
  !*** ./node_modules/has-passive-events/index.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isBrowser = __webpack_require__(/*! is-browser */ "./node_modules/is-browser/client.js")

function detect() {
	var supported = false

	try {
		var opts = Object.defineProperty({}, 'passive', {
			get: function() {
				supported = true
			}
		})

		window.addEventListener('test', null, opts)
		window.removeEventListener('test', null, opts)
	} catch(e) {
		supported = false
	}

	return supported
}

module.exports = isBrowser && detect()


/***/ }),

/***/ "./node_modules/is-browser/client.js":
/*!*******************************************!*\
  !*** ./node_modules/is-browser/client.js ***!
  \*******************************************/
/***/ ((module) => {

module.exports = true;

/***/ }),

/***/ "./node_modules/mat4-decompose/index.js":
/*!**********************************************!*\
  !*** ./node_modules/mat4-decompose/index.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*jshint unused:true*/
/*
Input:  matrix      ; a 4x4 matrix
Output: translation ; a 3 component vector
        scale       ; a 3 component vector
        skew        ; skew factors XY,XZ,YZ represented as a 3 component vector
        perspective ; a 4 component vector
        quaternion  ; a 4 component vector
Returns false if the matrix cannot be decomposed, true if it can


References:
https://github.com/kamicane/matrix3d/blob/master/lib/Matrix3d.js
https://github.com/ChromiumWebApps/chromium/blob/master/ui/gfx/transform_util.cc
http://www.w3.org/TR/css3-transforms/#decomposing-a-3d-matrix
*/

var normalize = __webpack_require__(/*! ./normalize */ "./node_modules/mat4-decompose/normalize.js")

var create = __webpack_require__(/*! gl-mat4/create */ "./node_modules/gl-mat4/create.js")
var clone = __webpack_require__(/*! gl-mat4/clone */ "./node_modules/gl-mat4/clone.js")
var determinant = __webpack_require__(/*! gl-mat4/determinant */ "./node_modules/gl-mat4/determinant.js")
var invert = __webpack_require__(/*! gl-mat4/invert */ "./node_modules/gl-mat4/invert.js")
var transpose = __webpack_require__(/*! gl-mat4/transpose */ "./node_modules/gl-mat4/transpose.js")
var vec3 = {
    length: __webpack_require__(/*! gl-vec3/length */ "./node_modules/gl-vec3/length.js"),
    normalize: __webpack_require__(/*! gl-vec3/normalize */ "./node_modules/gl-vec3/normalize.js"),
    dot: __webpack_require__(/*! gl-vec3/dot */ "./node_modules/gl-vec3/dot.js"),
    cross: __webpack_require__(/*! gl-vec3/cross */ "./node_modules/gl-vec3/cross.js")
}

var tmp = create()
var perspectiveMatrix = create()
var tmpVec4 = [0, 0, 0, 0]
var row = [ [0,0,0], [0,0,0], [0,0,0] ]
var pdum3 = [0,0,0]

module.exports = function decomposeMat4(matrix, translation, scale, skew, perspective, quaternion) {
    if (!translation) translation = [0,0,0]
    if (!scale) scale = [0,0,0]
    if (!skew) skew = [0,0,0]
    if (!perspective) perspective = [0,0,0,1]
    if (!quaternion) quaternion = [0,0,0,1]

    //normalize, if not possible then bail out early
    if (!normalize(tmp, matrix))
        return false

    // perspectiveMatrix is used to solve for perspective, but it also provides
    // an easy way to test for singularity of the upper 3x3 component.
    clone(perspectiveMatrix, tmp)

    perspectiveMatrix[3] = 0
    perspectiveMatrix[7] = 0
    perspectiveMatrix[11] = 0
    perspectiveMatrix[15] = 1

    // If the perspectiveMatrix is not invertible, we are also unable to
    // decompose, so we'll bail early. Constant taken from SkMatrix44::invert.
    if (Math.abs(determinant(perspectiveMatrix) < 1e-8))
        return false

    var a03 = tmp[3], a13 = tmp[7], a23 = tmp[11],
            a30 = tmp[12], a31 = tmp[13], a32 = tmp[14], a33 = tmp[15]

    // First, isolate perspective.
    if (a03 !== 0 || a13 !== 0 || a23 !== 0) {
        tmpVec4[0] = a03
        tmpVec4[1] = a13
        tmpVec4[2] = a23
        tmpVec4[3] = a33

        // Solve the equation by inverting perspectiveMatrix and multiplying
        // rightHandSide by the inverse.
        // resuing the perspectiveMatrix here since it's no longer needed
        var ret = invert(perspectiveMatrix, perspectiveMatrix)
        if (!ret) return false
        transpose(perspectiveMatrix, perspectiveMatrix)

        //multiply by transposed inverse perspective matrix, into perspective vec4
        vec4multMat4(perspective, tmpVec4, perspectiveMatrix)
    } else { 
        //no perspective
        perspective[0] = perspective[1] = perspective[2] = 0
        perspective[3] = 1
    }

    // Next take care of translation
    translation[0] = a30
    translation[1] = a31
    translation[2] = a32

    // Now get scale and shear. 'row' is a 3 element array of 3 component vectors
    mat3from4(row, tmp)

    // Compute X scale factor and normalize first row.
    scale[0] = vec3.length(row[0])
    vec3.normalize(row[0], row[0])

    // Compute XY shear factor and make 2nd row orthogonal to 1st.
    skew[0] = vec3.dot(row[0], row[1])
    combine(row[1], row[1], row[0], 1.0, -skew[0])

    // Now, compute Y scale and normalize 2nd row.
    scale[1] = vec3.length(row[1])
    vec3.normalize(row[1], row[1])
    skew[0] /= scale[1]

    // Compute XZ and YZ shears, orthogonalize 3rd row
    skew[1] = vec3.dot(row[0], row[2])
    combine(row[2], row[2], row[0], 1.0, -skew[1])
    skew[2] = vec3.dot(row[1], row[2])
    combine(row[2], row[2], row[1], 1.0, -skew[2])

    // Next, get Z scale and normalize 3rd row.
    scale[2] = vec3.length(row[2])
    vec3.normalize(row[2], row[2])
    skew[1] /= scale[2]
    skew[2] /= scale[2]


    // At this point, the matrix (in rows) is orthonormal.
    // Check for a coordinate system flip.  If the determinant
    // is -1, then negate the matrix and the scaling factors.
    vec3.cross(pdum3, row[1], row[2])
    if (vec3.dot(row[0], pdum3) < 0) {
        for (var i = 0; i < 3; i++) {
            scale[i] *= -1;
            row[i][0] *= -1
            row[i][1] *= -1
            row[i][2] *= -1
        }
    }

    // Now, get the rotations out
    quaternion[0] = 0.5 * Math.sqrt(Math.max(1 + row[0][0] - row[1][1] - row[2][2], 0))
    quaternion[1] = 0.5 * Math.sqrt(Math.max(1 - row[0][0] + row[1][1] - row[2][2], 0))
    quaternion[2] = 0.5 * Math.sqrt(Math.max(1 - row[0][0] - row[1][1] + row[2][2], 0))
    quaternion[3] = 0.5 * Math.sqrt(Math.max(1 + row[0][0] + row[1][1] + row[2][2], 0))

    if (row[2][1] > row[1][2])
        quaternion[0] = -quaternion[0]
    if (row[0][2] > row[2][0])
        quaternion[1] = -quaternion[1]
    if (row[1][0] > row[0][1])
        quaternion[2] = -quaternion[2]
    return true
}

//will be replaced by gl-vec4 eventually
function vec4multMat4(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
}

//gets upper-left of a 4x4 matrix into a 3x3 of vectors
function mat3from4(out, mat4x4) {
    out[0][0] = mat4x4[0]
    out[0][1] = mat4x4[1]
    out[0][2] = mat4x4[2]
    
    out[1][0] = mat4x4[4]
    out[1][1] = mat4x4[5]
    out[1][2] = mat4x4[6]

    out[2][0] = mat4x4[8]
    out[2][1] = mat4x4[9]
    out[2][2] = mat4x4[10]
}

function combine(out, a, b, scale1, scale2) {
    out[0] = a[0] * scale1 + b[0] * scale2
    out[1] = a[1] * scale1 + b[1] * scale2
    out[2] = a[2] * scale1 + b[2] * scale2
}

/***/ }),

/***/ "./node_modules/mat4-decompose/normalize.js":
/*!**************************************************!*\
  !*** ./node_modules/mat4-decompose/normalize.js ***!
  \**************************************************/
/***/ ((module) => {

module.exports = function normalize(out, mat) {
    var m44 = mat[15]
    // Cannot normalize.
    if (m44 === 0) 
        return false
    var scale = 1 / m44
    for (var i=0; i<16; i++)
        out[i] = mat[i] * scale
    return true
}

/***/ }),

/***/ "./node_modules/mat4-interpolate/index.js":
/*!************************************************!*\
  !*** ./node_modules/mat4-interpolate/index.js ***!
  \************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var lerp = __webpack_require__(/*! gl-vec3/lerp */ "./node_modules/gl-vec3/lerp.js")

var recompose = __webpack_require__(/*! mat4-recompose */ "./node_modules/mat4-recompose/index.js")
var decompose = __webpack_require__(/*! mat4-decompose */ "./node_modules/mat4-decompose/index.js")
var determinant = __webpack_require__(/*! gl-mat4/determinant */ "./node_modules/gl-mat4/determinant.js")
var slerp = __webpack_require__(/*! quat-slerp */ "./node_modules/quat-slerp/index.js")

var state0 = state()
var state1 = state()
var tmp = state()

module.exports = interpolate
function interpolate(out, start, end, alpha) {
    if (determinant(start) === 0 || determinant(end) === 0)
        return false

    //decompose the start and end matrices into individual components
    var r0 = decompose(start, state0.translate, state0.scale, state0.skew, state0.perspective, state0.quaternion)
    var r1 = decompose(end, state1.translate, state1.scale, state1.skew, state1.perspective, state1.quaternion)
    if (!r0 || !r1)
        return false    


    //now lerp/slerp the start and end components into a temporary     lerp(tmptranslate, state0.translate, state1.translate, alpha)
    lerp(tmp.translate, state0.translate, state1.translate, alpha)
    lerp(tmp.skew, state0.skew, state1.skew, alpha)
    lerp(tmp.scale, state0.scale, state1.scale, alpha)
    lerp(tmp.perspective, state0.perspective, state1.perspective, alpha)
    slerp(tmp.quaternion, state0.quaternion, state1.quaternion, alpha)

    //and recompose into our 'out' matrix
    recompose(out, tmp.translate, tmp.scale, tmp.skew, tmp.perspective, tmp.quaternion)
    return true
}

function state() {
    return {
        translate: vec3(),
        scale: vec3(1),
        skew: vec3(),
        perspective: vec4(),
        quaternion: vec4()
    }
}

function vec3(n) {
    return [n||0,n||0,n||0]
}

function vec4() {
    return [0,0,0,1]
}

/***/ }),

/***/ "./node_modules/mat4-recompose/index.js":
/*!**********************************************!*\
  !*** ./node_modules/mat4-recompose/index.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*
Input:  translation ; a 3 component vector
        scale       ; a 3 component vector
        skew        ; skew factors XY,XZ,YZ represented as a 3 component vector
        perspective ; a 4 component vector
        quaternion  ; a 4 component vector
Output: matrix      ; a 4x4 matrix

From: http://www.w3.org/TR/css3-transforms/#recomposing-to-a-3d-matrix
*/

var mat4 = {
    identity: __webpack_require__(/*! gl-mat4/identity */ "./node_modules/gl-mat4/identity.js"),
    translate: __webpack_require__(/*! gl-mat4/translate */ "./node_modules/gl-mat4/translate.js"),
    multiply: __webpack_require__(/*! gl-mat4/multiply */ "./node_modules/gl-mat4/multiply.js"),
    create: __webpack_require__(/*! gl-mat4/create */ "./node_modules/gl-mat4/create.js"),
    scale: __webpack_require__(/*! gl-mat4/scale */ "./node_modules/gl-mat4/scale.js"),
    fromRotationTranslation: __webpack_require__(/*! gl-mat4/fromRotationTranslation */ "./node_modules/gl-mat4/fromRotationTranslation.js")
}

var rotationMatrix = mat4.create()
var temp = mat4.create()

module.exports = function recomposeMat4(matrix, translation, scale, skew, perspective, quaternion) {
    mat4.identity(matrix)

    //apply translation & rotation
    mat4.fromRotationTranslation(matrix, quaternion, translation)

    //apply perspective
    matrix[3] = perspective[0]
    matrix[7] = perspective[1]
    matrix[11] = perspective[2]
    matrix[15] = perspective[3]
        
    // apply skew
    // temp is a identity 4x4 matrix initially
    mat4.identity(temp)

    if (skew[2] !== 0) {
        temp[9] = skew[2]
        mat4.multiply(matrix, matrix, temp)
    }

    if (skew[1] !== 0) {
        temp[9] = 0
        temp[8] = skew[1]
        mat4.multiply(matrix, matrix, temp)
    }

    if (skew[0] !== 0) {
        temp[8] = 0
        temp[4] = skew[0]
        mat4.multiply(matrix, matrix, temp)
    }

    //apply scale
    mat4.scale(matrix, matrix, scale)
    return matrix
}

/***/ }),

/***/ "./node_modules/matrix-camera-controller/matrix.js":
/*!*********************************************************!*\
  !*** ./node_modules/matrix-camera-controller/matrix.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var bsearch   = __webpack_require__(/*! binary-search-bounds */ "./node_modules/binary-search-bounds/search-bounds.js")
var m4interp  = __webpack_require__(/*! mat4-interpolate */ "./node_modules/mat4-interpolate/index.js")
var invert44  = __webpack_require__(/*! gl-mat4/invert */ "./node_modules/gl-mat4/invert.js")
var rotateX   = __webpack_require__(/*! gl-mat4/rotateX */ "./node_modules/gl-mat4/rotateX.js")
var rotateY   = __webpack_require__(/*! gl-mat4/rotateY */ "./node_modules/gl-mat4/rotateY.js")
var rotateZ   = __webpack_require__(/*! gl-mat4/rotateZ */ "./node_modules/gl-mat4/rotateZ.js")
var lookAt    = __webpack_require__(/*! gl-mat4/lookAt */ "./node_modules/gl-mat4/lookAt.js")
var translate = __webpack_require__(/*! gl-mat4/translate */ "./node_modules/gl-mat4/translate.js")
var scale     = __webpack_require__(/*! gl-mat4/scale */ "./node_modules/gl-mat4/scale.js")
var normalize = __webpack_require__(/*! gl-vec3/normalize */ "./node_modules/gl-vec3/normalize.js")

var DEFAULT_CENTER = [0,0,0]

module.exports = createMatrixCameraController

function MatrixCameraController(initialMatrix) {
  this._components    = initialMatrix.slice()
  this._time          = [0]
  this.prevMatrix     = initialMatrix.slice()
  this.nextMatrix     = initialMatrix.slice()
  this.computedMatrix = initialMatrix.slice()
  this.computedInverse = initialMatrix.slice()
  this.computedEye    = [0,0,0]
  this.computedUp     = [0,0,0]
  this.computedCenter = [0,0,0]
  this.computedRadius = [0]
  this._limits        = [-Infinity, Infinity]
}

var proto = MatrixCameraController.prototype

proto.recalcMatrix = function(t) {
  var time = this._time
  var tidx = bsearch.le(time, t)
  var mat = this.computedMatrix
  if(tidx < 0) {
    return
  }
  var comps = this._components
  if(tidx === time.length-1) {
    var ptr = 16*tidx
    for(var i=0; i<16; ++i) {
      mat[i] = comps[ptr++]
    }
  } else {
    var dt = (time[tidx+1] - time[tidx])
    var ptr = 16*tidx
    var prev = this.prevMatrix
    var allEqual = true
    for(var i=0; i<16; ++i) {
      prev[i] = comps[ptr++]
    }
    var next = this.nextMatrix
    for(var i=0; i<16; ++i) {
      next[i] = comps[ptr++]
      allEqual = allEqual && (prev[i] === next[i])
    }
    if(dt < 1e-6 || allEqual) {
      for(var i=0; i<16; ++i) {
        mat[i] = prev[i]
      }
    } else {
      m4interp(mat, prev, next, (t - time[tidx])/dt)
    }
  }

  var up = this.computedUp
  up[0] = mat[1]
  up[1] = mat[5]
  up[2] = mat[9]
  normalize(up, up)

  var imat = this.computedInverse
  invert44(imat, mat)
  var eye = this.computedEye
  var w = imat[15]
  eye[0] = imat[12]/w
  eye[1] = imat[13]/w
  eye[2] = imat[14]/w

  var center = this.computedCenter
  var radius = Math.exp(this.computedRadius[0])
  for(var i=0; i<3; ++i) {
    center[i] = eye[i] - mat[2+4*i] * radius
  }
}

proto.idle = function(t) {
  if(t < this.lastT()) {
    return
  }
  var mc = this._components
  var ptr = mc.length-16
  for(var i=0; i<16; ++i) {
    mc.push(mc[ptr++])
  }
  this._time.push(t)
}

proto.flush = function(t) {
  var idx = bsearch.gt(this._time, t) - 2
  if(idx < 0) {
    return
  }
  this._time.splice(0, idx)
  this._components.splice(0, 16*idx)
}

proto.lastT = function() {
  return this._time[this._time.length-1]
}

proto.lookAt = function(t, eye, center, up) {
  this.recalcMatrix(t)
  eye    = eye || this.computedEye
  center = center || DEFAULT_CENTER
  up     = up || this.computedUp
  this.setMatrix(t, lookAt(this.computedMatrix, eye, center, up))
  var d2 = 0.0
  for(var i=0; i<3; ++i) {
    d2 += Math.pow(center[i] - eye[i], 2)
  }
  d2 = Math.log(Math.sqrt(d2))
  this.computedRadius[0] = d2
}

proto.rotate = function(t, yaw, pitch, roll) {
  this.recalcMatrix(t)
  var mat = this.computedInverse
  if(yaw)   rotateY(mat, mat, yaw)
  if(pitch) rotateX(mat, mat, pitch)
  if(roll)  rotateZ(mat, mat, roll)
  this.setMatrix(t, invert44(this.computedMatrix, mat))
}

var tvec = [0,0,0]

proto.pan = function(t, dx, dy, dz) {
  tvec[0] = -(dx || 0.0)
  tvec[1] = -(dy || 0.0)
  tvec[2] = -(dz || 0.0)
  this.recalcMatrix(t)
  var mat = this.computedInverse
  translate(mat, mat, tvec)
  this.setMatrix(t, invert44(mat, mat))
}

proto.translate = function(t, dx, dy, dz) {
  tvec[0] = dx || 0.0
  tvec[1] = dy || 0.0
  tvec[2] = dz || 0.0
  this.recalcMatrix(t)
  var mat = this.computedMatrix
  translate(mat, mat, tvec)
  this.setMatrix(t, mat)
}

proto.setMatrix = function(t, mat) {
  if(t < this.lastT()) {
    return
  }
  this._time.push(t)
  for(var i=0; i<16; ++i) {
    this._components.push(mat[i])
  }
}

proto.setDistance = function(t, d) {
  this.computedRadius[0] = d
}

proto.setDistanceLimits = function(a,b) {
  var lim = this._limits
  lim[0] = a
  lim[1] = b
}

proto.getDistanceLimits = function(out) {
  var lim = this._limits
  if(out) {
    out[0] = lim[0]
    out[1] = lim[1]
    return out
  }
  return lim
}

function createMatrixCameraController(options) {
  options = options || {}
  var matrix = options.matrix || 
              [1,0,0,0,
               0,1,0,0,
               0,0,1,0,
               0,0,0,1]
  return new MatrixCameraController(matrix)
}


/***/ }),

/***/ "./node_modules/mouse-change/mouse-listen.js":
/*!***************************************************!*\
  !*** ./node_modules/mouse-change/mouse-listen.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = mouseListen

var mouse = __webpack_require__(/*! mouse-event */ "./node_modules/mouse-event/mouse.js")

function mouseListen (element, callback) {
  if (!callback) {
    callback = element
    element = window
  }

  var buttonState = 0
  var x = 0
  var y = 0
  var mods = {
    shift: false,
    alt: false,
    control: false,
    meta: false
  }
  var attached = false

  function updateMods (ev) {
    var changed = false
    if ('altKey' in ev) {
      changed = changed || ev.altKey !== mods.alt
      mods.alt = !!ev.altKey
    }
    if ('shiftKey' in ev) {
      changed = changed || ev.shiftKey !== mods.shift
      mods.shift = !!ev.shiftKey
    }
    if ('ctrlKey' in ev) {
      changed = changed || ev.ctrlKey !== mods.control
      mods.control = !!ev.ctrlKey
    }
    if ('metaKey' in ev) {
      changed = changed || ev.metaKey !== mods.meta
      mods.meta = !!ev.metaKey
    }
    return changed
  }

  function handleEvent (nextButtons, ev) {
    var nextX = mouse.x(ev)
    var nextY = mouse.y(ev)
    if ('buttons' in ev) {
      nextButtons = ev.buttons | 0
    }
    if (nextButtons !== buttonState ||
      nextX !== x ||
      nextY !== y ||
      updateMods(ev)) {
      buttonState = nextButtons | 0
      x = nextX || 0
      y = nextY || 0
      callback && callback(buttonState, x, y, mods)
    }
  }

  function clearState (ev) {
    handleEvent(0, ev)
  }

  function handleBlur () {
    if (buttonState ||
      x ||
      y ||
      mods.shift ||
      mods.alt ||
      mods.meta ||
      mods.control) {
      x = y = 0
      buttonState = 0
      mods.shift = mods.alt = mods.control = mods.meta = false
      callback && callback(0, 0, 0, mods)
    }
  }

  function handleMods (ev) {
    if (updateMods(ev)) {
      callback && callback(buttonState, x, y, mods)
    }
  }

  function handleMouseMove (ev) {
    if (mouse.buttons(ev) === 0) {
      handleEvent(0, ev)
    } else {
      handleEvent(buttonState, ev)
    }
  }

  function handleMouseDown (ev) {
    handleEvent(buttonState | mouse.buttons(ev), ev)
  }

  function handleMouseUp (ev) {
    handleEvent(buttonState & ~mouse.buttons(ev), ev)
  }

  function attachListeners () {
    if (attached) {
      return
    }
    attached = true

    element.addEventListener('mousemove', handleMouseMove)

    element.addEventListener('mousedown', handleMouseDown)

    element.addEventListener('mouseup', handleMouseUp)

    element.addEventListener('mouseleave', clearState)
    element.addEventListener('mouseenter', clearState)
    element.addEventListener('mouseout', clearState)
    element.addEventListener('mouseover', clearState)

    element.addEventListener('blur', handleBlur)

    element.addEventListener('keyup', handleMods)
    element.addEventListener('keydown', handleMods)
    element.addEventListener('keypress', handleMods)

    if (element !== window) {
      window.addEventListener('blur', handleBlur)

      window.addEventListener('keyup', handleMods)
      window.addEventListener('keydown', handleMods)
      window.addEventListener('keypress', handleMods)
    }
  }

  function detachListeners () {
    if (!attached) {
      return
    }
    attached = false

    element.removeEventListener('mousemove', handleMouseMove)

    element.removeEventListener('mousedown', handleMouseDown)

    element.removeEventListener('mouseup', handleMouseUp)

    element.removeEventListener('mouseleave', clearState)
    element.removeEventListener('mouseenter', clearState)
    element.removeEventListener('mouseout', clearState)
    element.removeEventListener('mouseover', clearState)

    element.removeEventListener('blur', handleBlur)

    element.removeEventListener('keyup', handleMods)
    element.removeEventListener('keydown', handleMods)
    element.removeEventListener('keypress', handleMods)

    if (element !== window) {
      window.removeEventListener('blur', handleBlur)

      window.removeEventListener('keyup', handleMods)
      window.removeEventListener('keydown', handleMods)
      window.removeEventListener('keypress', handleMods)
    }
  }

  // Attach listeners
  attachListeners()

  var result = {
    element: element
  }

  Object.defineProperties(result, {
    enabled: {
      get: function () { return attached },
      set: function (f) {
        if (f) {
          attachListeners()
        } else {
          detachListeners()
        }
      },
      enumerable: true
    },
    buttons: {
      get: function () { return buttonState },
      enumerable: true
    },
    x: {
      get: function () { return x },
      enumerable: true
    },
    y: {
      get: function () { return y },
      enumerable: true
    },
    mods: {
      get: function () { return mods },
      enumerable: true
    }
  })

  return result
}


/***/ }),

/***/ "./node_modules/mouse-event-offset/index.js":
/*!**************************************************!*\
  !*** ./node_modules/mouse-event-offset/index.js ***!
  \**************************************************/
/***/ ((module) => {

var rootPosition = { left: 0, top: 0 }

module.exports = mouseEventOffset
function mouseEventOffset (ev, target, out) {
  target = target || ev.currentTarget || ev.srcElement
  if (!Array.isArray(out)) {
    out = [ 0, 0 ]
  }
  var cx = ev.clientX || 0
  var cy = ev.clientY || 0
  var rect = getBoundingClientOffset(target)
  out[0] = cx - rect.left
  out[1] = cy - rect.top
  return out
}

function getBoundingClientOffset (element) {
  if (element === window ||
      element === document ||
      element === document.body) {
    return rootPosition
  } else {
    return element.getBoundingClientRect()
  }
}


/***/ }),

/***/ "./node_modules/mouse-event/mouse.js":
/*!*******************************************!*\
  !*** ./node_modules/mouse-event/mouse.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";


function mouseButtons(ev) {
  if(typeof ev === 'object') {
    if('buttons' in ev) {
      return ev.buttons
    } else if('which' in ev) {
      var b = ev.which
      if(b === 2) {
        return 4
      } else if(b === 3) {
        return 2
      } else if(b > 0) {
        return 1<<(b-1)
      }
    } else if('button' in ev) {
      var b = ev.button
      if(b === 1) {
        return 4
      } else if(b === 2) {
        return 2
      } else if(b >= 0) {
        return 1<<b
      }
    }
  }
  return 0
}
exports.buttons = mouseButtons

function mouseElement(ev) {
  return ev.target || ev.srcElement || window
}
exports.element = mouseElement

function mouseRelativeX(ev) {
  if(typeof ev === 'object') {
    if('offsetX' in ev) {
      return ev.offsetX
    }
    var target = mouseElement(ev)
    var bounds = target.getBoundingClientRect()
    return ev.clientX - bounds.left
  }
  return 0
}
exports.x = mouseRelativeX

function mouseRelativeY(ev) {
  if(typeof ev === 'object') {
    if('offsetY' in ev) {
      return ev.offsetY
    }
    var target = mouseElement(ev)
    var bounds = target.getBoundingClientRect()
    return ev.clientY - bounds.top
  }
  return 0
}
exports.y = mouseRelativeY


/***/ }),

/***/ "./node_modules/mouse-wheel/wheel.js":
/*!*******************************************!*\
  !*** ./node_modules/mouse-wheel/wheel.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var toPX = __webpack_require__(/*! to-px */ "./node_modules/to-px/browser.js")

module.exports = mouseWheelListen

function mouseWheelListen(element, callback, noScroll) {
  if(typeof element === 'function') {
    noScroll = !!callback
    callback = element
    element = window
  }
  var lineHeight = toPX('ex', element)
  var listener = function(ev) {
    if(noScroll) {
      ev.preventDefault()
    }
    var dx = ev.deltaX || 0
    var dy = ev.deltaY || 0
    var dz = ev.deltaZ || 0
    var mode = ev.deltaMode
    var scale = 1
    switch(mode) {
      case 1:
        scale = lineHeight
      break
      case 2:
        scale = window.innerHeight
      break
    }
    dx *= scale
    dy *= scale
    dz *= scale
    if(dx || dy || dz) {
      return callback(dx, dy, dz, ev)
    }
  }
  element.addEventListener('wheel', listener)
  return listener
}


/***/ }),

/***/ "./node_modules/orbit-camera-controller/lib/quatFromFrame.js":
/*!*******************************************************************!*\
  !*** ./node_modules/orbit-camera-controller/lib/quatFromFrame.js ***!
  \*******************************************************************/
/***/ ((module) => {

"use strict";


module.exports = quatFromFrame

function quatFromFrame(
  out,
  rx, ry, rz,
  ux, uy, uz,
  fx, fy, fz) {
  var tr = rx + uy + fz
  if(l > 0) {
    var l = Math.sqrt(tr + 1.0)
    out[0] = 0.5 * (uz - fy) / l
    out[1] = 0.5 * (fx - rz) / l
    out[2] = 0.5 * (ry - uy) / l
    out[3] = 0.5 * l
  } else {
    var tf = Math.max(rx, uy, fz)
    var l = Math.sqrt(2 * tf - tr + 1.0)
    if(rx >= tf) {
      //x y z  order
      out[0] = 0.5 * l
      out[1] = 0.5 * (ux + ry) / l
      out[2] = 0.5 * (fx + rz) / l
      out[3] = 0.5 * (uz - fy) / l
    } else if(uy >= tf) {
      //y z x  order
      out[0] = 0.5 * (ry + ux) / l
      out[1] = 0.5 * l
      out[2] = 0.5 * (fy + uz) / l
      out[3] = 0.5 * (fx - rz) / l
    } else {
      //z x y  order
      out[0] = 0.5 * (rz + fx) / l
      out[1] = 0.5 * (uz + fy) / l
      out[2] = 0.5 * l
      out[3] = 0.5 * (ry - ux) / l
    }
  }
  return out
}

/***/ }),

/***/ "./node_modules/orbit-camera-controller/orbit.js":
/*!*******************************************************!*\
  !*** ./node_modules/orbit-camera-controller/orbit.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = createOrbitController

var filterVector  = __webpack_require__(/*! filtered-vector */ "./node_modules/filtered-vector/fvec.js")
var lookAt        = __webpack_require__(/*! gl-mat4/lookAt */ "./node_modules/gl-mat4/lookAt.js")
var mat4FromQuat  = __webpack_require__(/*! gl-mat4/fromQuat */ "./node_modules/gl-mat4/fromQuat.js")
var invert44      = __webpack_require__(/*! gl-mat4/invert */ "./node_modules/gl-mat4/invert.js")
var quatFromFrame = __webpack_require__(/*! ./lib/quatFromFrame */ "./node_modules/orbit-camera-controller/lib/quatFromFrame.js")

function len3(x,y,z) {
  return Math.sqrt(Math.pow(x,2) + Math.pow(y,2) + Math.pow(z,2))
}

function len4(w,x,y,z) {
  return Math.sqrt(Math.pow(w,2) + Math.pow(x,2) + Math.pow(y,2) + Math.pow(z,2))
}

function normalize4(out, a) {
  var ax = a[0]
  var ay = a[1]
  var az = a[2]
  var aw = a[3]
  var al = len4(ax, ay, az, aw)
  if(al > 1e-6) {
    out[0] = ax/al
    out[1] = ay/al
    out[2] = az/al
    out[3] = aw/al
  } else {
    out[0] = out[1] = out[2] = 0.0
    out[3] = 1.0
  }
}

function OrbitCameraController(initQuat, initCenter, initRadius) {
  this.radius    = filterVector([initRadius])
  this.center    = filterVector(initCenter)
  this.rotation  = filterVector(initQuat)

  this.computedRadius   = this.radius.curve(0)
  this.computedCenter   = this.center.curve(0)
  this.computedRotation = this.rotation.curve(0)
  this.computedUp       = [0.1,0,0]
  this.computedEye      = [0.1,0,0]
  this.computedMatrix   = [0.1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]

  this.recalcMatrix(0)
}

var proto = OrbitCameraController.prototype

proto.lastT = function() {
  return Math.max(
    this.radius.lastT(),
    this.center.lastT(),
    this.rotation.lastT())
}

proto.recalcMatrix = function(t) {
  this.radius.curve(t)
  this.center.curve(t)
  this.rotation.curve(t)

  var quat = this.computedRotation
  normalize4(quat, quat)

  var mat = this.computedMatrix
  mat4FromQuat(mat, quat)

  var center = this.computedCenter
  var eye    = this.computedEye
  var up     = this.computedUp
  var radius = Math.exp(this.computedRadius[0])

  eye[0] = center[0] + radius * mat[2]
  eye[1] = center[1] + radius * mat[6]
  eye[2] = center[2] + radius * mat[10]
  up[0] = mat[1]
  up[1] = mat[5]
  up[2] = mat[9]

  for(var i=0; i<3; ++i) {
    var rr = 0.0
    for(var j=0; j<3; ++j) {
      rr += mat[i+4*j] * eye[j]
    }
    mat[12+i] = -rr
  }
}

proto.getMatrix = function(t, result) {
  this.recalcMatrix(t)
  var m = this.computedMatrix
  if(result) {
    for(var i=0; i<16; ++i) {
      result[i] = m[i]
    }
    return result
  }
  return m
}

proto.idle = function(t) {
  this.center.idle(t)
  this.radius.idle(t)
  this.rotation.idle(t)
}

proto.flush = function(t) {
  this.center.flush(t)
  this.radius.flush(t)
  this.rotation.flush(t)
}

proto.pan = function(t, dx, dy, dz) {
  dx = dx || 0.0
  dy = dy || 0.0
  dz = dz || 0.0

  this.recalcMatrix(t)
  var mat = this.computedMatrix

  var ux = mat[1]
  var uy = mat[5]
  var uz = mat[9]
  var ul = len3(ux, uy, uz)
  ux /= ul
  uy /= ul
  uz /= ul

  var rx = mat[0]
  var ry = mat[4]
  var rz = mat[8]
  var ru = rx * ux + ry * uy + rz * uz
  rx -= ux * ru
  ry -= uy * ru
  rz -= uz * ru
  var rl = len3(rx, ry, rz)
  rx /= rl
  ry /= rl
  rz /= rl

  var fx = mat[2]
  var fy = mat[6]
  var fz = mat[10]
  var fu = fx * ux + fy * uy + fz * uz
  var fr = fx * rx + fy * ry + fz * rz
  fx -= fu * ux + fr * rx
  fy -= fu * uy + fr * ry
  fz -= fu * uz + fr * rz
  var fl = len3(fx, fy, fz)
  fx /= fl
  fy /= fl
  fz /= fl

  var vx = rx * dx + ux * dy
  var vy = ry * dx + uy * dy
  var vz = rz * dx + uz * dy

  this.center.move(t, vx, vy, vz)

  //Update z-component of radius
  var radius = Math.exp(this.computedRadius[0])
  radius = Math.max(1e-4, radius + dz)
  this.radius.set(t, Math.log(radius))
}

proto.rotate = function(t, dx, dy, dz) {
  this.recalcMatrix(t)

  dx = dx||0.0
  dy = dy||0.0

  var mat = this.computedMatrix

  var rx = mat[0]
  var ry = mat[4]
  var rz = mat[8]

  var ux = mat[1]
  var uy = mat[5]
  var uz = mat[9]

  var fx = mat[2]
  var fy = mat[6]
  var fz = mat[10]

  var qx = dx * rx + dy * ux
  var qy = dx * ry + dy * uy
  var qz = dx * rz + dy * uz

  var bx = -(fy * qz - fz * qy)
  var by = -(fz * qx - fx * qz)
  var bz = -(fx * qy - fy * qx)  
  var bw = Math.sqrt(Math.max(0.0, 1.0 - Math.pow(bx,2) - Math.pow(by,2) - Math.pow(bz,2)))
  var bl = len4(bx, by, bz, bw)
  if(bl > 1e-6) {
    bx /= bl
    by /= bl
    bz /= bl
    bw /= bl
  } else {
    bx = by = bz = 0.0
    bw = 1.0
  }

  var rotation = this.computedRotation
  var ax = rotation[0]
  var ay = rotation[1]
  var az = rotation[2]
  var aw = rotation[3]

  var cx = ax*bw + aw*bx + ay*bz - az*by
  var cy = ay*bw + aw*by + az*bx - ax*bz
  var cz = az*bw + aw*bz + ax*by - ay*bx
  var cw = aw*bw - ax*bx - ay*by - az*bz
  
  //Apply roll
  if(dz) {
    bx = fx
    by = fy
    bz = fz
    var s = Math.sin(dz) / len3(bx, by, bz)
    bx *= s
    by *= s
    bz *= s
    bw = Math.cos(dx)
    cx = cx*bw + cw*bx + cy*bz - cz*by
    cy = cy*bw + cw*by + cz*bx - cx*bz
    cz = cz*bw + cw*bz + cx*by - cy*bx
    cw = cw*bw - cx*bx - cy*by - cz*bz
  }

  var cl = len4(cx, cy, cz, cw)
  if(cl > 1e-6) {
    cx /= cl
    cy /= cl
    cz /= cl
    cw /= cl
  } else {
    cx = cy = cz = 0.0
    cw = 1.0
  }

  this.rotation.set(t, cx, cy, cz, cw)
}

proto.lookAt = function(t, eye, center, up) {
  this.recalcMatrix(t)

  center = center || this.computedCenter
  eye    = eye    || this.computedEye
  up     = up     || this.computedUp

  var mat = this.computedMatrix
  lookAt(mat, eye, center, up)

  var rotation = this.computedRotation
  quatFromFrame(rotation,
    mat[0], mat[1], mat[2],
    mat[4], mat[5], mat[6],
    mat[8], mat[9], mat[10])
  normalize4(rotation, rotation)
  this.rotation.set(t, rotation[0], rotation[1], rotation[2], rotation[3])

  var fl = 0.0
  for(var i=0; i<3; ++i) {
    fl += Math.pow(center[i] - eye[i], 2)
  }
  this.radius.set(t, 0.5 * Math.log(Math.max(fl, 1e-6)))

  this.center.set(t, center[0], center[1], center[2])
}

proto.translate = function(t, dx, dy, dz) {
  this.center.move(t,
    dx||0.0,
    dy||0.0,
    dz||0.0)
}

proto.setMatrix = function(t, matrix) {

  var rotation = this.computedRotation
  quatFromFrame(rotation,
    matrix[0], matrix[1], matrix[2],
    matrix[4], matrix[5], matrix[6],
    matrix[8], matrix[9], matrix[10])
  normalize4(rotation, rotation)
  this.rotation.set(t, rotation[0], rotation[1], rotation[2], rotation[3])

  var mat = this.computedMatrix
  invert44(mat, matrix)
  var w = mat[15]
  if(Math.abs(w) > 1e-6) {
    var cx = mat[12]/w
    var cy = mat[13]/w
    var cz = mat[14]/w

    this.recalcMatrix(t)  
    var r = Math.exp(this.computedRadius[0])
    this.center.set(t, cx-mat[2]*r, cy-mat[6]*r, cz-mat[10]*r)
    this.radius.idle(t)
  } else {
    this.center.idle(t)
    this.radius.idle(t)
  }
}

proto.setDistance = function(t, d) {
  if(d > 0) {
    this.radius.set(t, Math.log(d))
  }
}

proto.setDistanceLimits = function(lo, hi) {
  if(lo > 0) {
    lo = Math.log(lo)
  } else {
    lo = -Infinity    
  }
  if(hi > 0) {
    hi = Math.log(hi)
  } else {
    hi = Infinity
  }
  hi = Math.max(hi, lo)
  this.radius.bounds[0][0] = lo
  this.radius.bounds[1][0] = hi
}

proto.getDistanceLimits = function(out) {
  var bounds = this.radius.bounds
  if(out) {
    out[0] = Math.exp(bounds[0][0])
    out[1] = Math.exp(bounds[1][0])
    return out
  }
  return [ Math.exp(bounds[0][0]), Math.exp(bounds[1][0]) ]
}

proto.toJSON = function() {
  this.recalcMatrix(this.lastT())
  return {
    center:   this.computedCenter.slice(),
    rotation: this.computedRotation.slice(),
    distance: Math.log(this.computedRadius[0]),
    zoomMin:  this.radius.bounds[0][0],
    zoomMax:  this.radius.bounds[1][0]
  }
}

proto.fromJSON = function(options) {
  var t = this.lastT()
  var c = options.center
  if(c) {
    this.center.set(t, c[0], c[1], c[2])
  }
  var r = options.rotation
  if(r) {
    this.rotation.set(t, r[0], r[1], r[2], r[3])
  }
  var d = options.distance
  if(d && d > 0) {
    this.radius.set(t, Math.log(d))
  }
  this.setDistanceLimits(options.zoomMin, options.zoomMax)
}

function createOrbitController(options) {
  options = options || {}
  var center   = options.center   || [0,0,0]
  var rotation = options.rotation || [0,0,0,1]
  var radius   = options.radius   || 1.0

  center = [].slice.call(center, 0, 3)
  rotation = [].slice.call(rotation, 0, 4)
  normalize4(rotation, rotation)

  var result = new OrbitCameraController(
    rotation,
    center,
    Math.log(radius))

  result.setDistanceLimits(options.zoomMin, options.zoomMax)

  if('eye' in options || 'up' in options) {
    result.lookAt(0, options.eye, options.center, options.up)
  }

  return result
}

/***/ }),

/***/ "./node_modules/parse-unit/index.js":
/*!******************************************!*\
  !*** ./node_modules/parse-unit/index.js ***!
  \******************************************/
/***/ ((module) => {

module.exports = function parseUnit(str, out) {
    if (!out)
        out = [ 0, '' ]

    str = String(str)
    var num = parseFloat(str, 10)
    out[0] = num
    out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || ''
    return out
}

/***/ }),

/***/ "./node_modules/quat-slerp/index.js":
/*!******************************************!*\
  !*** ./node_modules/quat-slerp/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! gl-quat/slerp */ "./node_modules/gl-quat/slerp.js")

/***/ }),

/***/ "./node_modules/right-now/browser.js":
/*!*******************************************!*\
  !*** ./node_modules/right-now/browser.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports =
  __webpack_require__.g.performance &&
  __webpack_require__.g.performance.now ? function now() {
    return performance.now()
  } : Date.now || function now() {
    return +new Date
  }


/***/ }),

/***/ "./node_modules/stats-js/build/stats.min.js":
/*!**************************************************!*\
  !*** ./node_modules/stats-js/build/stats.min.js ***!
  \**************************************************/
/***/ (function(module) {

!function(e,t){ true?module.exports=t():0}(this,function(){"use strict";var c=function(){var n=0,l=document.createElement("div");function e(e){return l.appendChild(e.dom),e}function t(e){for(var t=0;t<l.children.length;t++)l.children[t].style.display=t===e?"block":"none";n=e}l.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000",l.addEventListener("click",function(e){e.preventDefault(),t(++n%l.children.length)},!1);var i=(performance||Date).now(),a=i,o=0,f=e(new c.Panel("FPS","#0ff","#002")),r=e(new c.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var d=e(new c.Panel("MB","#f08","#201"));return t(0),{REVISION:16,dom:l,addPanel:e,showPanel:t,begin:function(){i=(performance||Date).now()},end:function(){o++;var e=(performance||Date).now();if(r.update(e-i,200),a+1e3<=e&&(f.update(1e3*o/(e-a),100),a=e,o=0,d)){var t=performance.memory;d.update(t.usedJSHeapSize/1048576,t.jsHeapSizeLimit/1048576)}return e},update:function(){i=this.end()},domElement:l,setMode:t}};return c.Panel=function(n,l,i){var a=1/0,o=0,f=Math.round,r=f(window.devicePixelRatio||1),d=80*r,e=48*r,c=3*r,p=2*r,u=3*r,s=15*r,m=74*r,h=30*r,y=document.createElement("canvas");y.width=d,y.height=e,y.style.cssText="width:80px;height:48px";var v=y.getContext("2d");return v.font="bold "+9*r+"px Helvetica,Arial,sans-serif",v.textBaseline="top",v.fillStyle=i,v.fillRect(0,0,d,e),v.fillStyle=l,v.fillText(n,c,p),v.fillRect(u,s,m,h),v.fillStyle=i,v.globalAlpha=.9,v.fillRect(u,s,m,h),{dom:y,update:function(e,t){a=Math.min(a,e),o=Math.max(o,e),v.fillStyle=i,v.globalAlpha=1,v.fillRect(0,0,d,s),v.fillStyle=l,v.fillText(f(e)+" "+n+" ("+f(a)+"-"+f(o)+")",c,p),v.drawImage(y,u+r,s,m-r,h,u,s,m-r,h),v.fillRect(u+m-r,s,r,h),v.fillStyle=i,v.globalAlpha=.9,v.fillRect(u+m-r,s,r,f((1-e/t)*h))}}},c});


/***/ }),

/***/ "./node_modules/to-px/browser.js":
/*!***************************************!*\
  !*** ./node_modules/to-px/browser.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var parseUnit = __webpack_require__(/*! parse-unit */ "./node_modules/parse-unit/index.js")

module.exports = toPX

var PIXELS_PER_INCH = getSizeBrutal('in', document.body) // 96


function getPropertyInPX(element, prop) {
  var parts = parseUnit(getComputedStyle(element).getPropertyValue(prop))
  return parts[0] * toPX(parts[1], element)
}

//This brutal hack is needed
function getSizeBrutal(unit, element) {
  var testDIV = document.createElement('div')
  testDIV.style['height'] = '128' + unit
  element.appendChild(testDIV)
  var size = getPropertyInPX(testDIV, 'height') / 128
  element.removeChild(testDIV)
  return size
}

function toPX(str, element) {
  if (!str) return null

  element = element || document.body
  str = (str + '' || 'px').trim().toLowerCase()
  if(element === window || element === document) {
    element = document.body
  }

  switch(str) {
    case '%':  //Ambiguous, not sure if we should use width or height
      return element.clientHeight / 100.0
    case 'ch':
    case 'ex':
      return getSizeBrutal(str, element)
    case 'em':
      return getPropertyInPX(element, 'font-size')
    case 'rem':
      return getPropertyInPX(document.body, 'font-size')
    case 'vw':
      return window.innerWidth/100
    case 'vh':
      return window.innerHeight/100
    case 'vmin':
      return Math.min(window.innerWidth, window.innerHeight) / 100
    case 'vmax':
      return Math.max(window.innerWidth, window.innerHeight) / 100
    case 'in':
      return PIXELS_PER_INCH
    case 'cm':
      return PIXELS_PER_INCH / 2.54
    case 'mm':
      return PIXELS_PER_INCH / 25.4
    case 'pt':
      return PIXELS_PER_INCH / 72
    case 'pc':
      return PIXELS_PER_INCH / 6
    case 'px':
      return 1
  }

  // detect number of units
  var parts = parseUnit(str)
  if (!isNaN(parts[0]) && parts[1]) {
    var px = toPX(parts[1], element)
    return typeof px === 'number' ? parts[0] * px : null
  }

  return null
}


/***/ }),

/***/ "./src/Camera.ts":
/*!***********************!*\
  !*** ./src/Camera.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
var CameraControls = __webpack_require__(/*! 3d-view-controls */ "./node_modules/3d-view-controls/camera.js");

class Camera {
    constructor(position, target) {
        this.projectionMatrix = gl_matrix__WEBPACK_IMPORTED_MODULE_0__.create();
        this.viewMatrix = gl_matrix__WEBPACK_IMPORTED_MODULE_0__.create();
        this.fovy = 45;
        this.aspectRatio = 1;
        this.near = 0.1;
        this.far = 1000;
        this.position = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
        this.direction = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
        this.target = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
        this.up = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
        this.controls = CameraControls(document.getElementById('canvas'), {
            eye: position,
            center: target,
        });
        gl_matrix__WEBPACK_IMPORTED_MODULE_1__.add(this.target, this.position, this.direction);
        gl_matrix__WEBPACK_IMPORTED_MODULE_0__.lookAt(this.viewMatrix, this.controls.eye, this.controls.center, this.controls.up);
    }
    setAspectRatio(aspectRatio) {
        this.aspectRatio = aspectRatio;
    }
    getEye() {
        return this.controls.eye;
    }
    updateProjectionMatrix() {
        gl_matrix__WEBPACK_IMPORTED_MODULE_0__.perspective(this.projectionMatrix, this.fovy, this.aspectRatio, this.near, this.far);
    }
    update() {
        this.controls.tick();
        gl_matrix__WEBPACK_IMPORTED_MODULE_1__.add(this.target, this.position, this.direction);
        gl_matrix__WEBPACK_IMPORTED_MODULE_0__.lookAt(this.viewMatrix, this.controls.eye, this.controls.center, this.controls.up);
    }
}
;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Camera);


/***/ }),

/***/ "./src/geometry/Mesh.ts":
/*!******************************!*\
  !*** ./src/geometry/Mesh.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec4.js");
/* harmony import */ var _rendering_gl_Drawable__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../rendering/gl/Drawable */ "./src/rendering/gl/Drawable.ts");
/* harmony import */ var _globals__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../globals */ "./src/globals.ts");
/* harmony import */ var webgl_obj_loader__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! webgl-obj-loader */ "./node_modules/webgl-obj-loader/dist/webgl-obj-loader.min.js");
/* harmony import */ var webgl_obj_loader__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(webgl_obj_loader__WEBPACK_IMPORTED_MODULE_2__);




class Mesh extends _rendering_gl_Drawable__WEBPACK_IMPORTED_MODULE_0__["default"] {
    constructor(objString, center) {
        super(); // Call the constructor of the super class. This is required.
        this.center = gl_matrix__WEBPACK_IMPORTED_MODULE_3__.fromValues(center[0], center[1], center[2], 1);
        this.objString = objString;
    }
    create() {
        let posTemp = [];
        let norTemp = [];
        let uvsTemp = [];
        let idxTemp = [];
        var loadedMesh = new webgl_obj_loader__WEBPACK_IMPORTED_MODULE_2__.Mesh(this.objString);
        for (var i = 0; i < loadedMesh.vertices.length; i++) {
            posTemp.push(loadedMesh.vertices[i]);
            if (i % 3 == 2)
                posTemp.push(1.0);
        }
        for (var i = 0; i < loadedMesh.vertexNormals.length; i++) {
            norTemp.push(loadedMesh.vertexNormals[i]);
            if (i % 3 == 2)
                norTemp.push(0.0);
        }
        uvsTemp = loadedMesh.textures;
        idxTemp = loadedMesh.indices;
        this.indices = new Uint32Array(idxTemp);
        this.normals = new Float32Array(norTemp);
        this.positions = new Float32Array(posTemp);
        this.uvs = new Float32Array(uvsTemp);
        this.generateIdx();
        this.generatePos();
        this.generateNor();
        this.count = this.indices.length;
        _globals__WEBPACK_IMPORTED_MODULE_1__.gl.bindBuffer(_globals__WEBPACK_IMPORTED_MODULE_1__.gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        _globals__WEBPACK_IMPORTED_MODULE_1__.gl.bufferData(_globals__WEBPACK_IMPORTED_MODULE_1__.gl.ELEMENT_ARRAY_BUFFER, this.indices, _globals__WEBPACK_IMPORTED_MODULE_1__.gl.STATIC_DRAW);
        _globals__WEBPACK_IMPORTED_MODULE_1__.gl.bindBuffer(_globals__WEBPACK_IMPORTED_MODULE_1__.gl.ARRAY_BUFFER, this.bufNor);
        _globals__WEBPACK_IMPORTED_MODULE_1__.gl.bufferData(_globals__WEBPACK_IMPORTED_MODULE_1__.gl.ARRAY_BUFFER, this.normals, _globals__WEBPACK_IMPORTED_MODULE_1__.gl.STATIC_DRAW);
        _globals__WEBPACK_IMPORTED_MODULE_1__.gl.bindBuffer(_globals__WEBPACK_IMPORTED_MODULE_1__.gl.ARRAY_BUFFER, this.bufPos);
        _globals__WEBPACK_IMPORTED_MODULE_1__.gl.bufferData(_globals__WEBPACK_IMPORTED_MODULE_1__.gl.ARRAY_BUFFER, this.positions, _globals__WEBPACK_IMPORTED_MODULE_1__.gl.STATIC_DRAW);
        console.log(`Created Mesh from OBJ`);
        this.objString = "";
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Mesh);


/***/ }),

/***/ "./src/globals.ts":
/*!************************!*\
  !*** ./src/globals.ts ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "PI": () => (/* binding */ PI),
/* harmony export */   "cube_str": () => (/* binding */ cube_str),
/* harmony export */   "gl": () => (/* binding */ gl),
/* harmony export */   "readTextFile": () => (/* binding */ readTextFile),
/* harmony export */   "setGL": () => (/* binding */ setGL),
/* harmony export */   "suzanne_str": () => (/* binding */ suzanne_str)
/* harmony export */ });
var PI = 3.1415926535;
var gl;
function setGL(_gl) {
    gl = _gl;
}
function readTextFile(file) {
    var text = "";
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status == 0) {
                var allText = rawFile.responseText;
                text = allText;
            }
        }
    };
    rawFile.send(null);
    //     var response = await fetch(file);
    //     var text = await response.text();
    return text;
}
var cube_str = "# cube.obj \n # \n   \n g cube \n   \n v  0.0  0.0  0.0 \n v  0.0  0.0  1.0 \n v  0.0  1.0  0.0 \n v  0.0  1.0  1.0 \n v  1.0  0.0  0.0 \n v  1.0  0.0  1.0 \n v  1.0  1.0  0.0 \n v  1.0  1.0  1.0 \n vn  0.0  0.0  1.0 \n vn  0.0  0.0 -1.0 \n vn  0.0  1.0  0.0 \n vn  0.0 -1.0  0.0 \n vn  1.0  0.0  0.0 \n vn -1.0  0.0  0.0 \n   \n f  1//2  7//2  5//2 \n f  1//2  3//2  7//2  \n f  1//6  4//6  3//6  \n f  1//6  2//6  4//6  \n f  3//3  8//3  7//3  \n f  3//3  4//3  8//3  \n f  5//5  7//5  8//5  \n f  5//5  8//5  6//5  \n f  1//4  5//4  6//4  \n f  1//4  6//4  2//4  \n f  2//1  6//1  8//1  \n f  2//1  8//1  4//1 ";
var suzanne_str = "# Blender v3.0.0 OBJ File: \n # www.blender.org \n mtllib suzanne.mtl \n o Suzanne \n v 0.437500 0.164062 0.765625 \n v -0.437500 0.164062 0.765625 \n v 0.500000 0.093750 0.687500 \n v -0.500000 0.093750 0.687500 \n v 0.546875 0.054688 0.578125 \n v -0.546875 0.054688 0.578125 \n v 0.351562 -0.023438 0.617188 \n v -0.351562 -0.023438 0.617188 \n v 0.351562 0.031250 0.718750 \n v -0.351562 0.031250 0.718750 \n v 0.351562 0.132812 0.781250 \n v -0.351562 0.132812 0.781250 \n v 0.273438 0.164062 0.796875 \n v -0.273438 0.164062 0.796875 \n v 0.203125 0.093750 0.742188 \n v -0.203125 0.093750 0.742188 \n v 0.156250 0.054688 0.648438 \n v -0.156250 0.054688 0.648438 \n v 0.078125 0.242188 0.656250 \n v -0.078125 0.242188 0.656250 \n v 0.140625 0.242188 0.742188 \n v -0.140625 0.242188 0.742188 \n v 0.242188 0.242188 0.796875 \n v -0.242188 0.242188 0.796875 \n v 0.273438 0.328125 0.796875 \n v -0.273438 0.328125 0.796875 \n v 0.203125 0.390625 0.742188 \n v -0.203125 0.390625 0.742188 \n v 0.156250 0.437500 0.648438 \n v -0.156250 0.437500 0.648438 \n v 0.351562 0.515625 0.617188 \n v -0.351562 0.515625 0.617188 \n v 0.351562 0.453125 0.718750 \n v -0.351562 0.453125 0.718750 \n v 0.351562 0.359375 0.781250 \n v -0.351562 0.359375 0.781250 \n v 0.437500 0.328125 0.765625 \n v -0.437500 0.328125 0.765625 \n v 0.500000 0.390625 0.687500 \n v -0.500000 0.390625 0.687500 \n v 0.546875 0.437500 0.578125 \n v -0.546875 0.437500 0.578125 \n v 0.625000 0.242188 0.562500 \n v -0.625000 0.242188 0.562500 \n v 0.562500 0.242188 0.671875 \n v -0.562500 0.242188 0.671875 \n v 0.468750 0.242188 0.757812 \n v -0.468750 0.242188 0.757812 \n v 0.476562 0.242188 0.773438 \n v -0.476562 0.242188 0.773438 \n v 0.445312 0.335938 0.781250 \n v -0.445312 0.335938 0.781250 \n v 0.351562 0.375000 0.804688 \n v -0.351562 0.375000 0.804688 \n v 0.265625 0.335938 0.820312 \n v -0.265625 0.335938 0.820312 \n v 0.226562 0.242188 0.820312 \n v -0.226562 0.242188 0.820312 \n v 0.265625 0.156250 0.820312 \n v -0.265625 0.156250 0.820312 \n v 0.351562 0.242188 0.828125 \n v -0.351562 0.242188 0.828125 \n v 0.351562 0.117188 0.804688 \n v -0.351562 0.117188 0.804688 \n v 0.445312 0.156250 0.781250 \n v -0.445312 0.156250 0.781250 \n v 0.000000 0.429688 0.742188 \n v 0.000000 0.351562 0.820312 \n v 0.000000 -0.679688 0.734375 \n v 0.000000 -0.320312 0.781250 \n v 0.000000 -0.187500 0.796875 \n v 0.000000 -0.773438 0.718750 \n v 0.000000 0.406250 0.601562 \n v 0.000000 0.570312 0.570312 \n v 0.000000 0.898438 -0.546875 \n v 0.000000 0.562500 -0.851562 \n v 0.000000 0.070312 -0.828125 \n v 0.000000 -0.382812 -0.351562 \n v 0.203125 -0.187500 0.562500 \n v -0.203125 -0.187500 0.562500 \n v 0.312500 -0.437500 0.570312 \n v -0.312500 -0.437500 0.570312 \n v 0.351562 -0.695312 0.570312 \n v -0.351562 -0.695312 0.570312 \n v 0.367188 -0.890625 0.531250 \n v -0.367188 -0.890625 0.531250 \n v 0.328125 -0.945312 0.523438 \n v -0.328125 -0.945312 0.523438 \n v 0.179688 -0.968750 0.554688 \n v -0.179688 -0.968750 0.554688 \n v 0.000000 -0.984375 0.578125 \n v 0.437500 -0.140625 0.531250 \n v -0.437500 -0.140625 0.531250 \n v 0.632812 -0.039062 0.539062 \n v -0.632812 -0.039062 0.539062 \n v 0.828125 0.148438 0.445312 \n v -0.828125 0.148438 0.445312 \n v 0.859375 0.429688 0.593750 \n v -0.859375 0.429688 0.593750 \n v 0.710938 0.484375 0.625000 \n v -0.710938 0.484375 0.625000 \n v 0.492188 0.601562 0.687500 \n v -0.492188 0.601562 0.687500 \n v 0.320312 0.757812 0.734375 \n v -0.320312 0.757812 0.734375 \n v 0.156250 0.718750 0.757812 \n v -0.156250 0.718750 0.757812 \n v 0.062500 0.492188 0.750000 \n v -0.062500 0.492188 0.750000 \n v 0.164062 0.414062 0.773438 \n v -0.164062 0.414062 0.773438 \n v 0.125000 0.304688 0.765625 \n v -0.125000 0.304688 0.765625 \n v 0.203125 0.093750 0.742188 \n v -0.203125 0.093750 0.742188 \n v 0.375000 0.015625 0.703125 \n v -0.375000 0.015625 0.703125 \n v 0.492188 0.062500 0.671875 \n v -0.492188 0.062500 0.671875 \n v 0.625000 0.187500 0.648438 \n v -0.625000 0.187500 0.648438 \n v 0.640625 0.296875 0.648438 \n v -0.640625 0.296875 0.648438 \n v 0.601562 0.375000 0.664062 \n v -0.601562 0.375000 0.664062 \n v 0.429688 0.437500 0.718750 \n v -0.429688 0.437500 0.718750 \n v 0.250000 0.468750 0.757812 \n v -0.250000 0.468750 0.757812 \n v 0.000000 -0.765625 0.734375 \n v 0.109375 -0.718750 0.734375 \n v -0.109375 -0.718750 0.734375 \n v 0.117188 -0.835938 0.710938 \n v -0.117188 -0.835938 0.710938 \n v 0.062500 -0.882812 0.695312 \n v -0.062500 -0.882812 0.695312 \n v 0.000000 -0.890625 0.687500 \n v 0.000000 -0.195312 0.750000 \n v 0.000000 -0.140625 0.742188 \n v 0.101562 -0.148438 0.742188 \n v -0.101562 -0.148438 0.742188 \n v 0.125000 -0.226562 0.750000 \n v -0.125000 -0.226562 0.750000 \n v 0.085938 -0.289062 0.742188 \n v -0.085938 -0.289062 0.742188 \n v 0.398438 -0.046875 0.671875 \n v -0.398438 -0.046875 0.671875 \n v 0.617188 0.054688 0.625000 \n v -0.617188 0.054688 0.625000 \n v 0.726562 0.203125 0.601562 \n v -0.726562 0.203125 0.601562 \n v 0.742188 0.375000 0.656250 \n v -0.742188 0.375000 0.656250 \n v 0.687500 0.414062 0.726562 \n v -0.687500 0.414062 0.726562 \n v 0.437500 0.546875 0.796875 \n v -0.437500 0.546875 0.796875 \n v 0.312500 0.640625 0.835938 \n v -0.312500 0.640625 0.835938 \n v 0.203125 0.617188 0.851562 \n v -0.203125 0.617188 0.851562 \n v 0.101562 0.429688 0.843750 \n v -0.101562 0.429688 0.843750 \n v 0.125000 -0.101562 0.812500 \n v -0.125000 -0.101562 0.812500 \n v 0.210938 -0.445312 0.710938 \n v -0.210938 -0.445312 0.710938 \n v 0.250000 -0.703125 0.687500 \n v -0.250000 -0.703125 0.687500 \n v 0.265625 -0.820312 0.664062 \n v -0.265625 -0.820312 0.664062 \n v 0.234375 -0.914062 0.632812 \n v -0.234375 -0.914062 0.632812 \n v 0.164062 -0.929688 0.632812 \n v -0.164062 -0.929688 0.632812 \n v 0.000000 -0.945312 0.640625 \n v 0.000000 0.046875 0.726562 \n v 0.000000 0.210938 0.765625 \n v 0.328125 0.476562 0.742188 \n v -0.328125 0.476562 0.742188 \n v 0.164062 0.140625 0.750000 \n v -0.164062 0.140625 0.750000 \n v 0.132812 0.210938 0.757812 \n v -0.132812 0.210938 0.757812 \n v 0.117188 -0.687500 0.734375 \n v -0.117188 -0.687500 0.734375 \n v 0.078125 -0.445312 0.750000 \n v -0.078125 -0.445312 0.750000 \n v 0.000000 -0.445312 0.750000 \n v 0.000000 -0.328125 0.742188 \n v 0.093750 -0.273438 0.781250 \n v -0.093750 -0.273438 0.781250 \n v 0.132812 -0.226562 0.796875 \n v -0.132812 -0.226562 0.796875 \n v 0.109375 -0.132812 0.781250 \n v -0.109375 -0.132812 0.781250 \n v 0.039062 -0.125000 0.781250 \n v -0.039062 -0.125000 0.781250 \n v 0.000000 -0.203125 0.828125 \n v 0.046875 -0.148438 0.812500 \n v -0.046875 -0.148438 0.812500 \n v 0.093750 -0.156250 0.812500 \n v -0.093750 -0.156250 0.812500 \n v 0.109375 -0.226562 0.828125 \n v -0.109375 -0.226562 0.828125 \n v 0.078125 -0.250000 0.804688 \n v -0.078125 -0.250000 0.804688 \n v 0.000000 -0.289062 0.804688 \n v 0.257812 -0.312500 0.554688 \n v -0.257812 -0.312500 0.554688 \n v 0.164062 -0.242188 0.710938 \n v -0.164062 -0.242188 0.710938 \n v 0.179688 -0.312500 0.710938 \n v -0.179688 -0.312500 0.710938 \n v 0.234375 -0.250000 0.554688 \n v -0.234375 -0.250000 0.554688 \n v 0.000000 -0.875000 0.687500 \n v 0.046875 -0.867188 0.687500 \n v -0.046875 -0.867188 0.687500 \n v 0.093750 -0.820312 0.710938 \n v -0.093750 -0.820312 0.710938 \n v 0.093750 -0.742188 0.726562 \n v -0.093750 -0.742188 0.726562 \n v 0.000000 -0.781250 0.656250 \n v 0.093750 -0.750000 0.664062 \n v -0.093750 -0.750000 0.664062 \n v 0.093750 -0.812500 0.640625 \n v -0.093750 -0.812500 0.640625 \n v 0.046875 -0.851562 0.632812 \n v -0.046875 -0.851562 0.632812 \n v 0.000000 -0.859375 0.632812 \n v 0.171875 0.218750 0.781250 \n v -0.171875 0.218750 0.781250 \n v 0.187500 0.156250 0.773438 \n v -0.187500 0.156250 0.773438 \n v 0.335938 0.429688 0.757812 \n v -0.335938 0.429688 0.757812 \n v 0.273438 0.421875 0.773438 \n v -0.273438 0.421875 0.773438 \n v 0.421875 0.398438 0.773438 \n v -0.421875 0.398438 0.773438 \n v 0.562500 0.351562 0.695312 \n v -0.562500 0.351562 0.695312 \n v 0.585938 0.289062 0.687500 \n v -0.585938 0.289062 0.687500 \n v 0.578125 0.195312 0.679688 \n v -0.578125 0.195312 0.679688 \n v 0.476562 0.101562 0.718750 \n v -0.476562 0.101562 0.718750 \n v 0.375000 0.062500 0.742188 \n v -0.375000 0.062500 0.742188 \n v 0.226562 0.109375 0.781250 \n v -0.226562 0.109375 0.781250 \n v 0.179688 0.296875 0.781250 \n v -0.179688 0.296875 0.781250 \n v 0.210938 0.375000 0.781250 \n v -0.210938 0.375000 0.781250 \n v 0.234375 0.359375 0.757812 \n v -0.234375 0.359375 0.757812 \n v 0.195312 0.296875 0.757812 \n v -0.195312 0.296875 0.757812 \n v 0.242188 0.125000 0.757812 \n v -0.242188 0.125000 0.757812 \n v 0.375000 0.085938 0.726562 \n v -0.375000 0.085938 0.726562 \n v 0.460938 0.117188 0.703125 \n v -0.460938 0.117188 0.703125 \n v 0.546875 0.210938 0.671875 \n v -0.546875 0.210938 0.671875 \n v 0.554688 0.281250 0.671875 \n v -0.554688 0.281250 0.671875 \n v 0.531250 0.335938 0.679688 \n v -0.531250 0.335938 0.679688 \n v 0.414062 0.390625 0.750000 \n v -0.414062 0.390625 0.750000 \n v 0.281250 0.398438 0.765625 \n v -0.281250 0.398438 0.765625 \n v 0.335938 0.406250 0.750000 \n v -0.335938 0.406250 0.750000 \n v 0.203125 0.171875 0.750000 \n v -0.203125 0.171875 0.750000 \n v 0.195312 0.226562 0.750000 \n v -0.195312 0.226562 0.750000 \n v 0.109375 0.460938 0.609375 \n v -0.109375 0.460938 0.609375 \n v 0.195312 0.664062 0.617188 \n v -0.195312 0.664062 0.617188 \n v 0.335938 0.687500 0.593750 \n v -0.335938 0.687500 0.593750 \n v 0.484375 0.554688 0.554688 \n v -0.484375 0.554688 0.554688 \n v 0.679688 0.453125 0.492188 \n v -0.679688 0.453125 0.492188 \n v 0.796875 0.406250 0.460938 \n v -0.796875 0.406250 0.460938 \n v 0.773438 0.164062 0.375000 \n v -0.773438 0.164062 0.375000 \n v 0.601562 0.000000 0.414062 \n v -0.601562 0.000000 0.414062 \n v 0.437500 -0.093750 0.468750 \n v -0.437500 -0.093750 0.468750 \n v 0.000000 0.898438 0.289062 \n v 0.000000 0.984375 -0.078125 \n v 0.000000 -0.195312 -0.671875 \n v 0.000000 -0.460938 0.187500 \n v 0.000000 -0.976562 0.460938 \n v 0.000000 -0.804688 0.343750 \n v 0.000000 -0.570312 0.320312 \n v 0.000000 -0.484375 0.281250 \n v 0.851562 0.234375 0.054688 \n v -0.851562 0.234375 0.054688 \n v 0.859375 0.320312 -0.046875 \n v -0.859375 0.320312 -0.046875 \n v 0.773438 0.265625 -0.437500 \n v -0.773438 0.265625 -0.437500 \n v 0.460938 0.437500 -0.703125 \n v -0.460938 0.437500 -0.703125 \n v 0.734375 -0.046875 0.070312 \n v -0.734375 -0.046875 0.070312 \n v 0.593750 -0.125000 -0.164062 \n v -0.593750 -0.125000 -0.164062 \n v 0.640625 -0.007812 -0.429688 \n v -0.640625 -0.007812 -0.429688 \n v 0.335938 0.054688 -0.664062 \n v -0.335938 0.054688 -0.664062 \n v 0.234375 -0.351562 0.406250 \n v -0.234375 -0.351562 0.406250 \n v 0.179688 -0.414062 0.257812 \n v -0.179688 -0.414062 0.257812 \n v 0.289062 -0.710938 0.382812 \n v -0.289062 -0.710938 0.382812 \n v 0.250000 -0.500000 0.390625 \n v -0.250000 -0.500000 0.390625 \n v 0.328125 -0.914062 0.398438 \n v -0.328125 -0.914062 0.398438 \n v 0.140625 -0.757812 0.367188 \n v -0.140625 -0.757812 0.367188 \n v 0.125000 -0.539062 0.359375 \n v -0.125000 -0.539062 0.359375 \n v 0.164062 -0.945312 0.437500 \n v -0.164062 -0.945312 0.437500 \n v 0.218750 -0.281250 0.429688 \n v -0.218750 -0.281250 0.429688 \n v 0.210938 -0.226562 0.468750 \n v -0.210938 -0.226562 0.468750 \n v 0.203125 -0.171875 0.500000 \n v -0.203125 -0.171875 0.500000 \n v 0.210938 -0.390625 0.164062 \n v -0.210938 -0.390625 0.164062 \n v 0.296875 -0.312500 -0.265625 \n v -0.296875 -0.312500 -0.265625 \n v 0.343750 -0.148438 -0.539062 \n v -0.343750 -0.148438 -0.539062 \n v 0.453125 0.867188 -0.382812 \n v -0.453125 0.867188 -0.382812 \n v 0.453125 0.929688 -0.070312 \n v -0.453125 0.929688 -0.070312 \n v 0.453125 0.851562 0.234375 \n v -0.453125 0.851562 0.234375 \n v 0.460938 0.523438 0.429688 \n v -0.460938 0.523438 0.429688 \n v 0.726562 0.406250 0.335938 \n v -0.726562 0.406250 0.335938 \n v 0.632812 0.453125 0.281250 \n v -0.632812 0.453125 0.281250 \n v 0.640625 0.703125 0.054688 \n v -0.640625 0.703125 0.054688 \n v 0.796875 0.562500 0.125000 \n v -0.796875 0.562500 0.125000 \n v 0.796875 0.617188 -0.117188 \n v -0.796875 0.617188 -0.117188 \n v 0.640625 0.750000 -0.195312 \n v -0.640625 0.750000 -0.195312 \n v 0.640625 0.679688 -0.445312 \n v -0.640625 0.679688 -0.445312 \n v 0.796875 0.539062 -0.359375 \n v -0.796875 0.539062 -0.359375 \n v 0.617188 0.328125 -0.585938 \n v -0.617188 0.328125 -0.585938 \n v 0.484375 0.023438 -0.546875 \n v -0.484375 0.023438 -0.546875 \n v 0.820312 0.328125 -0.203125 \n v -0.820312 0.328125 -0.203125 \n v 0.406250 -0.171875 0.148438 \n v -0.406250 -0.171875 0.148438 \n v 0.429688 -0.195312 -0.210938 \n v -0.429688 -0.195312 -0.210938 \n v 0.890625 0.406250 -0.234375 \n v -0.890625 0.406250 -0.234375 \n v 0.773438 -0.140625 -0.125000 \n v -0.773438 -0.140625 -0.125000 \n v 1.039062 -0.101562 -0.328125 \n v -1.039062 -0.101562 -0.328125 \n v 1.281250 0.054688 -0.429688 \n v -1.281250 0.054688 -0.429688 \n v 1.351562 0.320312 -0.421875 \n v -1.351562 0.320312 -0.421875 \n v 1.234375 0.507812 -0.421875 \n v -1.234375 0.507812 -0.421875 \n v 1.023438 0.476562 -0.312500 \n v -1.023438 0.476562 -0.312500 \n v 1.015625 0.414062 -0.289062 \n v -1.015625 0.414062 -0.289062 \n v 1.187500 0.437500 -0.390625 \n v -1.187500 0.437500 -0.390625 \n v 1.265625 0.289062 -0.406250 \n v -1.265625 0.289062 -0.406250 \n v 1.210938 0.078125 -0.406250 \n v -1.210938 0.078125 -0.406250 \n v 1.031250 -0.039062 -0.304688 \n v -1.031250 -0.039062 -0.304688 \n v 0.828125 -0.070312 -0.132812 \n v -0.828125 -0.070312 -0.132812 \n v 0.921875 0.359375 -0.218750 \n v -0.921875 0.359375 -0.218750 \n v 0.945312 0.304688 -0.289062 \n v -0.945312 0.304688 -0.289062 \n v 0.882812 -0.023438 -0.210938 \n v -0.882812 -0.023438 -0.210938 \n v 1.039062 0.000000 -0.367188 \n v -1.039062 0.000000 -0.367188 \n v 1.187500 0.093750 -0.445312 \n v -1.187500 0.093750 -0.445312 \n v 1.234375 0.250000 -0.445312 \n v -1.234375 0.250000 -0.445312 \n v 1.171875 0.359375 -0.437500 \n v -1.171875 0.359375 -0.437500 \n v 1.023438 0.343750 -0.359375 \n v -1.023438 0.343750 -0.359375 \n v 0.843750 0.289062 -0.210938 \n v -0.843750 0.289062 -0.210938 \n v 0.835938 0.171875 -0.273438 \n v -0.835938 0.171875 -0.273438 \n v 0.757812 0.093750 -0.273438 \n v -0.757812 0.093750 -0.273438 \n v 0.820312 0.085938 -0.273438 \n v -0.820312 0.085938 -0.273438 \n v 0.843750 0.015625 -0.273438 \n v -0.843750 0.015625 -0.273438 \n v 0.812500 -0.015625 -0.273438 \n v -0.812500 -0.015625 -0.273438 \n v 0.726562 0.000000 -0.070312 \n v -0.726562 0.000000 -0.070312 \n v 0.718750 -0.023438 -0.171875 \n v -0.718750 -0.023438 -0.171875 \n v 0.718750 0.039062 -0.187500 \n v -0.718750 0.039062 -0.187500 \n v 0.796875 0.203125 -0.210938 \n v -0.796875 0.203125 -0.210938 \n v 0.890625 0.242188 -0.265625 \n v -0.890625 0.242188 -0.265625 \n v 0.890625 0.234375 -0.320312 \n v -0.890625 0.234375 -0.320312 \n v 0.812500 -0.015625 -0.320312 \n v -0.812500 -0.015625 -0.320312 \n v 0.851562 0.015625 -0.320312 \n v -0.851562 0.015625 -0.320312 \n v 0.828125 0.078125 -0.320312 \n v -0.828125 0.078125 -0.320312 \n v 0.765625 0.093750 -0.320312 \n v -0.765625 0.093750 -0.320312 \n v 0.843750 0.171875 -0.320312 \n v -0.843750 0.171875 -0.320312 \n v 1.039062 0.328125 -0.414062 \n v -1.039062 0.328125 -0.414062 \n v 1.187500 0.343750 -0.484375 \n v -1.187500 0.343750 -0.484375 \n v 1.257812 0.242188 -0.492188 \n v -1.257812 0.242188 -0.492188 \n v 1.210938 0.085938 -0.484375 \n v -1.210938 0.085938 -0.484375 \n v 1.046875 0.000000 -0.421875 \n v -1.046875 0.000000 -0.421875 \n v 0.882812 -0.015625 -0.265625 \n v -0.882812 -0.015625 -0.265625 \n v 0.953125 0.289062 -0.343750 \n v -0.953125 0.289062 -0.343750 \n v 0.890625 0.109375 -0.328125 \n v -0.890625 0.109375 -0.328125 \n v 0.937500 0.062500 -0.335938 \n v -0.937500 0.062500 -0.335938 \n v 1.000000 0.125000 -0.367188 \n v -1.000000 0.125000 -0.367188 \n v 0.960938 0.171875 -0.351562 \n v -0.960938 0.171875 -0.351562 \n v 1.015625 0.234375 -0.375000 \n v -1.015625 0.234375 -0.375000 \n v 1.054688 0.187500 -0.382812 \n v -1.054688 0.187500 -0.382812 \n v 1.109375 0.210938 -0.390625 \n v -1.109375 0.210938 -0.390625 \n v 1.085938 0.273438 -0.390625 \n v -1.085938 0.273438 -0.390625 \n v 1.023438 0.437500 -0.484375 \n v -1.023438 0.437500 -0.484375 \n v 1.250000 0.468750 -0.546875 \n v -1.250000 0.468750 -0.546875 \n v 1.367188 0.296875 -0.500000 \n v -1.367188 0.296875 -0.500000 \n v 1.312500 0.054688 -0.531250 \n v -1.312500 0.054688 -0.531250 \n v 1.039062 -0.085938 -0.492188 \n v -1.039062 -0.085938 -0.492188 \n v 0.789062 -0.125000 -0.328125 \n v -0.789062 -0.125000 -0.328125 \n v 0.859375 0.382812 -0.382812 \n v -0.859375 0.382812 -0.382812 \n vt 0.890955 0.590063 \n vt 0.870622 0.589649 \n vt 0.860081 0.560115 \n vt 0.904571 0.559404 \n vt 0.856226 0.850547 \n vt 0.868067 0.821510 \n vt 0.888398 0.821999 \n vt 0.900640 0.853232 \n vt 0.853018 0.521562 \n vt 0.920166 0.524546 \n vt 0.847458 0.888748 \n vt 0.914672 0.888748 \n vt 0.828900 0.590771 \n vt 0.798481 0.569535 \n vt 0.795104 0.838402 \n vt 0.826436 0.818537 \n vt 0.854402 0.604754 \n vt 0.852534 0.805700 \n vt 0.854107 0.625459 \n vt 0.828171 0.633354 \n vt 0.827598 0.775964 \n vt 0.853157 0.785002 \n vt 0.791018 0.645443 \n vt 0.791018 0.762238 \n vt 0.855181 0.668527 \n vt 0.842358 0.702491 \n vt 0.844839 0.707525 \n vt 0.856142 0.742025 \n vt 0.867508 0.642291 \n vt 0.867293 0.768782 \n vt 0.890474 0.641909 \n vt 0.900375 0.666964 \n vt 0.901223 0.745592 \n vt 0.890219 0.770183 \n vt 0.918898 0.699697 \n vt 0.921180 0.713713 \n vt 0.931889 0.636832 \n vt 0.968392 0.645333 \n vt 0.968213 0.770220 \n vt 0.931368 0.777093 \n vt 0.905882 0.627902 \n vt 0.904990 0.784860 \n vt 0.906232 0.605742 \n vt 0.933717 0.593037 \n vt 0.931250 0.820926 \n vt 0.904357 0.807013 \n vt 0.968392 0.573812 \n vt 0.965038 0.841671 \n vt 0.902359 0.607909 \n vt 0.889591 0.593275 \n vt 0.900583 0.804677 \n vt 0.887178 0.818729 \n vt 0.899781 0.626257 \n vt 0.898822 0.786233 \n vt 0.887842 0.636527 \n vt 0.887351 0.775442 \n vt 0.870908 0.635245 \n vt 0.870376 0.775972 \n vt 0.859881 0.623942 \n vt 0.858859 0.786774 \n vt 0.859664 0.608186 \n vt 0.857942 0.802505 \n vt 0.871664 0.593961 \n vt 0.869299 0.817249 \n vt 0.879400 0.616512 \n vt 0.878029 0.795063 \n vt 0.540260 0.053805 \n vt 0.536419 0.062072 \n vt 0.518925 0.059681 \n vt 0.518916 0.050294 \n vt 0.501452 0.062043 \n vt 0.497626 0.053770 \n vt 0.551930 0.058338 \n vt 0.542788 0.064089 \n vt 0.495083 0.064047 \n vt 0.485955 0.058273 \n vt 0.555073 0.061900 \n vt 0.546290 0.072669 \n vt 0.491565 0.072625 \n vt 0.482805 0.061829 \n vt 0.563812 0.076586 \n vt 0.548333 0.084893 \n vt 0.489507 0.084858 \n vt 0.474014 0.076511 \n vt 0.583135 0.108495 \n vt 0.555621 0.121749 \n vt 0.482177 0.121781 \n vt 0.454527 0.108481 \n vt 0.605512 0.165134 \n vt 0.647395 0.200502 \n vt 0.621513 0.227818 \n vt 0.553118 0.209599 \n vt 0.416514 0.229490 \n vt 0.389677 0.201890 \n vt 0.432024 0.165644 \n vt 0.485339 0.210053 \n vt 0.676379 0.233241 \n vt 0.664761 0.253225 \n vt 0.372747 0.256357 \n vt 0.360308 0.235899 \n vt 0.715342 0.265392 \n vt 0.683908 0.279995 \n vt 0.353696 0.284606 \n vt 0.320452 0.270303 \n vt 0.707254 0.310054 \n vt 0.687515 0.311539 \n vt 0.351187 0.317440 \n vt 0.330721 0.316853 \n vt 0.697446 0.332673 \n vt 0.676824 0.323937 \n vt 0.362723 0.329722 \n vt 0.341964 0.339667 \n vt 0.662817 0.372521 \n vt 0.639050 0.357330 \n vt 0.402772 0.362131 \n vt 0.379297 0.378686 \n vt 0.626842 0.395792 \n vt 0.618316 0.375151 \n vt 0.424583 0.379267 \n vt 0.416915 0.400552 \n vt 0.604826 0.397804 \n vt 0.600808 0.377857 \n vt 0.442396 0.381222 \n vt 0.439252 0.401540 \n vt 0.553095 0.390512 \n vt 0.559674 0.357011 \n vt 0.482938 0.358497 \n vt 0.490934 0.391862 \n vt 0.521923 0.386009 \n vt 0.521086 0.343868 \n vt 0.577279 0.340156 \n vt 0.599845 0.344815 \n vt 0.441977 0.347815 \n vt 0.464579 0.342230 \n vt 0.615546 0.342005 \n vt 0.425972 0.345582 \n vt 0.634472 0.332311 \n vt 0.406362 0.336480 \n vt 0.662406 0.312804 \n vt 0.377061 0.317685 \n vt 0.668440 0.297958 \n vt 0.370304 0.302644 \n vt 0.664101 0.277872 \n vt 0.374100 0.281778 \n vt 0.639236 0.253047 \n vt 0.398938 0.255633 \n vt 0.613992 0.242662 \n vt 0.424464 0.244473 \n vt 0.572941 0.258564 \n vt 0.466409 0.259709 \n vt 0.563905 0.272007 \n vt 0.519760 0.248864 \n vt 0.475886 0.273078 \n vt 0.558527 0.316594 \n vt 0.482619 0.317843 \n vt 0.520277 0.294764 \n vt 0.556923 0.291214 \n vt 0.483433 0.292249 \n vt 0.525483 0.068967 \n vt 0.518928 0.067899 \n vt 0.512375 0.068956 \n vt 0.531231 0.073829 \n vt 0.506626 0.073811 \n vt 0.531019 0.087431 \n vt 0.506827 0.087416 \n vt 0.532042 0.127713 \n vt 0.532669 0.090920 \n vt 0.505177 0.090908 \n vt 0.505828 0.127728 \n vt 0.538112 0.158382 \n vt 0.518981 0.151749 \n vt 0.518941 0.128358 \n vt 0.499851 0.158434 \n vt 0.518925 0.093952 \n vt 0.518927 0.085180 \n vt 0.548362 0.173560 \n vt 0.537959 0.175966 \n vt 0.535214 0.166808 \n vt 0.502799 0.166857 \n vt 0.500100 0.176033 \n vt 0.489683 0.173693 \n vt 0.544281 0.193366 \n vt 0.537248 0.187577 \n vt 0.500890 0.187571 \n vt 0.493996 0.193428 \n vt 0.519841 0.200843 \n vt 0.528757 0.191785 \n vt 0.509219 0.191626 \n vt 0.517577 0.190607 \n vt 0.519132 0.185382 \n vt 0.518998 0.159028 \n vt 0.531131 0.171631 \n vt 0.519016 0.165599 \n vt 0.506910 0.171667 \n vt 0.519099 0.179457 \n vt 0.528222 0.186316 \n vt 0.509787 0.186260 \n vt 0.533528 0.184215 \n vt 0.504547 0.184206 \n vt 0.533449 0.176739 \n vt 0.504604 0.176791 \n vt 0.561572 0.167779 \n vt 0.476363 0.167996 \n vt 0.559475 0.149319 \n vt 0.478371 0.149447 \n vt 0.596138 0.133426 \n vt 0.441395 0.133592 \n vt 0.601169 0.147885 \n vt 0.436337 0.148194 \n vt 0.518925 0.083865 \n vt 0.528933 0.084957 \n vt 0.508915 0.084945 \n vt 0.529036 0.075429 \n vt 0.508820 0.075415 \n vt 0.523751 0.070508 \n vt 0.514106 0.070501 \n vt 0.518929 0.069468 \n vt 0.521560 0.074970 \n vt 0.518928 0.074259 \n vt 0.516297 0.074966 \n vt 0.524236 0.076691 \n vt 0.513619 0.076684 \n vt 0.524601 0.079886 \n vt 0.513252 0.079879 \n vt 0.518926 0.079331 \n vt 0.571787 0.277295 \n vt 0.568351 0.292904 \n vt 0.468070 0.278617 \n vt 0.471978 0.294282 \n vt 0.573085 0.311386 \n vt 0.467790 0.313081 \n vt 0.584855 0.327708 \n vt 0.456477 0.329961 \n vt 0.580734 0.266620 \n vt 0.458737 0.268049 \n vt 0.611720 0.255725 \n vt 0.427062 0.257728 \n vt 0.632494 0.262853 \n vt 0.406068 0.265508 \n vt 0.653658 0.279971 \n vt 0.384904 0.283634 \n vt 0.656064 0.297636 \n vt 0.383015 0.301864 \n vt 0.652752 0.310186 \n vt 0.386858 0.314615 \n vt 0.629040 0.323864 \n vt 0.411556 0.327673 \n vt 0.614408 0.331972 \n vt 0.426727 0.335361 \n vt 0.601033 0.333624 \n vt 0.440344 0.336537 \n vt 0.590644 0.321516 \n vt 0.601799 0.328453 \n vt 0.450408 0.323919 \n vt 0.439372 0.331331 \n vt 0.613335 0.327083 \n vt 0.427623 0.330358 \n vt 0.626851 0.320513 \n vt 0.413648 0.324175 \n vt 0.646248 0.306421 \n vt 0.393381 0.310510 \n vt 0.649541 0.296225 \n vt 0.389662 0.300183 \n vt 0.647785 0.283486 \n vt 0.391040 0.287071 \n vt 0.629829 0.267263 \n vt 0.408893 0.269959 \n vt 0.612641 0.261560 \n vt 0.426254 0.263693 \n vt 0.585166 0.270991 \n vt 0.454369 0.272583 \n vt 0.578124 0.281900 \n vt 0.461798 0.283441 \n vt 0.579548 0.309340 \n vt 0.461204 0.311233 \n vt 0.577524 0.293776 \n vt 0.462754 0.295432 \n vt 0.553209 0.433063 \n vt 0.523031 0.433628 \n vt 0.492809 0.434538 \n vt 0.609819 0.431516 \n vt 0.435860 0.435740 \n vt 0.648174 0.419316 \n vt 0.396518 0.425416 \n vt 0.692106 0.388274 \n vt 0.350292 0.396229 \n vt 0.726332 0.341754 \n vt 0.312756 0.350588 \n vt 0.735879 0.312112 \n vt 0.301067 0.320593 \n vt 0.729900 0.256393 \n vt 0.304876 0.261087 \n vt 0.698172 0.216906 \n vt 0.337414 0.219179 \n vt 0.663103 0.190671 \n vt 0.373474 0.191872 \n vt 0.626908 0.015608 \n vt 0.649444 0.022378 \n vt 0.660451 0.076084 \n vt 0.621440 0.048089 \n vt 0.376796 0.075296 \n vt 0.388827 0.021586 \n vt 0.411318 0.015131 \n vt 0.416419 0.047631 \n vt 0.567460 0.000144 \n vt 0.577206 0.032801 \n vt 0.470636 0.000144 \n vt 0.460782 0.032656 \n vt 0.518922 0.024886 \n vt 0.547413 0.041724 \n vt 0.490511 0.041669 \n vt 0.558059 0.053871 \n vt 0.479842 0.053785 \n vt 0.576951 0.057998 \n vt 0.460920 0.057845 \n vt 0.611687 0.078268 \n vt 0.425932 0.077985 \n vt 0.626663 0.111357 \n vt 0.410618 0.111244 \n vt 0.629482 0.130456 \n vt 0.623495 0.146796 \n vt 0.413741 0.147158 \n vt 0.407648 0.130594 \n vt 0.619303 0.159841 \n vt 0.418035 0.160361 \n vt 0.945900 0.079569 \n vt 0.886245 0.121777 \n vt 0.849114 0.099732 \n vt 0.891780 0.036916 \n vt 0.183115 0.092127 \n vt 0.141314 0.112482 \n vt 0.078961 0.060719 \n vt 0.142277 0.021467 \n vt 0.788458 0.080826 \n vt 0.805584 0.010786 \n vt 0.246353 0.076510 \n vt 0.232648 0.003484 \n vt 0.687018 0.077204 \n vt 0.672384 0.022201 \n vt 0.349875 0.075955 \n vt 0.365979 0.020991 \n vt 0.760215 0.193244 \n vt 0.789046 0.233323 \n vt 0.271553 0.193871 \n vt 0.241255 0.236977 \n vt 0.994525 0.167705 \n vt 0.909112 0.183261 \n vt 0.107928 0.179083 \n vt 0.011829 0.155367 \n vt 0.911671 0.402429 \n vt 0.862868 0.338556 \n vt 0.894128 0.301884 \n vt 0.962901 0.344752 \n vt 0.123776 0.315519 \n vt 0.160557 0.356821 \n vt 0.106400 0.432652 \n vt 0.043968 0.367038 \n vt 0.915360 0.259804 \n vt 0.999856 0.254640 \n vt 0.098965 0.266968 \n vt 0.000144 0.259113 \n vt 0.749542 0.334683 \n vt 0.766337 0.300809 \n vt 0.789162 0.313727 \n vt 0.267408 0.310142 \n vt 0.288183 0.346496 \n vt 0.242992 0.325552 \n vt 0.815314 0.276388 \n vt 0.846174 0.293397 \n vt 0.213065 0.285164 \n vt 0.178537 0.304983 \n vt 0.845007 0.256352 \n vt 0.873517 0.265922 \n vt 0.179662 0.263312 \n vt 0.147089 0.274284 \n vt 0.859075 0.228168 \n vt 0.886999 0.233769 \n vt 0.162803 0.231720 \n vt 0.131514 0.237587 \n vt 0.842355 0.195160 \n vt 0.875030 0.184705 \n vt 0.145224 0.182749 \n vt 0.176788 0.196179 \n vt 0.794286 0.364062 \n vt 0.239776 0.382592 \n vt 0.770185 0.379538 \n vt 0.268122 0.398737 \n vt 0.845499 0.449967 \n vt 0.185281 0.484099 \n vt 0.815858 0.445381 \n vt 0.770572 0.444261 \n vt 0.755700 0.418603 \n vt 0.287033 0.442912 \n vt 0.271364 0.473316 \n vt 0.219260 0.477186 \n vt 0.819845 0.468071 \n vt 0.215894 0.503605 \n vt 0.809631 0.233887 \n vt 0.219168 0.237388 \n vt 0.829287 0.219562 \n vt 0.199067 0.222464 \n vt 0.786480 0.117591 \n vt 0.715482 0.139727 \n vt 0.246666 0.114850 \n vt 0.319538 0.139409 \n vt 0.785486 0.152330 \n vt 0.245969 0.151002 \n vt 0.837382 0.156361 \n vt 0.858171 0.137775 \n vt 0.171653 0.132294 \n vt 0.196622 0.155241 \n vt 0.506166 0.904851 \n vt 0.432388 0.894943 \n vt 0.438797 0.870229 \n vt 0.491058 0.881714 \n vt 0.315867 0.868209 \n vt 0.321637 0.893225 \n vt 0.247207 0.901159 \n vt 0.263032 0.878321 \n vt 0.572792 0.860484 \n vt 0.604825 0.879946 \n vt 0.181486 0.854693 \n vt 0.148729 0.873349 \n vt 0.586396 0.793977 \n vt 0.619962 0.791615 \n vt 0.169745 0.787474 \n vt 0.136063 0.784093 \n vt 0.549027 0.746412 \n vt 0.563786 0.739211 \n vt 0.208656 0.740879 \n vt 0.194086 0.733241 \n vt 0.500314 0.711729 \n vt 0.508270 0.697693 \n vt 0.258399 0.707497 \n vt 0.250811 0.693249 \n vt 0.438641 0.680683 \n vt 0.434803 0.658882 \n vt 0.320962 0.677959 \n vt 0.325318 0.656224 \n vt 0.505666 0.730944 \n vt 0.452955 0.700023 \n vt 0.306136 0.696976 \n vt 0.252524 0.726592 \n vt 0.542850 0.755753 \n vt 0.214575 0.750414 \n vt 0.568148 0.787367 \n vt 0.188269 0.781375 \n vt 0.555495 0.826352 \n vt 0.199850 0.820889 \n vt 0.501231 0.844356 \n vt 0.253846 0.840502 \n vt 0.457832 0.840040 \n vt 0.297562 0.837358 \n vt 0.796021 0.176969 \n vt 0.783193 0.187449 \n vt 0.233625 0.175620 \n vt 0.246955 0.187075 \n vt 0.391039 0.611891 \n vt 0.394766 0.686125 \n vt 0.369913 0.610196 \n vt 0.364838 0.684445 \n vt 0.391747 0.862097 \n vt 0.401605 0.841460 \n vt 0.354026 0.840297 \n vt 0.363377 0.861308 \n vt 0.435018 0.718280 \n vt 0.323658 0.715731 \n vt 0.433669 0.729661 \n vt 0.384658 0.710299 \n vt 0.374400 0.708969 \n vt 0.324726 0.727177 \n vt 0.410995 0.747662 \n vt 0.427812 0.742828 \n vt 0.347028 0.745816 \n vt 0.330270 0.740536 \n vt 0.418086 0.784946 \n vt 0.384657 0.795423 \n vt 0.372270 0.794472 \n vt 0.338952 0.783073 \n vt 0.431333 0.817535 \n vt 0.324790 0.815460 \n vt 0.816266 0.203086 \n vt 0.825107 0.209762 \n vt 0.199767 0.214827 \n vt 0.209828 0.206161 \n vt 0.802192 0.184609 \n vt 0.226485 0.183086 \n vt 0.448505 0.804621 \n vt 0.473386 0.824700 \n vt 0.307886 0.802031 \n vt 0.282357 0.821525 \n vt 0.435868 0.779569 \n vt 0.321237 0.777208 \n vt 0.423718 0.754191 \n vt 0.334089 0.752045 \n vt 0.437950 0.749777 \n vt 0.319919 0.747250 \n vt 0.445392 0.731997 \n vt 0.312907 0.729222 \n vt 0.440995 0.724383 \n vt 0.317510 0.721697 \n vt 0.455277 0.713731 \n vt 0.303460 0.710657 \n vt 0.512485 0.828811 \n vt 0.242975 0.824574 \n vt 0.550942 0.811814 \n vt 0.204839 0.806417 \n vt 0.552139 0.787682 \n vt 0.204331 0.782156 \n vt 0.539407 0.764539 \n vt 0.217774 0.759319 \n vt 0.508439 0.743135 \n vt 0.249419 0.738732 \n vt 0.470841 0.748408 \n vt 0.454776 0.761665 \n vt 0.286960 0.745020 \n vt 0.302729 0.758742 \n vt 0.488870 0.770464 \n vt 0.475403 0.783904 \n vt 0.268291 0.766661 \n vt 0.281439 0.780511 \n vt 0.503673 0.787562 \n vt 0.494476 0.802470 \n vt 0.252972 0.783410 \n vt 0.261790 0.798626 \n vt 0.518562 0.791602 \n vt 0.516802 0.807339 \n vt 0.237920 0.787045 \n vt 0.239243 0.802891 \n vt 0.484068 0.628776 \n vt 0.543385 0.683538 \n vt 0.276936 0.625067 \n vt 0.216123 0.678120 \n vt 0.581052 0.726933 \n vt 0.177176 0.720426 \n vt 0.616701 0.759965 \n vt 0.140379 0.752377 \n vt 0.707492 0.759884 \n vt 0.660647 0.741167 \n vt 0.049526 0.748824 \n vt 0.097038 0.732052 \n vt 0.745511 0.652100 \n vt 0.677256 0.670436 \n vt 0.019409 0.639749 \n vt 0.083564 0.662038 \n vt 0.740843 0.572428 \n vt 0.671403 0.592656 \n vt 0.033664 0.564403 \n vt 0.092820 0.589862 \n vt 0.834578 0.206879 \n vt 0.834705 0.206959 \n vt 0.051216 0.522659 \n vt 0.145041 0.562595 \n vt 0.620420 0.565675 \n vt 0.498072 0.552315 \n vt 0.264218 0.550140 \n vn 0.6650 -0.2008 0.7194 \n vn -0.6650 -0.2008 0.7194 \n vn 0.8294 -0.3036 0.4689 \n vn -0.8294 -0.3036 0.4689 \n vn 0.4155 -0.7933 0.4449 \n vn -0.4155 -0.7933 0.4449 \n vn 0.3600 -0.5089 0.7820 \n vn -0.3600 -0.5089 0.7820 \n vn -0.0787 -0.5394 0.8384 \n vn 0.0787 -0.5394 0.8384 \n vn -0.2696 -0.8413 0.4685 \n vn 0.2696 -0.8413 0.4685 \n vn -0.7707 -0.3352 0.5420 \n vn 0.7707 -0.3352 0.5420 \n vn -0.4689 -0.1940 0.8617 \n vn 0.4689 -0.1940 0.8617 \n vn -0.4767 0.1907 0.8581 \n vn 0.4767 0.1907 0.8581 \n vn -0.7672 0.3264 0.5521 \n vn 0.7672 0.3264 0.5521 \n vn -0.2519 0.8173 0.5182 \n vn 0.2519 0.8173 0.5182 \n vn -0.0949 0.5696 0.8164 \n vn 0.0949 0.5696 0.8164 \n vn 0.3667 0.5370 0.7597 \n vn -0.3667 0.5370 0.7597 \n vn 0.4141 0.7672 0.4898 \n vn -0.4141 0.7672 0.4898 \n vn 0.8277 0.2952 0.4771 \n vn -0.8277 0.2952 0.4771 \n vn 0.6713 0.1971 0.7145 \n vn -0.6713 0.1971 0.7145 \n vn 0.8111 0.3244 -0.4867 \n vn -0.8111 0.3244 -0.4867 \n vn 0.2052 0.8206 -0.5334 \n vn -0.2052 0.8206 -0.5334 \n vn -0.4223 0.7806 -0.4607 \n vn 0.4223 0.7806 -0.4607 \n vn -0.8241 0.3225 -0.4658 \n vn 0.8241 0.3225 -0.4658 \n vn -0.8137 -0.3487 -0.4650 \n vn 0.8137 -0.3487 -0.4650 \n vn -0.4223 -0.7806 -0.4607 \n vn 0.4223 -0.7806 -0.4607 \n vn 0.2052 -0.8206 -0.5334 \n vn -0.2052 -0.8206 -0.5334 \n vn 0.7995 -0.3510 -0.4875 \n vn -0.7995 -0.3510 -0.4875 \n vn 0.4000 -0.0623 0.9144 \n vn -0.4000 -0.0623 0.9144 \n vn 0.3069 -0.1754 0.9354 \n vn -0.3069 -0.1754 0.9354 \n vn 0.0945 -0.1835 0.9785 \n vn -0.0945 -0.1835 0.9785 \n vn -0.0624 -0.0283 0.9977 \n vn 0.0624 -0.0283 0.9977 \n vn -0.0624 0.0260 0.9977 \n vn 0.0624 0.0260 0.9977 \n vn 0.0996 0.1729 0.9799 \n vn -0.0996 0.1729 0.9799 \n vn 0.3036 0.1656 0.9383 \n vn -0.3036 0.1656 0.9383 \n vn 0.4002 0.0572 0.9147 \n vn -0.4002 0.0572 0.9147 \n vn 0.1231 -0.8616 0.4924 \n vn -0.1231 -0.8616 0.4924 \n vn 0.2190 -0.8647 0.4520 \n vn -0.2190 -0.8647 0.4520 \n vn 0.5902 -0.4550 0.6668 \n vn -0.5902 -0.4550 0.6668 \n vn 0.7689 -0.0506 0.6374 \n vn -0.7689 -0.0506 0.6374 \n vn 0.7796 0.0900 0.6197 \n vn -0.7796 0.0900 0.6197 \n vn 0.3241 -0.8188 0.4739 \n vn -0.3241 -0.8188 0.4739 \n vn 0.3857 -0.6629 0.6417 \n vn -0.3857 -0.6629 0.6417 \n vn 0.6895 -0.4193 0.5906 \n vn -0.6895 -0.4193 0.5906 \n vn 0.6588 -0.3634 0.6588 \n vn -0.6588 -0.3634 0.6588 \n vn 0.5465 0.3707 0.7509 \n vn -0.5465 0.3707 0.7509 \n vn 0.5064 0.6464 0.5706 \n vn -0.5064 0.6464 0.5706 \n vn 0.6092 0.5167 0.6015 \n vn -0.6092 0.5167 0.6015 \n vn -0.0441 0.6610 0.7491 \n vn 0.0441 0.6610 0.7491 \n vn -0.7246 0.3187 0.6110 \n vn 0.7246 0.3187 0.6110 \n vn -0.5880 0.5554 0.5880 \n vn 0.5880 0.5554 0.5880 \n vn 0.5361 -0.3909 0.7482 \n vn -0.5361 -0.3909 0.7482 \n vn 0.2207 -0.4690 0.8552 \n vn -0.2207 -0.4690 0.8552 \n vn -0.0794 -0.5321 0.8429 \n vn 0.0794 -0.5321 0.8429 \n vn -0.0825 -0.6575 0.7490 \n vn 0.0825 -0.6575 0.7490 \n vn 0.0457 -0.5667 0.8226 \n vn -0.0457 -0.5667 0.8226 \n vn 0.2784 -0.2130 0.9365 \n vn -0.2784 -0.2130 0.9365 \n vn 0.3813 -0.1824 0.9063 \n vn -0.3813 -0.1824 0.9063 \n vn 0.3357 -0.2878 0.8969 \n vn -0.3357 -0.2878 0.8969 \n vn 0.3762 0.0603 0.9246 \n vn -0.3762 0.0603 0.9246 \n vn -0.1352 0.2680 0.9539 \n vn 0.1352 0.2680 0.9539 \n vn 0.3961 -0.4321 0.8102 \n vn -0.3961 -0.4321 0.8102 \n vn 0.1856 -0.2474 0.9510 \n vn -0.1856 -0.2474 0.9510 \n vn 0.0099 -0.1948 0.9808 \n vn -0.0099 -0.1948 0.9808 \n vn 0.0721 -0.6966 0.7138 \n vn -0.0721 -0.6966 0.7138 \n vn 0.1863 -0.5723 0.7986 \n vn -0.1863 -0.5723 0.7986 \n vn 0.3157 -0.2708 0.9094 \n vn -0.3157 -0.2708 0.9094 \n vn 0.3063 -0.0265 0.9516 \n vn -0.3063 -0.0265 0.9516 \n vn 0.3266 -0.1306 0.9361 \n vn -0.3266 -0.1306 0.9361 \n vn -0.0137 0.0574 0.9983 \n vn 0.0137 0.0574 0.9983 \n vn -0.0026 -0.0656 0.9978 \n vn 0.0026 -0.0656 0.9978 \n vn 0.0000 0.0000 1.0000 \n vn 0.8174 -0.5744 -0.0442 \n vn -0.8174 -0.5744 -0.0442 \n vn 0.9494 0.2297 -0.2144 \n vn -0.9494 0.2297 -0.2144 \n vn 0.0825 0.9073 -0.4124 \n vn -0.0825 0.9073 -0.4124 \n vn -0.8836 0.3555 0.3047 \n vn 0.8836 0.3555 0.3047 \n vn 0.4207 -0.8797 0.2218 \n vn -0.4207 -0.8797 0.2218 \n vn 0.2873 -0.5747 0.7663 \n vn -0.2873 -0.5747 0.7663 \n vn -0.6542 0.6019 0.4580 \n vn 0.6542 0.6019 0.4580 \n vn 0.1052 0.7892 0.6051 \n vn -0.1052 0.7892 0.6051 \n vn 0.7582 0.2916 0.5832 \n vn -0.7582 0.2916 0.5832 \n vn 0.3889 -0.7130 0.5834 \n vn -0.3889 -0.7130 0.5834 \n vn 0.0463 0.2314 0.9718 \n vn -0.0463 0.2314 0.9718 \n vn 0.0335 -0.4018 0.9151 \n vn -0.0335 -0.4018 0.9151 \n vn -0.4452 -0.1610 0.8809 \n vn 0.4452 -0.1610 0.8809 \n vn -0.2182 -0.4364 0.8729 \n vn 0.2182 -0.4364 0.8729 \n vn 0.4341 -0.1290 0.8916 \n vn -0.4341 -0.1290 0.8916 \n vn 0.3008 0.0501 0.9524 \n vn -0.3008 0.0501 0.9524 \n vn 0.8123 0.3010 0.4996 \n vn -0.8123 0.3010 0.4996 \n vn 0.8753 0.2574 0.4093 \n vn -0.8753 0.2574 0.4093 \n vn 0.9385 0.1601 0.3060 \n vn -0.9385 0.1601 0.3060 \n vn 0.2237 -0.6539 0.7227 \n vn -0.2237 -0.6539 0.7227 \n vn -0.1536 -0.1997 0.9677 \n vn 0.1536 -0.1997 0.9677 \n vn -0.2733 -0.1025 0.9565 \n vn 0.2733 -0.1025 0.9565 \n vn -0.0976 0.1952 0.9759 \n vn 0.0976 0.1952 0.9759 \n vn -0.1582 0.9494 0.2713 \n vn 0.1582 0.9494 0.2713 \n vn -0.6934 0.7082 0.1328 \n vn 0.6934 0.7082 0.1328 \n vn -1.0000 0.0000 0.0000 \n vn 1.0000 0.0000 0.0000 \n vn 0.3051 -0.9450 0.1181 \n vn -0.3051 -0.9450 0.1181 \n vn 0.0298 -0.2981 0.9541 \n vn -0.0298 -0.2981 0.9541 \n vn 0.1353 -0.3479 0.9277 \n vn -0.1353 -0.3479 0.9277 \n vn -0.5085 -0.2755 0.8158 \n vn 0.5085 -0.2755 0.8158 \n vn -0.3843 -0.0419 0.9223 \n vn 0.3843 -0.0419 0.9223 \n vn -0.2083 0.0374 0.9774 \n vn 0.2083 0.0374 0.9774 \n vn -0.5721 -0.4767 0.6674 \n vn 0.5721 -0.4767 0.6674 \n vn -0.1369 -0.7531 0.6435 \n vn 0.1369 -0.7531 0.6435 \n vn 0.4088 -0.6071 0.6814 \n vn -0.4088 -0.6071 0.6814 \n vn 0.5740 -0.4130 0.7070 \n vn -0.5740 -0.4130 0.7070 \n vn 0.5665 -0.0968 0.8183 \n vn -0.5665 -0.0968 0.8183 \n vn 0.5703 0.1180 0.8129 \n vn -0.5703 0.1180 0.8129 \n vn 0.4823 0.5621 0.6719 \n vn -0.4823 0.5621 0.6719 \n vn 0.2604 0.6114 0.7473 \n vn -0.2604 0.6114 0.7473 \n vn 0.1640 0.3607 0.9182 \n vn -0.1640 0.3607 0.9182 \n vn -0.0178 0.2495 0.9682 \n vn 0.0178 0.2495 0.9682 \n vn 0.3273 -0.4166 0.8481 \n vn -0.3273 -0.4166 0.8481 \n vn 0.2811 -0.2610 0.9235 \n vn -0.2811 -0.2610 0.9235 \n vn -0.2542 -0.6514 0.7149 \n vn 0.2542 -0.6514 0.7149 \n vn -0.0260 -0.8455 0.5333 \n vn 0.0260 -0.8455 0.5333 \n vn -0.3518 -0.2606 0.8991 \n vn 0.3518 -0.2606 0.8991 \n vn -0.3523 -0.0110 0.9358 \n vn 0.3523 -0.0110 0.9358 \n vn -0.1317 0.4608 0.8777 \n vn 0.1317 0.4608 0.8777 \n vn -0.0342 0.6159 0.7870 \n vn 0.0342 0.6159 0.7870 \n vn 0.3603 0.5836 0.7277 \n vn -0.3603 0.5836 0.7277 \n vn 0.4988 0.5300 0.6858 \n vn -0.4988 0.5300 0.6858 \n vn 0.6667 -0.3333 0.6667 \n vn -0.6667 -0.3333 0.6667 \n vn 0.8165 -0.0731 0.5727 \n vn -0.8165 -0.0731 0.5727 \n vn 0.7840 0.1161 0.6098 \n vn -0.7840 0.1161 0.6098 \n vn -0.5306 0.8111 -0.2461 \n vn 0.5306 0.8111 -0.2461 \n vn -0.8511 0.3695 -0.3730 \n vn 0.8511 0.3695 -0.3730 \n vn -0.2446 0.8675 -0.4331 \n vn 0.2446 0.8675 -0.4331 \n vn 0.5924 0.7465 -0.3030 \n vn -0.5924 0.7465 -0.3030 \n vn 0.3685 0.8758 -0.3118 \n vn -0.3685 0.8758 -0.3118 \n vn 0.2821 0.9151 -0.2880 \n vn -0.2821 0.9151 -0.2880 \n vn 0.8561 0.1340 -0.4991 \n vn -0.8561 0.1340 -0.4991 \n vn 0.5342 -0.7233 -0.4376 \n vn -0.5342 -0.7233 -0.4376 \n vn 0.3849 -0.8131 -0.4368 \n vn -0.3849 -0.8131 -0.4368 \n vn 0.2335 -0.5806 -0.7800 \n vn -0.2335 -0.5806 -0.7800 \n vn 0.2449 -0.0583 -0.9678 \n vn -0.2449 -0.0583 -0.9678 \n vn 0.1163 -0.4535 -0.8837 \n vn -0.1163 -0.4535 -0.8837 \n vn 0.1152 -0.9836 -0.1388 \n vn -0.1152 -0.9836 -0.1388 \n vn 0.1184 -0.9669 -0.2260 \n vn -0.1184 -0.9669 -0.2260 \n vn 0.9597 -0.0085 -0.2808 \n vn -0.9597 -0.0085 -0.2808 \n vn 0.9319 0.1629 -0.3242 \n vn -0.9319 0.1629 -0.3242 \n vn 0.1626 0.0207 -0.9865 \n vn -0.1626 0.0207 -0.9865 \n vn -0.0188 -0.2177 -0.9758 \n vn 0.0188 -0.2177 -0.9758 \n vn 0.7538 -0.2926 -0.5884 \n vn -0.7538 -0.2926 -0.5884 \n vn 0.9196 0.1379 -0.3678 \n vn -0.9196 0.1379 -0.3678 \n vn 0.9297 0.3127 -0.1944 \n vn -0.9297 0.3127 -0.1944 \n vn 0.9120 0.3376 -0.2329 \n vn -0.9120 0.3376 -0.2329 \n vn 0.9407 0.3338 -0.0607 \n vn -0.9407 0.3338 -0.0607 \n vn 0.1761 -0.8805 -0.4402 \n vn -0.1761 -0.8805 -0.4402 \n vn 0.3708 -0.4733 -0.7991 \n vn -0.3708 -0.4733 -0.7991 \n vn 0.3107 -0.8284 -0.4660 \n vn -0.3107 -0.8284 -0.4660 \n vn 0.2793 -0.9515 -0.1287 \n vn -0.2793 -0.9515 -0.1287 \n vn 0.3139 -0.9321 -0.1807 \n vn -0.3139 -0.9321 -0.1807 \n vn 0.9762 -0.2083 -0.0609 \n vn -0.9762 -0.2083 -0.0609 \n vn 0.8267 -0.5066 0.2447 \n vn -0.8267 -0.5066 0.2447 \n vn 0.3449 -0.1158 -0.9315 \n vn -0.3449 -0.1158 -0.9315 \n vn 0.1203 0.9644 0.2355 \n vn -0.1203 0.9644 0.2355 \n vn 0.1275 0.9744 -0.1851 \n vn -0.1275 0.9744 -0.1851 \n vn 0.3492 0.5947 -0.7241 \n vn -0.3492 0.5947 -0.7241 \n vn 0.4153 0.8981 -0.1449 \n vn -0.4153 0.8981 -0.1449 \n vn 0.1845 0.7036 0.6863 \n vn -0.1845 0.7036 0.6863 \n vn 0.6056 0.7794 0.1608 \n vn -0.6056 0.7794 0.1608 \n vn 0.7033 0.6806 -0.2053 \n vn -0.7033 0.6806 -0.2053 \n vn 0.6679 0.2007 -0.7166 \n vn -0.6679 0.2007 -0.7166 \n vn 0.4948 0.4342 -0.7528 \n vn -0.4948 0.4342 -0.7528 \n vn 0.6423 0.7459 -0.1761 \n vn -0.6423 0.7459 -0.1761 \n vn 0.7182 0.6788 0.1530 \n vn -0.7182 0.6788 0.1530 \n vn 0.7388 0.3972 0.5444 \n vn -0.7388 0.3972 0.5444 \n vn 0.3428 0.9261 -0.1579 \n vn -0.3428 0.9261 -0.1579 \n vn 0.2270 0.5740 0.7867 \n vn -0.2270 0.5740 0.7867 \n vn -0.1722 0.1046 -0.9795 \n vn 0.1722 0.1046 -0.9795 \n vn 0.0425 0.9150 0.4013 \n vn -0.0425 0.9150 0.4013 \n vn -0.1616 0.1847 0.9694 \n vn 0.1616 0.1847 0.9694 \n vn 0.9791 0.1973 0.0483 \n vn -0.9791 0.1973 0.0483 \n vn 0.9470 0.0918 0.3079 \n vn -0.9470 0.0918 0.3079 \n vn 0.9794 0.1905 -0.0661 \n vn -0.9794 0.1905 -0.0661 \n vn 0.9938 0.0312 -0.1070 \n vn -0.9938 0.0312 -0.1070 \n vn 0.7116 -0.7008 0.0501 \n vn -0.7116 -0.7008 0.0501 \n vn 0.3722 -0.9243 0.0847 \n vn -0.3722 -0.9243 0.0847 \n vn 0.4465 -0.8644 0.2310 \n vn -0.4465 -0.8644 0.2310 \n vn 0.6066 -0.7578 0.2405 \n vn -0.6066 -0.7578 0.2405 \n vn 0.7325 -0.6368 0.2407 \n vn -0.7325 -0.6368 0.2407 \n vn 0.2637 -0.4499 0.8533 \n vn -0.2637 -0.4499 0.8533 \n vn 0.5568 -0.3181 -0.7673 \n vn -0.5568 -0.3181 -0.7673 \n vn 0.5004 -0.2807 -0.8190 \n vn -0.5004 -0.2807 -0.8190 \n vn 0.3190 -0.8494 -0.4205 \n vn -0.3190 -0.8494 -0.4205 \n vn 0.7198 -0.6356 -0.2793 \n vn -0.7198 -0.6356 -0.2793 \n vn 0.4972 -0.4408 -0.7473 \n vn -0.4972 -0.4408 -0.7473 \n vn 0.3506 0.3807 0.8557 \n vn -0.3506 0.3807 0.8557 \n vn 0.4566 0.1715 0.8730 \n vn -0.4566 0.1715 0.8730 \n vn 0.2583 0.1055 0.9603 \n vn -0.2583 0.1055 0.9603 \n vn 0.2455 -0.0802 0.9661 \n vn -0.2455 -0.0802 0.9661 \n vn 0.4643 -0.0599 0.8837 \n vn -0.4643 -0.0599 0.8837 \n vn 0.6225 -0.3045 0.7210 \n vn -0.6225 -0.3045 0.7210 \n vn 0.4500 0.6590 0.6027 \n vn -0.4500 0.6590 0.6027 \n vn -0.2667 0.8309 0.4884 \n vn 0.2667 0.8309 0.4884 \n vn -0.8284 0.2291 0.5111 \n vn 0.8284 0.2291 0.5111 \n vn -0.5251 -0.3566 0.7727 \n vn 0.5251 -0.3566 0.7727 \n vn 0.4546 -0.5665 0.6873 \n vn -0.4546 -0.5665 0.6873 \n vn 0.6996 -0.4497 0.5552 \n vn -0.6996 -0.4497 0.5552 \n vn 0.7220 -0.6827 -0.1126 \n vn -0.7220 -0.6827 -0.1126 \n vn -0.1919 0.2860 0.9388 \n vn 0.1919 0.2860 0.9388 \n vn 0.9048 -0.3734 -0.2047 \n vn -0.9048 -0.3734 -0.2047 \n vn 0.1034 0.1551 0.9825 \n vn -0.1034 0.1551 0.9825 \n vn 0.0841 0.9318 0.3530 \n vn -0.0841 0.9318 0.3530 \n vn 0.6446 -0.0883 0.7594 \n vn -0.6446 -0.0883 0.7594 \n vn 0.4309 0.4740 0.7678 \n vn -0.4309 0.4740 0.7678 \n vn 0.8032 -0.4847 0.3462 \n vn -0.8032 -0.4847 0.3462 \n vn 0.5811 -0.4128 0.7014 \n vn -0.5811 -0.4128 0.7014 \n vn 0.5910 -0.4305 0.6822 \n vn -0.5910 -0.4305 0.6822 \n vn 0.9818 -0.1804 -0.0591 \n vn -0.9818 -0.1804 -0.0591 \n vn 0.9105 -0.3965 -0.1175 \n vn -0.9105 -0.3965 -0.1175 \n vn 0.9972 -0.0181 -0.0725 \n vn -0.9972 -0.0181 -0.0725 \n vn 0.7313 -0.6543 0.1925 \n vn -0.7313 -0.6543 0.1925 \n vn 0.7867 -0.6079 0.1073 \n vn -0.7867 -0.6079 0.1073 \n vn 0.7022 -0.7022 0.1170 \n vn -0.7022 -0.7022 0.1170 \n vn 0.1840 0.9816 -0.0511 \n vn -0.1840 0.9816 -0.0511 \n vn 0.9352 0.3301 0.1284 \n vn -0.9352 0.3301 0.1284 \n vn 0.6633 -0.7463 0.0553 \n vn -0.6633 -0.7463 0.0553 \n vn -0.0085 0.9970 0.0767 \n vn 0.0085 0.9970 0.0767 \n vn 0.6237 -0.7061 0.3354 \n vn -0.6237 -0.7061 0.3354 \n vn 0.2733 -0.8925 0.3587 \n vn -0.2733 -0.8925 0.3587 \n vn -0.8328 -0.5080 -0.2200 \n vn 0.8328 -0.5080 -0.2200 \n vn -0.8339 0.2377 -0.4981 \n vn 0.8339 0.2377 -0.4981 \n vn -0.5655 0.7847 -0.2539 \n vn 0.5655 0.7847 -0.2539 \n vn -0.0560 0.9962 0.0672 \n vn 0.0560 0.9962 0.0672 \n vn 0.1445 0.0222 0.9893 \n vn -0.1445 0.0222 0.9893 \n vn 0.3275 0.0645 0.9427 \n vn -0.3275 0.0645 0.9427 \n vn 0.3127 0.0232 0.9496 \n vn -0.3127 0.0232 0.9496 \n vn 0.1710 0.0274 0.9849 \n vn -0.1710 0.0274 0.9849 \n vn 0.3487 0.2849 0.8929 \n vn -0.3487 0.2849 0.8929 \n vn 0.4006 -0.0343 0.9156 \n vn -0.4006 -0.0343 0.9156 \n vn 0.2572 -0.0603 0.9645 \n vn -0.2572 -0.0603 0.9645 \n vn 0.0637 -0.0106 0.9979 \n vn -0.0637 -0.0106 0.9979 \n vn -0.3637 0.7039 0.6101 \n vn 0.3637 0.7039 0.6101 \n vn 0.6299 0.0355 0.7759 \n vn -0.6299 0.0355 0.7759 \n vn 0.4472 -0.2002 0.8717 \n vn -0.4472 -0.2002 0.8717 \n vn 0.5072 -0.2141 0.8348 \n vn -0.5072 -0.2141 0.8348 \n vn 0.5258 0.2619 0.8093 \n vn -0.5258 0.2619 0.8093 \n vn 0.2980 0.5802 0.7580 \n vn -0.2980 0.5802 0.7580 \n vn 0.0930 -0.9924 -0.0805 \n vn -0.0930 -0.9924 -0.0805 \n vn 0.5006 -0.8657 0.0080 \n vn -0.5006 -0.8657 0.0080 \n vn 0.9285 -0.2497 0.2748 \n vn -0.9285 -0.2497 0.2748 \n vn 0.8393 0.5424 -0.0378 \n vn -0.8393 0.5424 -0.0378 \n vn -0.2355 0.9367 -0.2589 \n vn 0.2355 0.9367 -0.2589 \n vn -0.4499 0.8838 -0.1285 \n vn 0.4499 0.8838 -0.1285 \n vn -0.5384 -0.0098 -0.8427 \n vn 0.5384 -0.0098 -0.8427 \n vn -0.1910 -0.0241 -0.9813 \n vn 0.1910 -0.0241 -0.9813 \n vn 0.4046 0.0266 -0.9141 \n vn -0.4046 0.0266 -0.9141 \n vn -0.7819 0.6231 0.0197 \n vn 0.7819 0.6231 0.0197 \n vn 0.5428 -0.2063 -0.8142 \n vn -0.5428 -0.2063 -0.8142 \n vn -0.2474 -0.9231 -0.2945 \n vn 0.2474 -0.9231 -0.2945 \n usemtl None \n s off \n f 47/1/1 1/2/1 3/3/1 45/4/1 \n f 4/5/2 2/6/2 48/7/2 46/8/2 \n f 45/4/3 3/3/3 5/9/3 43/10/3 \n f 6/11/4 4/5/4 46/8/4 44/12/4 \n f 3/3/5 9/13/5 7/14/5 5/9/5 \n f 8/15/6 10/16/6 4/5/6 6/11/6 \n f 1/2/7 11/17/7 9/13/7 3/3/7 \n f 10/16/8 12/18/8 2/6/8 4/5/8 \n f 11/17/9 13/19/9 15/20/9 9/13/9 \n f 16/21/10 14/22/10 12/18/10 10/16/10 \n f 9/13/11 15/20/11 17/23/11 7/14/11 \n f 18/24/12 16/21/12 10/16/12 8/15/12 \n f 15/20/13 21/25/13 19/26/13 17/23/13 \n f 20/27/14 22/28/14 16/21/14 18/24/14 \n f 13/19/15 23/29/15 21/25/15 15/20/15 \n f 22/28/16 24/30/16 14/22/16 16/21/16 \n f 23/29/17 25/31/17 27/32/17 21/25/17 \n f 28/33/18 26/34/18 24/30/18 22/28/18 \n f 21/25/19 27/32/19 29/35/19 19/26/19 \n f 30/36/20 28/33/20 22/28/20 20/27/20 \n f 27/32/21 33/37/21 31/38/21 29/35/21 \n f 32/39/22 34/40/22 28/33/22 30/36/22 \n f 25/31/23 35/41/23 33/37/23 27/32/23 \n f 34/40/24 36/42/24 26/34/24 28/33/24 \n f 35/41/25 37/43/25 39/44/25 33/37/25 \n f 40/45/26 38/46/26 36/42/26 34/40/26 \n f 33/37/27 39/44/27 41/47/27 31/38/27 \n f 42/48/28 40/45/28 34/40/28 32/39/28 \n f 39/44/29 45/4/29 43/10/29 41/47/29 \n f 44/12/30 46/8/30 40/45/30 42/48/30 \n f 37/43/31 47/1/31 45/4/31 39/44/31 \n f 46/8/32 48/7/32 38/46/32 40/45/32 \n f 47/1/33 37/43/33 51/49/33 49/50/33 \n f 52/51/34 38/46/34 48/7/34 50/52/34 \n f 37/43/35 35/41/35 53/53/35 51/49/35 \n f 54/54/36 36/42/36 38/46/36 52/51/36 \n f 35/41/37 25/31/37 55/55/37 53/53/37 \n f 56/56/38 26/34/38 36/42/38 54/54/38 \n f 25/31/39 23/29/39 57/57/39 55/55/39 \n f 58/58/40 24/30/40 26/34/40 56/56/40 \n f 23/29/41 13/19/41 59/59/41 57/57/41 \n f 60/60/42 14/22/42 24/30/42 58/58/42 \n f 13/19/43 11/17/43 63/61/43 59/59/43 \n f 64/62/44 12/18/44 14/22/44 60/60/44 \n f 11/17/45 1/2/45 65/63/45 63/61/45 \n f 66/64/46 2/6/46 12/18/46 64/62/46 \n f 1/2/47 47/1/47 49/50/47 65/63/47 \n f 50/52/48 48/7/48 2/6/48 66/64/48 \n f 61/65/49 65/63/49 49/50/49 \n f 50/52/50 66/64/50 62/66/50 \n f 63/61/51 65/63/51 61/65/51 \n f 62/66/52 66/64/52 64/62/52 \n f 61/65/53 59/59/53 63/61/53 \n f 64/62/54 60/60/54 62/66/54 \n f 61/65/55 57/57/55 59/59/55 \n f 60/60/56 58/58/56 62/66/56 \n f 61/65/57 55/55/57 57/57/57 \n f 58/58/58 56/56/58 62/66/58 \n f 61/65/59 53/53/59 55/55/59 \n f 56/56/60 54/54/60 62/66/60 \n f 61/65/61 51/49/61 53/53/61 \n f 54/54/62 52/51/62 62/66/62 \n f 61/65/63 49/50/63 51/49/63 \n f 52/51/64 50/52/64 62/66/64 \n f 89/67/65 174/68/65 176/69/65 91/70/65 \n f 176/69/66 175/71/66 90/72/66 91/70/66 \n f 87/73/67 172/74/67 174/68/67 89/67/67 \n f 175/71/68 173/75/68 88/76/68 90/72/68 \n f 85/77/69 170/78/69 172/74/69 87/73/69 \n f 173/75/70 171/79/70 86/80/70 88/76/70 \n f 83/81/71 168/82/71 170/78/71 85/77/71 \n f 171/79/72 169/83/72 84/84/72 86/80/72 \n f 81/85/73 166/86/73 168/82/73 83/81/73 \n f 169/83/74 167/87/74 82/88/74 84/84/74 \n f 79/89/75 92/90/75 146/91/75 164/92/75 \n f 147/93/76 93/94/76 80/95/76 165/96/76 \n f 92/90/77 94/97/77 148/98/77 146/91/77 \n f 149/99/78 95/100/78 93/94/78 147/93/78 \n f 94/97/79 96/101/79 150/102/79 148/98/79 \n f 151/103/80 97/104/80 95/100/80 149/99/80 \n f 96/101/81 98/105/81 152/106/81 150/102/81 \n f 153/107/82 99/108/82 97/104/82 151/103/82 \n f 98/105/83 100/109/83 154/110/83 152/106/83 \n f 155/111/84 101/112/84 99/108/84 153/107/84 \n f 100/109/85 102/113/85 156/114/85 154/110/85 \n f 157/115/86 103/116/86 101/112/86 155/111/86 \n f 102/113/87 104/117/87 158/118/87 156/114/87 \n f 159/119/88 105/120/88 103/116/88 157/115/88 \n f 104/117/89 106/121/89 160/122/89 158/118/89 \n f 161/123/90 107/124/90 105/120/90 159/119/90 \n f 106/121/91 108/125/91 162/126/91 160/122/91 \n f 163/127/92 109/128/92 107/124/92 161/123/92 \n f 108/125/93 67/129/93 68/130/93 162/126/93 \n f 68/130/94 67/129/94 109/128/94 163/127/94 \n f 110/131/95 128/132/95 160/122/95 162/126/95 \n f 161/123/96 129/133/96 111/134/96 163/127/96 \n f 128/132/97 179/135/97 158/118/97 160/122/97 \n f 159/119/98 180/136/98 129/133/98 161/123/98 \n f 126/137/99 156/114/99 158/118/99 179/135/99 \n f 159/119/100 157/115/100 127/138/100 180/136/100 \n f 124/139/101 154/110/101 156/114/101 126/137/101 \n f 157/115/102 155/111/102 125/140/102 127/138/102 \n f 122/141/103 152/106/103 154/110/103 124/139/103 \n f 155/111/104 153/107/104 123/142/104 125/140/104 \n f 120/143/105 150/102/105 152/106/105 122/141/105 \n f 153/107/106 151/103/106 121/144/106 123/142/106 \n f 118/145/107 148/98/107 150/102/107 120/143/107 \n f 151/103/108 149/99/108 119/146/108 121/144/108 \n f 116/147/109 146/91/109 148/98/109 118/145/109 \n f 149/99/110 147/93/110 117/148/110 119/146/110 \n f 114/149/111 164/92/111 146/91/111 116/147/111 \n f 147/93/112 165/96/112 115/150/112 117/148/112 \n f 114/149/113 181/151/113 177/152/113 164/92/113 \n f 177/152/114 182/153/114 115/150/114 165/96/114 \n f 110/131/115 162/126/115 68/130/115 112/154/115 \n f 68/130/116 163/127/116 111/134/116 113/155/116 \n f 112/154/117 68/130/117 178/156/117 183/157/117 \n f 178/156/118 68/130/118 113/155/118 184/158/118 \n f 177/152/119 181/151/119 183/157/119 178/156/119 \n f 184/158/120 182/153/120 177/152/120 178/156/120 \n f 135/159/121 137/160/121 176/69/121 174/68/121 \n f 176/69/122 137/160/122 136/161/122 175/71/122 \n f 133/162/123 135/159/123 174/68/123 172/74/123 \n f 175/71/124 136/161/124 134/163/124 173/75/124 \n f 131/164/125 133/162/125 172/74/125 170/78/125 \n f 173/75/126 134/163/126 132/165/126 171/79/126 \n f 166/86/127 187/166/127 185/167/127 168/82/127 \n f 186/168/128 188/169/128 167/87/128 169/83/128 \n f 131/164/129 170/78/129 168/82/129 185/167/129 \n f 169/83/130 171/79/130 132/165/130 186/168/130 \n f 144/170/131 190/171/131 189/172/131 187/166/131 \n f 189/172/132 190/171/132 145/173/132 188/169/132 \n f 185/167/133 187/166/133 189/172/133 69/174/133 \n f 189/172/134 188/169/134 186/168/134 69/174/134 \n f 130/175/135 131/164/135 185/167/135 69/174/135 \n f 186/168/135 132/165/135 130/175/135 69/174/135 \n f 142/176/136 193/177/136 191/178/136 144/170/136 \n f 192/179/137 194/180/137 143/181/137 145/173/137 \n f 140/182/138 195/183/138 193/177/138 142/176/138 \n f 194/180/139 196/184/139 141/185/139 143/181/139 \n f 139/186/140 197/187/140 195/183/140 140/182/140 \n f 196/184/141 198/188/141 139/186/141 141/185/141 \n f 138/189/142 71/190/142 197/187/142 139/186/142 \n f 198/188/143 71/190/143 138/189/143 139/186/143 \n f 190/171/144 144/170/144 191/178/144 70/191/144 \n f 192/179/145 145/173/145 190/171/145 70/191/145 \n f 70/191/146 191/178/146 206/192/146 208/193/146 \n f 207/194/147 192/179/147 70/191/147 208/193/147 \n f 71/190/148 199/195/148 200/196/148 197/187/148 \n f 201/197/149 199/195/149 71/190/149 198/188/149 \n f 197/187/150 200/196/150 202/198/150 195/183/150 \n f 203/199/151 201/197/151 198/188/151 196/184/151 \n f 195/183/152 202/198/152 204/200/152 193/177/152 \n f 205/201/153 203/199/153 196/184/153 194/180/153 \n f 193/177/154 204/200/154 206/192/154 191/178/154 \n f 207/194/155 205/201/155 194/180/155 192/179/155 \n f 199/195/156 204/200/156 202/198/156 200/196/156 \n f 203/199/157 205/201/157 199/195/157 201/197/157 \n f 199/195/158 208/193/158 206/192/158 204/200/158 \n f 207/194/159 208/193/159 199/195/159 205/201/159 \n f 139/186/160 140/182/160 164/92/160 177/152/160 \n f 165/96/161 141/185/161 139/186/161 177/152/161 \n f 140/182/162 142/176/162 211/202/162 164/92/162 \n f 212/203/163 143/181/163 141/185/163 165/96/163 \n f 142/176/164 144/170/164 213/204/164 211/202/164 \n f 214/205/165 145/173/165 143/181/165 212/203/165 \n f 144/170/166 187/166/166 166/86/166 213/204/166 \n f 167/87/167 188/169/167 145/173/167 214/205/167 \n f 81/85/168 209/206/168 213/204/168 166/86/168 \n f 214/205/169 210/207/169 82/88/169 167/87/169 \n f 209/206/170 215/208/170 211/202/170 213/204/170 \n f 212/203/171 216/209/171 210/207/171 214/205/171 \n f 79/89/172 164/92/172 211/202/172 215/208/172 \n f 212/203/173 165/96/173 80/95/173 216/209/173 \n f 131/164/174 130/175/174 72/210/174 222/211/174 \n f 72/210/175 130/175/175 132/165/175 223/212/175 \n f 133/162/176 131/164/176 222/211/176 220/213/176 \n f 223/212/177 132/165/177 134/163/177 221/214/177 \n f 135/159/178 133/162/178 220/213/178 218/215/178 \n f 221/214/179 134/163/179 136/161/179 219/216/179 \n f 137/160/180 135/159/180 218/215/180 217/217/180 \n f 219/216/181 136/161/181 137/160/181 217/217/181 \n f 217/217/182 218/215/182 229/218/182 231/219/182 \n f 230/220/183 219/216/183 217/217/183 231/219/183 \n f 218/215/184 220/213/184 227/221/184 229/218/184 \n f 228/222/185 221/214/185 219/216/185 230/220/185 \n f 220/213/186 222/211/186 225/223/186 227/221/186 \n f 226/224/187 223/212/187 221/214/187 228/222/187 \n f 222/211/188 72/210/188 224/225/188 225/223/188 \n f 224/225/189 72/210/189 223/212/189 226/224/189 \n f 224/225/190 231/219/190 229/218/190 225/223/190 \n f 230/220/191 231/219/191 224/225/191 226/224/191 \n f 225/223/192 229/218/192 227/221/192 \n f 228/222/193 230/220/193 226/224/193 \n f 183/157/194 181/151/194 234/226/194 232/227/194 \n f 235/228/195 182/153/195 184/158/195 233/229/195 \n f 112/154/196 183/157/196 232/227/196 254/230/196 \n f 233/229/197 184/158/197 113/155/197 255/231/197 \n f 110/131/198 112/154/198 254/230/198 256/232/198 \n f 255/231/199 113/155/199 111/134/199 257/233/199 \n f 181/151/200 114/149/200 252/234/200 234/226/200 \n f 253/235/201 115/150/201 182/153/201 235/228/201 \n f 114/149/202 116/147/202 250/236/202 252/234/202 \n f 251/237/203 117/148/203 115/150/203 253/235/203 \n f 116/147/204 118/145/204 248/238/204 250/236/204 \n f 249/239/205 119/146/205 117/148/205 251/237/205 \n f 118/145/206 120/143/206 246/240/206 248/238/206 \n f 247/241/207 121/144/207 119/146/207 249/239/207 \n f 120/143/208 122/141/208 244/242/208 246/240/208 \n f 245/243/209 123/142/209 121/144/209 247/241/209 \n f 122/141/210 124/139/210 242/244/210 244/242/210 \n f 243/245/211 125/140/211 123/142/211 245/243/211 \n f 124/139/212 126/137/212 240/246/212 242/244/212 \n f 241/247/213 127/138/213 125/140/213 243/245/213 \n f 126/137/214 179/135/214 236/248/214 240/246/214 \n f 237/249/215 180/136/215 127/138/215 241/247/215 \n f 179/135/216 128/132/216 238/250/216 236/248/216 \n f 239/251/217 129/133/217 180/136/217 237/249/217 \n f 128/132/218 110/131/218 256/232/218 238/250/218 \n f 257/233/219 111/134/219 129/133/219 239/251/219 \n f 238/250/220 256/232/220 258/252/220 276/253/220 \n f 259/254/221 257/233/221 239/251/221 277/255/221 \n f 236/248/222 238/250/222 276/253/222 278/256/222 \n f 277/255/223 239/251/223 237/249/223 279/257/223 \n f 240/246/224 236/248/224 278/256/224 274/258/224 \n f 279/257/225 237/249/225 241/247/225 275/259/225 \n f 242/244/226 240/246/226 274/258/226 272/260/226 \n f 275/259/227 241/247/227 243/245/227 273/261/227 \n f 244/242/228 242/244/228 272/260/228 270/262/228 \n f 273/261/229 243/245/229 245/243/229 271/263/229 \n f 246/240/230 244/242/230 270/262/230 268/264/230 \n f 271/263/231 245/243/231 247/241/231 269/265/231 \n f 248/238/232 246/240/232 268/264/232 266/266/232 \n f 269/265/233 247/241/233 249/239/233 267/267/233 \n f 250/236/234 248/238/234 266/266/234 264/268/234 \n f 267/267/235 249/239/235 251/237/235 265/269/235 \n f 252/234/236 250/236/236 264/268/236 262/270/236 \n f 265/269/237 251/237/237 253/235/237 263/271/237 \n f 234/226/238 252/234/238 262/270/238 280/272/238 \n f 263/271/239 253/235/239 235/228/239 281/273/239 \n f 256/232/240 254/230/240 260/274/240 258/252/240 \n f 261/275/241 255/231/241 257/233/241 259/254/241 \n f 254/230/242 232/227/242 282/276/242 260/274/242 \n f 283/277/243 233/229/243 255/231/243 261/275/243 \n f 232/227/244 234/226/244 280/272/244 282/276/244 \n f 281/273/245 235/228/245 233/229/245 283/277/245 \n f 67/129/246 108/125/246 284/278/246 73/279/246 \n f 285/280/247 109/128/247 67/129/247 73/279/247 \n f 108/125/248 106/121/248 286/281/248 284/278/248 \n f 287/282/249 107/124/249 109/128/249 285/280/249 \n f 106/121/250 104/117/250 288/283/250 286/281/250 \n f 289/284/251 105/120/251 107/124/251 287/282/251 \n f 104/117/252 102/113/252 290/285/252 288/283/252 \n f 291/286/253 103/116/253 105/120/253 289/284/253 \n f 102/113/254 100/109/254 292/287/254 290/285/254 \n f 293/288/255 101/112/255 103/116/255 291/286/255 \n f 100/109/256 98/105/256 294/289/256 292/287/256 \n f 295/290/257 99/108/257 101/112/257 293/288/257 \n f 98/105/258 96/101/258 296/291/258 294/289/258 \n f 297/292/259 97/104/259 99/108/259 295/290/259 \n f 96/101/260 94/97/260 298/293/260 296/291/260 \n f 299/294/261 95/100/261 97/104/261 297/292/261 \n f 94/97/262 92/90/262 300/295/262 298/293/262 \n f 301/296/263 93/94/263 95/100/263 299/294/263 \n f 308/297/264 309/298/264 328/299/264 338/300/264 \n f 329/301/265 309/302/265 308/303/265 339/304/265 \n f 307/305/266 308/297/266 338/300/266 336/306/266 \n f 339/304/267 308/303/267 307/307/267 337/308/267 \n f 306/309/268 307/305/268 336/306/268 340/310/268 \n f 337/308/269 307/307/269 306/309/269 341/311/269 \n f 89/67/270 91/70/270 306/309/270 340/310/270 \n f 306/309/271 91/70/271 90/72/271 341/311/271 \n f 87/73/272 89/67/272 340/310/272 334/312/272 \n f 341/311/273 90/72/273 88/76/273 335/313/273 \n f 85/77/274 87/73/274 334/312/274 330/314/274 \n f 335/313/275 88/76/275 86/80/275 331/315/275 \n f 83/81/276 85/77/276 330/314/276 332/316/276 \n f 331/315/277 86/80/277 84/84/277 333/317/277 \n f 330/314/278 336/306/278 338/300/278 332/316/278 \n f 339/304/279 337/308/279 331/315/279 333/317/279 \n f 330/314/280 334/312/280 340/310/280 336/306/280 \n f 341/311/281 335/313/281 331/315/281 337/308/281 \n f 326/318/282 332/316/282 338/300/282 328/299/282 \n f 339/304/283 333/317/283 327/319/283 329/301/283 \n f 81/85/284 83/81/284 332/316/284 326/318/284 \n f 333/317/285 84/84/285 82/88/285 327/319/285 \n f 209/206/286 342/320/286 344/321/286 215/208/286 \n f 345/322/287 343/323/287 210/207/287 216/209/287 \n f 81/85/288 326/318/288 342/320/288 209/206/288 \n f 343/323/289 327/319/289 82/88/289 210/207/289 \n f 79/89/290 215/208/290 344/321/290 346/324/290 \n f 345/322/291 216/209/291 80/95/291 347/325/291 \n f 79/89/292 346/324/292 300/295/292 92/90/292 \n f 301/296/293 347/325/293 80/95/293 93/94/293 \n f 77/326/294 324/327/294 352/328/294 304/329/294 \n f 353/330/295 325/331/295 77/332/295 304/333/295 \n f 304/329/296 352/328/296 350/334/296 78/335/296 \n f 351/336/297 353/330/297 304/333/297 78/337/297 \n f 78/335/298 350/334/298 348/338/298 305/339/298 \n f 349/340/299 351/336/299 78/337/299 305/341/299 \n f 305/339/300 348/338/300 328/299/300 309/298/300 \n f 329/301/301 349/340/301 305/341/301 309/302/301 \n f 326/318/302 328/299/302 348/338/302 342/320/302 \n f 349/340/303 329/301/303 327/319/303 343/323/303 \n f 296/291/304 298/293/304 318/342/304 310/343/304 \n f 319/344/305 299/294/305 297/292/305 311/345/305 \n f 76/346/306 316/347/306 324/327/306 77/326/306 \n f 325/331/307 317/348/307 76/349/307 77/332/307 \n f 302/350/308 358/351/308 356/352/308 303/353/308 \n f 357/354/309 359/355/309 302/356/309 303/357/309 \n f 303/353/310 356/352/310 354/358/310 75/359/310 \n f 355/360/311 357/354/311 303/357/311 75/361/311 \n f 75/359/312 354/358/312 316/347/312 76/346/312 \n f 317/348/313 355/360/313 75/361/313 76/349/313 \n f 292/362/314 294/289/314 362/363/314 364/364/314 \n f 363/365/315 295/290/315 293/366/315 365/367/315 \n f 364/364/316 362/363/316 368/368/316 366/369/316 \n f 369/370/317 363/365/317 365/367/317 367/371/317 \n f 366/369/318 368/368/318 370/372/318 372/373/318 \n f 371/374/319 369/370/319 367/371/319 373/375/319 \n f 372/373/320 370/372/320 376/376/320 374/377/320 \n f 377/378/321 371/374/321 373/375/321 375/379/321 \n f 314/380/322 378/381/322 374/377/322 376/376/322 \n f 375/379/323 379/382/323 315/383/323 377/378/323 \n f 316/347/324 354/358/324 374/377/324 378/381/324 \n f 375/379/325 355/360/325 317/348/325 379/382/325 \n f 354/358/326 356/352/326 372/373/326 374/377/326 \n f 373/375/327 357/354/327 355/360/327 375/379/327 \n f 356/352/328 358/351/328 366/369/328 372/373/328 \n f 367/371/329 359/355/329 357/354/329 373/375/329 \n f 358/351/330 360/384/330 364/364/330 366/369/330 \n f 365/367/331 361/385/331 359/355/331 367/371/331 \n f 290/386/332 292/362/332 364/364/332 360/384/332 \n f 365/367/333 293/366/333 291/387/333 361/385/333 \n f 74/388/334 360/384/334 358/351/334 302/350/334 \n f 359/355/335 361/385/335 74/389/335 302/356/335 \n f 284/390/336 286/391/336 288/392/336 290/386/336 \n f 289/393/337 287/394/337 285/395/337 291/387/337 \n f 284/390/338 290/386/338 360/384/338 74/388/338 \n f 361/385/339 291/387/339 285/395/339 74/389/339 \n f 73/396/340 284/390/340 74/388/340 \n f 74/389/341 285/395/341 73/397/341 \n f 294/289/342 296/291/342 310/343/342 362/363/342 \n f 311/345/343 297/292/343 295/290/343 363/365/343 \n f 310/343/344 312/398/344 368/368/344 362/363/344 \n f 369/370/345 313/399/345 311/345/345 363/365/345 \n f 312/398/346 382/400/346 370/372/346 368/368/346 \n f 371/374/347 383/401/347 313/399/347 369/370/347 \n f 314/380/348 376/376/348 370/372/348 382/400/348 \n f 371/374/349 377/378/349 315/383/349 383/401/349 \n f 348/338/350 350/334/350 386/402/350 384/403/350 \n f 387/404/351 351/336/351 349/340/351 385/405/351 \n f 318/342/352 384/403/352 386/402/352 320/406/352 \n f 387/404/353 385/405/353 319/344/353 321/407/353 \n f 298/293/354 300/295/354 384/403/354 318/342/354 \n f 385/405/355 301/296/355 299/294/355 319/344/355 \n f 300/295/356 344/321/356 342/320/356 384/403/356 \n f 343/323/357 345/322/357 301/296/357 385/405/357 \n f 342/320/358 348/338/358 384/403/358 \n f 385/405/359 349/340/359 343/323/359 \n f 300/295/360 346/324/360 344/321/360 \n f 345/322/361 347/325/361 301/296/361 \n f 314/380/362 322/408/362 380/409/362 378/381/362 \n f 381/410/363 323/411/363 315/383/363 379/382/363 \n f 316/347/364 378/381/364 380/409/364 324/327/364 \n f 381/410/365 379/382/365 317/348/365 325/331/365 \n f 320/406/366 386/402/366 380/409/366 322/408/366 \n f 381/410/367 387/404/367 321/407/367 323/411/367 \n f 350/334/368 352/328/368 380/409/368 386/402/368 \n f 381/410/369 353/330/369 351/336/369 387/404/369 \n f 324/327/370 380/409/370 352/328/370 \n f 353/330/371 381/410/371 325/331/371 \n f 400/412/372 388/413/372 414/414/372 402/415/372 \n f 415/416/373 389/417/373 401/418/373 403/419/373 \n f 400/412/374 402/415/374 404/420/374 398/421/374 \n f 405/422/375 403/419/375 401/418/375 399/423/375 \n f 398/421/376 404/420/376 406/424/376 396/425/376 \n f 407/426/377 405/422/377 399/423/377 397/427/377 \n f 396/425/378 406/424/378 408/428/378 394/429/378 \n f 409/430/379 407/426/379 397/427/379 395/431/379 \n f 394/429/380 408/428/380 410/432/380 392/433/380 \n f 411/434/381 409/430/381 395/431/381 393/435/381 \n f 392/433/382 410/432/382 412/436/382 390/437/382 \n f 413/438/383 411/434/383 393/435/383 391/439/383 \n f 410/432/384 420/440/384 418/441/384 412/436/384 \n f 419/442/385 421/443/385 411/434/385 413/438/385 \n f 408/428/386 422/444/386 420/440/386 410/432/386 \n f 421/443/387 423/445/387 409/430/387 411/434/387 \n f 406/424/388 424/446/388 422/444/388 408/428/388 \n f 423/445/389 425/447/389 407/426/389 409/430/389 \n f 404/420/390 426/448/390 424/446/390 406/424/390 \n f 425/447/391 427/449/391 405/422/391 407/426/391 \n f 402/415/392 428/450/392 426/448/392 404/420/392 \n f 427/449/393 429/451/393 403/419/393 405/422/393 \n f 402/415/394 414/414/394 416/452/394 428/450/394 \n f 417/453/395 415/416/395 403/419/395 429/451/395 \n f 318/342/396 320/406/396 444/454/396 442/455/396 \n f 445/456/397 321/407/397 319/344/397 443/457/397 \n f 320/458/398 390/437/398 412/436/398 444/459/398 \n f 413/438/399 391/439/399 321/460/399 445/461/399 \n f 310/343/400 318/342/400 442/455/400 312/398/400 \n f 443/457/401 319/344/401 311/345/401 313/399/401 \n f 382/462/402 430/463/402 414/414/402 388/413/402 \n f 415/416/403 431/464/403 383/465/403 389/417/403 \n f 412/436/404 418/441/404 440/466/404 444/459/404 \n f 441/467/405 419/442/405 413/438/405 445/461/405 \n f 438/468/406 446/469/406 444/459/406 440/466/406 \n f 445/461/407 447/470/407 439/471/407 441/467/407 \n f 434/472/408 446/469/408 438/468/408 436/473/408 \n f 439/471/409 447/470/409 435/474/409 437/475/409 \n f 432/476/410 448/477/410 446/469/410 434/472/410 \n f 447/470/411 449/478/411 433/479/411 435/474/411 \n f 430/463/412 448/477/412 432/476/412 450/480/412 \n f 433/479/413 449/478/413 431/464/413 451/481/413 \n f 414/414/414 430/463/414 450/480/414 416/452/414 \n f 451/481/415 431/464/415 415/416/415 417/453/415 \n f 312/398/416 448/482/416 430/483/416 382/400/416 \n f 431/484/417 449/485/417 313/399/417 383/401/417 \n f 312/398/418 442/455/418 446/486/418 448/482/418 \n f 447/487/419 443/457/419 313/399/419 449/485/419 \n f 442/455/420 444/454/420 446/486/420 \n f 447/487/421 445/456/421 443/457/421 \n f 416/452/422 450/480/422 452/488/422 476/489/422 \n f 453/490/423 451/481/423 417/453/423 477/491/423 \n f 450/480/424 432/476/424 462/492/424 452/488/424 \n f 463/493/425 433/479/425 451/481/425 453/490/425 \n f 432/476/426 434/472/426 460/494/426 462/492/426 \n f 461/495/427 435/474/427 433/479/427 463/493/427 \n f 434/472/428 436/473/428 458/496/428 460/494/428 \n f 459/497/429 437/475/429 435/474/429 461/495/429 \n f 436/473/430 438/468/430 456/498/430 458/496/430 \n f 457/499/431 439/471/431 437/475/431 459/497/431 \n f 438/468/432 440/466/432 454/500/432 456/498/432 \n f 455/501/433 441/467/433 439/471/433 457/499/433 \n f 440/466/434 418/441/434 474/502/434 454/500/434 \n f 475/503/435 419/442/435 441/467/435 455/501/435 \n f 428/450/436 416/452/436 476/489/436 464/504/436 \n f 477/491/437 417/453/437 429/451/437 465/505/437 \n f 426/448/438 428/450/438 464/504/438 466/506/438 \n f 465/505/439 429/451/439 427/449/439 467/507/439 \n f 424/446/440 426/448/440 466/506/440 468/508/440 \n f 467/507/441 427/449/441 425/447/441 469/509/441 \n f 422/444/442 424/446/442 468/508/442 470/510/442 \n f 469/509/443 425/447/443 423/445/443 471/511/443 \n f 420/440/444 422/444/444 470/510/444 472/512/444 \n f 471/511/445 423/445/445 421/443/445 473/513/445 \n f 418/441/446 420/440/446 472/512/446 474/502/446 \n f 473/513/447 421/443/447 419/442/447 475/503/447 \n f 458/496/448 456/498/448 480/514/448 478/515/448 \n f 481/516/449 457/499/449 459/497/449 479/517/449 \n f 478/515/450 480/514/450 482/518/450 484/519/450 \n f 483/520/451 481/516/451 479/517/451 485/521/451 \n f 484/519/452 482/518/452 488/522/452 486/523/452 \n f 489/524/453 483/520/453 485/521/453 487/525/453 \n f 486/523/454 488/522/454 490/526/454 492/527/454 \n f 491/528/455 489/524/455 487/525/455 493/529/455 \n f 464/504/456 476/489/456 486/523/456 492/527/456 \n f 487/525/457 477/491/457 465/505/457 493/529/457 \n f 452/488/458 484/519/458 486/523/458 476/489/458 \n f 487/525/459 485/521/459 453/490/459 477/491/459 \n f 452/488/460 462/492/460 478/515/460 484/519/460 \n f 479/517/461 463/493/461 453/490/461 485/521/461 \n f 458/496/462 478/515/462 462/492/462 460/494/462 \n f 463/493/463 479/517/463 459/497/463 461/495/463 \n f 454/500/464 474/502/464 480/514/464 456/498/464 \n f 481/516/465 475/503/465 455/501/465 457/499/465 \n f 472/512/466 482/518/466 480/514/466 474/502/466 \n f 481/516/467 483/520/467 473/513/467 475/503/467 \n f 470/510/468 488/522/468 482/518/468 472/512/468 \n f 483/520/469 489/524/469 471/511/469 473/513/469 \n f 468/508/470 490/526/470 488/522/470 470/510/470 \n f 489/524/471 491/528/471 469/509/471 471/511/471 \n f 466/506/472 492/527/472 490/526/472 468/508/472 \n f 491/528/473 493/529/473 467/507/473 469/509/473 \n f 464/504/474 492/527/474 466/506/474 \n f 467/507/475 493/529/475 465/505/475 \n f 392/433/476 390/437/476 504/530/476 502/531/476 \n f 505/532/477 391/439/477 393/435/477 503/533/477 \n f 394/429/478 392/433/478 502/531/478 500/534/478 \n f 503/533/479 393/435/479 395/431/479 501/535/479 \n f 396/425/480 394/429/480 500/534/480 498/536/480 \n f 501/535/481 395/431/481 397/427/481 499/537/481 \n f 398/538/482 396/425/482 498/536/482 496/539/482 \n f 499/537/483 397/427/483 399/540/483 497/541/483 \n f 400/542/484 398/538/484 496/539/484 494/543/484 \n f 497/541/485 399/540/485 401/544/485 495/545/485 \n f 388/546/486 400/542/486 494/543/486 506/547/486 \n f 495/545/487 401/544/487 389/548/487 507/549/487 \n f 494/543/488 502/531/488 504/530/488 506/547/488 \n f 505/532/489 503/533/489 495/545/489 507/549/489 \n f 494/543/490 496/539/490 500/534/490 502/531/490 \n f 501/535/491 497/541/491 495/545/491 503/533/491 \n f 496/539/492 498/536/492 500/534/492 \n f 501/535/493 499/537/493 497/541/493 \n f 314/380/494 382/400/494 388/550/494 506/551/494 \n f 389/548/495 383/552/495 315/553/495 507/549/495 \n f 314/554/496 506/547/496 504/530/496 322/555/496 \n f 505/532/497 507/549/497 315/553/497 323/556/497 \n f 320/458/498 322/555/498 504/530/498 390/437/498 \n f 505/532/499 323/556/499 321/460/499 391/439/499 \n ";


/***/ }),

/***/ "./src/rendering/gl/Drawable.ts":
/*!**************************************!*\
  !*** ./src/rendering/gl/Drawable.ts ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _globals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../globals */ "./src/globals.ts");

class Drawable {
    constructor() {
        this.count = 0;
        this.idxBound = false;
        this.posBound = false;
        this.norBound = false;
    }
    destory() {
        _globals__WEBPACK_IMPORTED_MODULE_0__.gl.deleteBuffer(this.bufIdx);
        _globals__WEBPACK_IMPORTED_MODULE_0__.gl.deleteBuffer(this.bufPos);
        _globals__WEBPACK_IMPORTED_MODULE_0__.gl.deleteBuffer(this.bufNor);
    }
    generateIdx() {
        this.idxBound = true;
        this.bufIdx = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.createBuffer();
    }
    generatePos() {
        this.posBound = true;
        this.bufPos = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.createBuffer();
    }
    generateNor() {
        this.norBound = true;
        this.bufNor = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.createBuffer();
    }
    bindIdx() {
        if (this.idxBound) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(_globals__WEBPACK_IMPORTED_MODULE_0__.gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        }
        return this.idxBound;
    }
    bindPos() {
        if (this.posBound) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(_globals__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, this.bufPos);
        }
        return this.posBound;
    }
    bindNor() {
        if (this.norBound) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.bindBuffer(_globals__WEBPACK_IMPORTED_MODULE_0__.gl.ARRAY_BUFFER, this.bufNor);
        }
        return this.norBound;
    }
    elemCount() {
        return this.count;
    }
    drawMode() {
        return _globals__WEBPACK_IMPORTED_MODULE_0__.gl.TRIANGLES;
    }
}
;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Drawable);


/***/ }),

/***/ "./src/rendering/gl/FrameBuffer.ts":
/*!*****************************************!*\
  !*** ./src/rendering/gl/FrameBuffer.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
class FrameBuffer {
    constructor(context, width, height, devicePixelRatio) {
        this.mp_context = context;
        this.m_frameBuffer = -1;
        this.m_outputTexture = -1;
        this.m_depthRenderBuffer = -1;
        this.m_width = width;
        this.m_height = height;
        this.m_devicePixelRatio = devicePixelRatio;
        this.m_created = false;
    }
    resize(width, height, devicePixelRatio) {
        this.m_width = width;
        this.m_height = height;
        this.m_devicePixelRatio = devicePixelRatio;
    }
    create() {
        // Initialize the frame buffers and render textures
        this.m_frameBuffer = this.mp_context.createFramebuffer();
        this.m_outputTexture = this.mp_context.createTexture();
        this.m_depthRenderBuffer = this.mp_context.createRenderbuffer();
        this.mp_context.bindFramebuffer(this.mp_context.FRAMEBUFFER, this.m_frameBuffer);
        // Bind our texture so that all functions that deal with textures will interact with this one
        this.mp_context.bindTexture(this.mp_context.TEXTURE_2D, this.m_outputTexture);
        // Give an empty image to OpenGL ( the last "0" )
        this.mp_context.texImage2D(this.mp_context.TEXTURE_2D, 0, this.mp_context.RGBA, this.m_width * this.m_devicePixelRatio, this.m_height * this.m_devicePixelRatio, 0, this.mp_context.RGBA, this.mp_context.UNSIGNED_BYTE, null);
        // Set the render settings for the texture we've just created.
        // Essentially zero filtering on the "texture" so it appears exactly as rendered
        this.mp_context.texParameteri(this.mp_context.TEXTURE_2D, this.mp_context.TEXTURE_MAG_FILTER, this.mp_context.NEAREST);
        this.mp_context.texParameteri(this.mp_context.TEXTURE_2D, this.mp_context.TEXTURE_MIN_FILTER, this.mp_context.NEAREST);
        // Clamp the colors at the edge of our texture
        this.mp_context.texParameteri(this.mp_context.TEXTURE_2D, this.mp_context.TEXTURE_WRAP_S, this.mp_context.CLAMP_TO_EDGE);
        this.mp_context.texParameteri(this.mp_context.TEXTURE_2D, this.mp_context.TEXTURE_WRAP_T, this.mp_context.CLAMP_TO_EDGE);
        // Initialize our depth buffer
        this.mp_context.bindRenderbuffer(this.mp_context.RENDERBUFFER, this.m_depthRenderBuffer);
        this.mp_context.renderbufferStorage(this.mp_context.RENDERBUFFER, this.mp_context.DEPTH_COMPONENT16, this.m_width * this.m_devicePixelRatio, this.m_height * this.m_devicePixelRatio);
        this.mp_context.framebufferRenderbuffer(this.mp_context.FRAMEBUFFER, this.mp_context.DEPTH_ATTACHMENT, this.mp_context.RENDERBUFFER, this.m_depthRenderBuffer);
        // Set this.m_renderedTexture as the color output of our frame buffer
        this.mp_context.framebufferTexture2D(this.mp_context.FRAMEBUFFER, this.mp_context.COLOR_ATTACHMENT0, this.mp_context.TEXTURE_2D, this.m_outputTexture, 0);
        // Sets the color output of the fragment shader to be stored in this.mp_context.COLOR_ATTACHMENT0,
        // which we previously set to this.m_renderedTexture
        this.mp_context.drawBuffers([this.mp_context.COLOR_ATTACHMENT0]); // "1" is the size of drawBuffers
        this.m_created = true;
        if (this.mp_context.checkFramebufferStatus(this.mp_context.FRAMEBUFFER) !=
            this.mp_context.FRAMEBUFFER_COMPLETE) {
            this.m_created = false;
            console.log("Frame buffer did not initialize correctly...");
        }
    }
    destroy() {
        if (this.m_created) {
            this.m_created = false;
            this.mp_context.deleteFramebuffer(this.m_frameBuffer);
            this.mp_context.deleteTexture(this.m_outputTexture);
            this.mp_context.deleteRenderbuffer(this.m_depthRenderBuffer);
        }
    }
    bindFrameBuffer() {
        this.mp_context.bindFramebuffer(this.mp_context.FRAMEBUFFER, this.m_frameBuffer);
    }
    bindToTextureSlot(slot) {
        this.m_textureSlot = slot;
        this.mp_context.activeTexture(this.mp_context.TEXTURE0 + slot);
        this.mp_context.bindTexture(this.mp_context.TEXTURE_2D, this.m_outputTexture);
    }
    getTextureSlot() {
        return this.m_textureSlot;
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (FrameBuffer);


/***/ }),

/***/ "./src/rendering/gl/OpenGLRenderer.ts":
/*!********************************************!*\
  !*** ./src/rendering/gl/OpenGLRenderer.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var _globals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../globals */ "./src/globals.ts");


// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
    }
    setClearColor(r, g, b, a) {
        _globals__WEBPACK_IMPORTED_MODULE_0__.gl.clearColor(r, g, b, a);
    }
    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
    clear() {
        _globals__WEBPACK_IMPORTED_MODULE_0__.gl.clear(_globals__WEBPACK_IMPORTED_MODULE_0__.gl.COLOR_BUFFER_BIT | _globals__WEBPACK_IMPORTED_MODULE_0__.gl.DEPTH_BUFFER_BIT);
    }
    render(camera, prog, shader, main_color, light_pos, drawables) {
        let model = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
        let viewProj = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
        gl_matrix__WEBPACK_IMPORTED_MODULE_1__.identity(model);
        gl_matrix__WEBPACK_IMPORTED_MODULE_1__.multiply(viewProj, camera.projectionMatrix, camera.viewMatrix);
        prog.setModelMatrix(model);
        prog.setViewProjMatrix(viewProj);
        prog.setCameraEye([camera.getEye()[0], camera.getEye()[1], camera.getEye()[2], 1.0]);
        prog.setShader(shader);
        prog.setGeometryColor(main_color);
        prog.setLightPos(light_pos);
        for (let drawable of drawables) {
            prog.draw(drawable);
        }
    }
}
;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (OpenGLRenderer);


/***/ }),

/***/ "./src/rendering/gl/ShaderProgram.ts":
/*!*******************************************!*\
  !*** ./src/rendering/gl/ShaderProgram.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Shader": () => (/* binding */ Shader),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var _globals__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../globals */ "./src/globals.ts");


var activeProgram = null;
class Shader {
    constructor(type, source) {
        this.shader = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.createShader(type);
        _globals__WEBPACK_IMPORTED_MODULE_0__.gl.shaderSource(this.shader, source);
        _globals__WEBPACK_IMPORTED_MODULE_0__.gl.compileShader(this.shader);
        if (!_globals__WEBPACK_IMPORTED_MODULE_0__.gl.getShaderParameter(this.shader, _globals__WEBPACK_IMPORTED_MODULE_0__.gl.COMPILE_STATUS)) {
            throw _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getShaderInfoLog(this.shader);
        }
    }
}
class ShaderProgram {
    constructor(shaders) {
        this.prog = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.createProgram();
        for (let shader of shaders) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.attachShader(this.prog, shader.shader);
        }
        _globals__WEBPACK_IMPORTED_MODULE_0__.gl.linkProgram(this.prog);
        if (!_globals__WEBPACK_IMPORTED_MODULE_0__.gl.getProgramParameter(this.prog, _globals__WEBPACK_IMPORTED_MODULE_0__.gl.LINK_STATUS)) {
            throw _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getProgramInfoLog(this.prog);
        }
        this.attrPos = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getAttribLocation(this.prog, "vs_Pos");
        this.attrNor = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getAttribLocation(this.prog, "vs_Nor");
        this.attrCol = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getAttribLocation(this.prog, "vs_Col");
        this.unifModel = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.prog, "u_Model");
        this.unifModelInvTr = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.prog, "u_ModelInvTr");
        this.unifViewProj = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.prog, "u_ViewProj");
        this.unifColor = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.prog, "u_Color");
        this.unifShader = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.prog, "u_Shader");
        this.unifCameraEye = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.prog, "u_CameraEye");
        this.unifLightPos = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.prog, "u_LightPos");
        this.unifTexture = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.prog, "u_Texture");
        this.unifTexture1 = _globals__WEBPACK_IMPORTED_MODULE_0__.gl.getUniformLocation(this.prog, "u_Texture1");
    }
    use() {
        if (activeProgram !== this.prog) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.useProgram(this.prog);
            activeProgram = this.prog;
        }
    }
    setModelMatrix(model) {
        this.use();
        if (this.unifModel !== -1) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(this.unifModel, false, model);
        }
        if (this.unifModelInvTr !== -1) {
            let modelinvtr = gl_matrix__WEBPACK_IMPORTED_MODULE_1__.create();
            gl_matrix__WEBPACK_IMPORTED_MODULE_1__.transpose(modelinvtr, model);
            gl_matrix__WEBPACK_IMPORTED_MODULE_1__.invert(modelinvtr, modelinvtr);
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
        }
    }
    setViewProjMatrix(vp) {
        this.use();
        if (this.unifViewProj !== -1) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.uniformMatrix4fv(this.unifViewProj, false, vp);
        }
    }
    setCameraEye(eye) {
        this.use();
        if (this.unifCameraEye !== -1) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.uniform4fv(this.unifCameraEye, eye);
        }
    }
    setGeometryColor(color) {
        this.use();
        if (this.unifColor !== -1) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.uniform4fv(this.unifColor, color);
        }
    }
    setLightPos(light_pos) {
        this.use();
        if (this.unifLightPos !== -1) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.uniform4fv(this.unifLightPos, light_pos);
        }
    }
    setShader(shader) {
        this.use();
        if (this.unifShader !== -1) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1i(this.unifShader, shader);
        }
    }
    setTexture(texture) {
        this.use();
        if ((this, this.unifTexture !== -1)) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.activeTexture(_globals__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE0);
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.bindTexture(_globals__WEBPACK_IMPORTED_MODULE_0__.gl.TEXTURE_2D, texture);
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1i(this.unifTexture, 0);
        }
    }
    setTexture1(textureNum) {
        this.use();
        if (this.unifTexture1 !== -1) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.uniform1i(this.unifTexture1, 1);
        }
    }
    draw(d) {
        this.use();
        if (this.attrPos != -1 && d.bindPos()) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(this.attrPos);
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(this.attrPos, 4, _globals__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, 0, 0);
        }
        if (this.attrNor != -1 && d.bindNor()) {
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.enableVertexAttribArray(this.attrNor);
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.vertexAttribPointer(this.attrNor, 4, _globals__WEBPACK_IMPORTED_MODULE_0__.gl.FLOAT, false, 0, 0);
        }
        d.bindIdx();
        _globals__WEBPACK_IMPORTED_MODULE_0__.gl.drawElements(d.drawMode(), d.elemCount(), _globals__WEBPACK_IMPORTED_MODULE_0__.gl.UNSIGNED_INT, 0);
        if (this.attrPos != -1)
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(this.attrPos);
        if (this.attrNor != -1)
            _globals__WEBPACK_IMPORTED_MODULE_0__.gl.disableVertexAttribArray(this.attrNor);
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ShaderProgram);


/***/ }),

/***/ "./node_modules/turntable-camera-controller/turntable.js":
/*!***************************************************************!*\
  !*** ./node_modules/turntable-camera-controller/turntable.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


module.exports = createTurntableController

var filterVector = __webpack_require__(/*! filtered-vector */ "./node_modules/filtered-vector/fvec.js")
var invert44     = __webpack_require__(/*! gl-mat4/invert */ "./node_modules/gl-mat4/invert.js")
var rotateM      = __webpack_require__(/*! gl-mat4/rotate */ "./node_modules/gl-mat4/rotate.js")
var cross        = __webpack_require__(/*! gl-vec3/cross */ "./node_modules/gl-vec3/cross.js")
var normalize3   = __webpack_require__(/*! gl-vec3/normalize */ "./node_modules/gl-vec3/normalize.js")
var dot3         = __webpack_require__(/*! gl-vec3/dot */ "./node_modules/gl-vec3/dot.js")

function len3(x, y, z) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2))
}

function clamp1(x) {
  return Math.min(1.0, Math.max(-1.0, x))
}

function findOrthoPair(v) {
  var vx = Math.abs(v[0])
  var vy = Math.abs(v[1])
  var vz = Math.abs(v[2])

  var u = [0,0,0]
  if(vx > Math.max(vy, vz)) {
    u[2] = 1
  } else if(vy > Math.max(vx, vz)) {
    u[0] = 1
  } else {
    u[1] = 1
  }

  var vv = 0
  var uv = 0
  for(var i=0; i<3; ++i ) {
    vv += v[i] * v[i]
    uv += u[i] * v[i]
  }
  for(var i=0; i<3; ++i) {
    u[i] -= (uv / vv) *  v[i]
  }
  normalize3(u, u)
  return u
}

function TurntableController(zoomMin, zoomMax, center, up, right, radius, theta, phi) {
  this.center = filterVector(center)
  this.up     = filterVector(up)
  this.right  = filterVector(right)
  this.radius = filterVector([radius])
  this.angle  = filterVector([theta, phi])
  this.angle.bounds = [[-Infinity,-Math.PI/2], [Infinity,Math.PI/2]]
  this.setDistanceLimits(zoomMin, zoomMax)

  this.computedCenter = this.center.curve(0)
  this.computedUp     = this.up.curve(0)
  this.computedRight  = this.right.curve(0)
  this.computedRadius = this.radius.curve(0)
  this.computedAngle  = this.angle.curve(0)
  this.computedToward = [0,0,0]
  this.computedEye    = [0,0,0]
  this.computedMatrix = new Array(16)
  for(var i=0; i<16; ++i) {
    this.computedMatrix[i] = 0.5
  }

  this.recalcMatrix(0)
}

var proto = TurntableController.prototype

proto.setDistanceLimits = function(minDist, maxDist) {
  if(minDist > 0) {
    minDist = Math.log(minDist)
  } else {
    minDist = -Infinity
  }
  if(maxDist > 0) {
    maxDist = Math.log(maxDist)
  } else {
    maxDist = Infinity
  }
  maxDist = Math.max(maxDist, minDist)
  this.radius.bounds[0][0] = minDist
  this.radius.bounds[1][0] = maxDist
}

proto.getDistanceLimits = function(out) {
  var bounds = this.radius.bounds[0]
  if(out) {
    out[0] = Math.exp(bounds[0][0])
    out[1] = Math.exp(bounds[1][0])
    return out
  }
  return [ Math.exp(bounds[0][0]), Math.exp(bounds[1][0]) ]
}

proto.recalcMatrix = function(t) {
  //Recompute curves
  this.center.curve(t)
  this.up.curve(t)
  this.right.curve(t)
  this.radius.curve(t)
  this.angle.curve(t)

  //Compute frame for camera matrix
  var up     = this.computedUp
  var right  = this.computedRight
  var uu = 0.0
  var ur = 0.0
  for(var i=0; i<3; ++i) {
    ur += up[i] * right[i]
    uu += up[i] * up[i]
  }
  var ul = Math.sqrt(uu)
  var rr = 0.0
  for(var i=0; i<3; ++i) {
    right[i] -= up[i] * ur / uu
    rr       += right[i] * right[i]
    up[i]    /= ul
  }
  var rl = Math.sqrt(rr)
  for(var i=0; i<3; ++i) {
    right[i] /= rl
  }

  //Compute toward vector
  var toward = this.computedToward
  cross(toward, up, right)
  normalize3(toward, toward)

  //Compute angular parameters
  var radius = Math.exp(this.computedRadius[0])
  var theta  = this.computedAngle[0]
  var phi    = this.computedAngle[1]

  var ctheta = Math.cos(theta)
  var stheta = Math.sin(theta)
  var cphi   = Math.cos(phi)
  var sphi   = Math.sin(phi)

  var center = this.computedCenter

  var wx = ctheta * cphi 
  var wy = stheta * cphi
  var wz = sphi

  var sx = -ctheta * sphi
  var sy = -stheta * sphi
  var sz = cphi

  var eye = this.computedEye
  var mat = this.computedMatrix
  for(var i=0; i<3; ++i) {
    var x      = wx * right[i] + wy * toward[i] + wz * up[i]
    mat[4*i+1] = sx * right[i] + sy * toward[i] + sz * up[i]
    mat[4*i+2] = x
    mat[4*i+3] = 0.0
  }

  var ax = mat[1]
  var ay = mat[5]
  var az = mat[9]
  var bx = mat[2]
  var by = mat[6]
  var bz = mat[10]
  var cx = ay * bz - az * by
  var cy = az * bx - ax * bz
  var cz = ax * by - ay * bx
  var cl = len3(cx, cy, cz)
  cx /= cl
  cy /= cl
  cz /= cl
  mat[0] = cx
  mat[4] = cy
  mat[8] = cz

  for(var i=0; i<3; ++i) {
    eye[i] = center[i] + mat[2+4*i]*radius
  }

  for(var i=0; i<3; ++i) {
    var rr = 0.0
    for(var j=0; j<3; ++j) {
      rr += mat[i+4*j] * eye[j]
    }
    mat[12+i] = -rr
  }
  mat[15] = 1.0
}

proto.getMatrix = function(t, result) {
  this.recalcMatrix(t)
  var mat = this.computedMatrix
  if(result) {
    for(var i=0; i<16; ++i) {
      result[i] = mat[i]
    }
    return result
  }
  return mat
}

var zAxis = [0,0,0]
proto.rotate = function(t, dtheta, dphi, droll) {
  this.angle.move(t, dtheta, dphi)
  if(droll) {
    this.recalcMatrix(t)

    var mat = this.computedMatrix
    zAxis[0] = mat[2]
    zAxis[1] = mat[6]
    zAxis[2] = mat[10]

    var up     = this.computedUp
    var right  = this.computedRight
    var toward = this.computedToward

    for(var i=0; i<3; ++i) {
      mat[4*i]   = up[i]
      mat[4*i+1] = right[i]
      mat[4*i+2] = toward[i]
    }
    rotateM(mat, mat, droll, zAxis)
    for(var i=0; i<3; ++i) {
      up[i] =    mat[4*i]
      right[i] = mat[4*i+1]
    }

    this.up.set(t, up[0], up[1], up[2])
    this.right.set(t, right[0], right[1], right[2])
  }
}

proto.pan = function(t, dx, dy, dz) {
  dx = dx || 0.0
  dy = dy || 0.0
  dz = dz || 0.0

  this.recalcMatrix(t)
  var mat = this.computedMatrix

  var dist = Math.exp(this.computedRadius[0])

  var ux = mat[1]
  var uy = mat[5]
  var uz = mat[9]
  var ul = len3(ux, uy, uz)
  ux /= ul
  uy /= ul
  uz /= ul

  var rx = mat[0]
  var ry = mat[4]
  var rz = mat[8]
  var ru = rx * ux + ry * uy + rz * uz
  rx -= ux * ru
  ry -= uy * ru
  rz -= uz * ru
  var rl = len3(rx, ry, rz)
  rx /= rl
  ry /= rl
  rz /= rl

  var vx = rx * dx + ux * dy
  var vy = ry * dx + uy * dy
  var vz = rz * dx + uz * dy
  this.center.move(t, vx, vy, vz)

  //Update z-component of radius
  var radius = Math.exp(this.computedRadius[0])
  radius = Math.max(1e-4, radius + dz)
  this.radius.set(t, Math.log(radius))
}

proto.translate = function(t, dx, dy, dz) {
  this.center.move(t,
    dx||0.0,
    dy||0.0,
    dz||0.0)
}

//Recenters the coordinate axes
proto.setMatrix = function(t, mat, axes, noSnap) {
  
  //Get the axes for tare
  var ushift = 1
  if(typeof axes === 'number') {
    ushift = (axes)|0
  } 
  if(ushift < 0 || ushift > 3) {
    ushift = 1
  }
  var vshift = (ushift + 2) % 3
  var fshift = (ushift + 1) % 3

  //Recompute state for new t value
  if(!mat) { 
    this.recalcMatrix(t)
    mat = this.computedMatrix
  }

  //Get right and up vectors
  var ux = mat[ushift]
  var uy = mat[ushift+4]
  var uz = mat[ushift+8]
  if(!noSnap) {
    var ul = len3(ux, uy, uz)
    ux /= ul
    uy /= ul
    uz /= ul
  } else {
    var ax = Math.abs(ux)
    var ay = Math.abs(uy)
    var az = Math.abs(uz)
    var am = Math.max(ax,ay,az)
    if(ax === am) {
      ux = (ux < 0) ? -1 : 1
      uy = uz = 0
    } else if(az === am) {
      uz = (uz < 0) ? -1 : 1
      ux = uy = 0
    } else {
      uy = (uy < 0) ? -1 : 1
      ux = uz = 0
    }
  }

  var rx = mat[vshift]
  var ry = mat[vshift+4]
  var rz = mat[vshift+8]
  var ru = rx * ux + ry * uy + rz * uz
  rx -= ux * ru
  ry -= uy * ru
  rz -= uz * ru
  var rl = len3(rx, ry, rz)
  rx /= rl
  ry /= rl
  rz /= rl
  
  var fx = uy * rz - uz * ry
  var fy = uz * rx - ux * rz
  var fz = ux * ry - uy * rx
  var fl = len3(fx, fy, fz)
  fx /= fl
  fy /= fl
  fz /= fl

  this.center.jump(t, ex, ey, ez)
  this.radius.idle(t)
  this.up.jump(t, ux, uy, uz)
  this.right.jump(t, rx, ry, rz)

  var phi, theta
  if(ushift === 2) {
    var cx = mat[1]
    var cy = mat[5]
    var cz = mat[9]
    var cr = cx * rx + cy * ry + cz * rz
    var cf = cx * fx + cy * fy + cz * fz
    if(tu < 0) {
      phi = -Math.PI/2
    } else {
      phi = Math.PI/2
    }
    theta = Math.atan2(cf, cr)
  } else {
    var tx = mat[2]
    var ty = mat[6]
    var tz = mat[10]
    var tu = tx * ux + ty * uy + tz * uz
    var tr = tx * rx + ty * ry + tz * rz
    var tf = tx * fx + ty * fy + tz * fz

    phi = Math.asin(clamp1(tu))
    theta = Math.atan2(tf, tr)
  }

  this.angle.jump(t, theta, phi)

  this.recalcMatrix(t)
  var dx = mat[2]
  var dy = mat[6]
  var dz = mat[10]

  var imat = this.computedMatrix
  invert44(imat, mat)
  var w  = imat[15]
  var ex = imat[12] / w
  var ey = imat[13] / w
  var ez = imat[14] / w

  var gs = Math.exp(this.computedRadius[0])
  this.center.jump(t, ex-dx*gs, ey-dy*gs, ez-dz*gs)
}

proto.lastT = function() {
  return Math.max(
    this.center.lastT(),
    this.up.lastT(),
    this.right.lastT(),
    this.radius.lastT(),
    this.angle.lastT())
}

proto.idle = function(t) {
  this.center.idle(t)
  this.up.idle(t)
  this.right.idle(t)
  this.radius.idle(t)
  this.angle.idle(t)
}

proto.flush = function(t) {
  this.center.flush(t)
  this.up.flush(t)
  this.right.flush(t)
  this.radius.flush(t)
  this.angle.flush(t)
}

proto.setDistance = function(t, d) {
  if(d > 0) {
    this.radius.set(t, Math.log(d))
  }
}

proto.lookAt = function(t, eye, center, up) {
  this.recalcMatrix(t)

  eye    = eye    || this.computedEye
  center = center || this.computedCenter
  up     = up     || this.computedUp

  var ux = up[0]
  var uy = up[1]
  var uz = up[2]
  var ul = len3(ux, uy, uz)
  if(ul < 1e-6) {
    return
  }
  ux /= ul
  uy /= ul
  uz /= ul

  var tx = eye[0] - center[0]
  var ty = eye[1] - center[1]
  var tz = eye[2] - center[2]
  var tl = len3(tx, ty, tz)
  if(tl < 1e-6) {
    return
  }
  tx /= tl
  ty /= tl
  tz /= tl

  var right = this.computedRight
  var rx = right[0]
  var ry = right[1]
  var rz = right[2]
  var ru = ux*rx + uy*ry + uz*rz
  rx -= ru * ux
  ry -= ru * uy
  rz -= ru * uz
  var rl = len3(rx, ry, rz)

  if(rl < 0.01) {
    rx = uy * tz - uz * ty
    ry = uz * tx - ux * tz
    rz = ux * ty - uy * tx
    rl = len3(rx, ry, rz)
    if(rl < 1e-6) {
      return
    }
  }
  rx /= rl
  ry /= rl
  rz /= rl

  this.up.set(t, ux, uy, uz)
  this.right.set(t, rx, ry, rz)
  this.center.set(t, center[0], center[1], center[2])
  this.radius.set(t, Math.log(tl))

  var fx = uy * rz - uz * ry
  var fy = uz * rx - ux * rz
  var fz = ux * ry - uy * rx
  var fl = len3(fx, fy, fz)
  fx /= fl
  fy /= fl
  fz /= fl

  var tu = ux*tx + uy*ty + uz*tz
  var tr = rx*tx + ry*ty + rz*tz
  var tf = fx*tx + fy*ty + fz*tz

  var phi   = Math.asin(clamp1(tu))
  var theta = Math.atan2(tf, tr)

  var angleState = this.angle._state
  var lastTheta  = angleState[angleState.length-1]
  var lastPhi    = angleState[angleState.length-2]
  lastTheta      = lastTheta % (2.0 * Math.PI)
  var dp = Math.abs(lastTheta + 2.0 * Math.PI - theta)
  var d0 = Math.abs(lastTheta - theta)
  var dn = Math.abs(lastTheta - 2.0 * Math.PI - theta)
  if(dp < d0) {
    lastTheta += 2.0 * Math.PI
  }
  if(dn < d0) {
    lastTheta -= 2.0 * Math.PI
  }

  this.angle.jump(this.angle.lastT(), lastTheta, lastPhi)
  this.angle.set(t, theta, phi)
}

function createTurntableController(options) {
  options = options || {}

  var center = options.center || [0,0,0]
  var up     = options.up     || [0,1,0]
  var right  = options.right  || findOrthoPair(up)
  var radius = options.radius || 1.0
  var theta  = options.theta  || 0.0
  var phi    = options.phi    || 0.0

  center = [].slice.call(center, 0, 3)

  up = [].slice.call(up, 0, 3)
  normalize3(up, up)

  right = [].slice.call(right, 0, 3)
  normalize3(right, right)

  if('eye' in options) {
    var eye = options.eye
    var toward = [
      eye[0]-center[0],
      eye[1]-center[1],
      eye[2]-center[2]
    ]
    cross(right, toward, up)
    if(len3(right[0], right[1], right[2]) < 1e-6) {
      right = findOrthoPair(up)
    } else {
      normalize3(right, right)
    }

    radius = len3(toward[0], toward[1], toward[2])

    var ut = dot3(up, toward) / radius
    var rt = dot3(right, toward) / radius
    phi    = Math.acos(ut)
    theta  = Math.acos(rt)
  }

  //Use logarithmic coordinates for radius
  radius = Math.log(radius)

  //Return the controller
  return new TurntableController(
    options.zoomMin,
    options.zoomMax,
    center,
    up,
    right,
    radius,
    theta,
    phi)
}

/***/ }),

/***/ "./node_modules/webgl-obj-loader/dist/webgl-obj-loader.min.js":
/*!********************************************************************!*\
  !*** ./node_modules/webgl-obj-loader/dist/webgl-obj-loader.min.js ***!
  \********************************************************************/
/***/ (function(module) {

!function(e,t){if(true)module.exports=t();else { var a, n; }}("undefined"!=typeof self?self:this,(function(){return function(e){var t={};function n(a){if(t[a])return t[a].exports;var s=t[a]={i:a,l:!1,exports:{}};return e[a].call(s.exports,s,s.exports,n),s.l=!0,s.exports}return n.m=e,n.c=t,n.d=function(e,t,a){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(n.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)n.d(a,s,function(t){return e[t]}.bind(null,s));return a},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="/",n(n.s=0)}({"./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! exports provided: OBJ, Attribute, DuplicateAttributeException, Layout, Material, MaterialLibrary, Mesh, TYPES, downloadModels, downloadMeshes, initMeshBuffers, deleteMeshBuffers, version */function(module,__webpack_exports__,__webpack_require__){"use strict";eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "OBJ", function() { return OBJ; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "version", function() { return version; });\n/* harmony import */ var _mesh__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mesh */ "./src/mesh.ts");\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Mesh", function() { return _mesh__WEBPACK_IMPORTED_MODULE_0__["default"]; });\n\n/* harmony import */ var _material__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./material */ "./src/material.ts");\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Material", function() { return _material__WEBPACK_IMPORTED_MODULE_1__["Material"]; });\n\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "MaterialLibrary", function() { return _material__WEBPACK_IMPORTED_MODULE_1__["MaterialLibrary"]; });\n\n/* harmony import */ var _layout__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./layout */ "./src/layout.ts");\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Attribute", function() { return _layout__WEBPACK_IMPORTED_MODULE_2__["Attribute"]; });\n\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "DuplicateAttributeException", function() { return _layout__WEBPACK_IMPORTED_MODULE_2__["DuplicateAttributeException"]; });\n\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Layout", function() { return _layout__WEBPACK_IMPORTED_MODULE_2__["Layout"]; });\n\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "TYPES", function() { return _layout__WEBPACK_IMPORTED_MODULE_2__["TYPES"]; });\n\n/* harmony import */ var _utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils */ "./src/utils.ts");\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "downloadModels", function() { return _utils__WEBPACK_IMPORTED_MODULE_3__["downloadModels"]; });\n\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "downloadMeshes", function() { return _utils__WEBPACK_IMPORTED_MODULE_3__["downloadMeshes"]; });\n\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "initMeshBuffers", function() { return _utils__WEBPACK_IMPORTED_MODULE_3__["initMeshBuffers"]; });\n\n/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "deleteMeshBuffers", function() { return _utils__WEBPACK_IMPORTED_MODULE_3__["deleteMeshBuffers"]; });\n\n\n\n\n\nconst version = "2.0.3";\nconst OBJ = {\n    Attribute: _layout__WEBPACK_IMPORTED_MODULE_2__["Attribute"],\n    DuplicateAttributeException: _layout__WEBPACK_IMPORTED_MODULE_2__["DuplicateAttributeException"],\n    Layout: _layout__WEBPACK_IMPORTED_MODULE_2__["Layout"],\n    Material: _material__WEBPACK_IMPORTED_MODULE_1__["Material"],\n    MaterialLibrary: _material__WEBPACK_IMPORTED_MODULE_1__["MaterialLibrary"],\n    Mesh: _mesh__WEBPACK_IMPORTED_MODULE_0__["default"],\n    TYPES: _layout__WEBPACK_IMPORTED_MODULE_2__["TYPES"],\n    downloadModels: _utils__WEBPACK_IMPORTED_MODULE_3__["downloadModels"],\n    downloadMeshes: _utils__WEBPACK_IMPORTED_MODULE_3__["downloadMeshes"],\n    initMeshBuffers: _utils__WEBPACK_IMPORTED_MODULE_3__["initMeshBuffers"],\n    deleteMeshBuffers: _utils__WEBPACK_IMPORTED_MODULE_3__["deleteMeshBuffers"],\n    version,\n};\n/**\n * @namespace\n */\n\n\n\n//# sourceURL=webpack:///./src/index.ts?')},"./src/layout.ts":
/*!***********************!*\
  !*** ./src/layout.ts ***!
  \***********************/
/*! exports provided: TYPES, DuplicateAttributeException, Attribute, Layout */function(module,__webpack_exports__,__webpack_require__){"use strict";eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "TYPES", function() { return TYPES; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DuplicateAttributeException", function() { return DuplicateAttributeException; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Attribute", function() { return Attribute; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Layout", function() { return Layout; });\nvar TYPES;\n(function (TYPES) {\n    TYPES["BYTE"] = "BYTE";\n    TYPES["UNSIGNED_BYTE"] = "UNSIGNED_BYTE";\n    TYPES["SHORT"] = "SHORT";\n    TYPES["UNSIGNED_SHORT"] = "UNSIGNED_SHORT";\n    TYPES["FLOAT"] = "FLOAT";\n})(TYPES || (TYPES = {}));\n/**\n * An exception for when two or more of the same attributes are found in the\n * same layout.\n * @private\n */\nclass DuplicateAttributeException extends Error {\n    /**\n     * Create a DuplicateAttributeException\n     * @param {Attribute} attribute - The attribute that was found more than\n     *        once in the {@link Layout}\n     */\n    constructor(attribute) {\n        super(`found duplicate attribute: ${attribute.key}`);\n    }\n}\n/**\n * Represents how a vertex attribute should be packed into an buffer.\n * @private\n */\nclass Attribute {\n    /**\n     * Create an attribute. Do not call this directly, use the predefined\n     * constants.\n     * @param {string} key - The name of this attribute as if it were a key in\n     *        an Object. Use the camel case version of the upper snake case\n     *        const name.\n     * @param {number} size - The number of components per vertex attribute.\n     *        Must be 1, 2, 3, or 4.\n     * @param {string} type - The data type of each component for this\n     *        attribute. Possible values:<br/>\n     *        "BYTE": signed 8-bit integer, with values in [-128, 127]<br/>\n     *        "SHORT": signed 16-bit integer, with values in\n     *            [-32768, 32767]<br/>\n     *        "UNSIGNED_BYTE": unsigned 8-bit integer, with values in\n     *            [0, 255]<br/>\n     *        "UNSIGNED_SHORT": unsigned 16-bit integer, with values in\n     *            [0, 65535]<br/>\n     *        "FLOAT": 32-bit floating point number\n     * @param {boolean} normalized - Whether integer data values should be\n     *        normalized when being casted to a float.<br/>\n     *        If true, signed integers are normalized to [-1, 1].<br/>\n     *        If true, unsigned integers are normalized to [0, 1].<br/>\n     *        For type "FLOAT", this parameter has no effect.\n     */\n    constructor(key, size, type, normalized = false) {\n        this.key = key;\n        this.size = size;\n        this.type = type;\n        this.normalized = normalized;\n        switch (type) {\n            case "BYTE":\n            case "UNSIGNED_BYTE":\n                this.sizeOfType = 1;\n                break;\n            case "SHORT":\n            case "UNSIGNED_SHORT":\n                this.sizeOfType = 2;\n                break;\n            case "FLOAT":\n                this.sizeOfType = 4;\n                break;\n            default:\n                throw new Error(`Unknown gl type: ${type}`);\n        }\n        this.sizeInBytes = this.sizeOfType * size;\n    }\n}\n/**\n * A class to represent the memory layout for a vertex attribute array. Used by\n * {@link Mesh}\'s TBD(...) method to generate a packed array from mesh data.\n * <p>\n * Layout can sort of be thought of as a C-style struct declaration.\n * {@link Mesh}\'s TBD(...) method will use the {@link Layout} instance to\n * pack an array in the given attribute order.\n * <p>\n * Layout also is very helpful when calling a WebGL context\'s\n * <code>vertexAttribPointer</code> method. If you\'ve created a buffer using\n * a Layout instance, then the same Layout instance can be used to determine\n * the size, type, normalized, stride, and offset parameters for\n * <code>vertexAttribPointer</code>.\n * <p>\n * For example:\n * <pre><code>\n *\n * const index = glctx.getAttribLocation(shaderProgram, "pos");\n * glctx.vertexAttribPointer(\n *   layout.position.size,\n *   glctx[layout.position.type],\n *   layout.position.normalized,\n *   layout.position.stride,\n *   layout.position.offset);\n * </code></pre>\n * @see {@link Mesh}\n */\nclass Layout {\n    /**\n     * Create a Layout object. This constructor will throw if any duplicate\n     * attributes are given.\n     * @param {Array} ...attributes - An ordered list of attributes that\n     *        describe the desired memory layout for each vertex attribute.\n     *        <p>\n     *\n     * @see {@link Mesh}\n     */\n    constructor(...attributes) {\n        this.attributes = attributes;\n        this.attributeMap = {};\n        let offset = 0;\n        let maxStrideMultiple = 0;\n        for (const attribute of attributes) {\n            if (this.attributeMap[attribute.key]) {\n                throw new DuplicateAttributeException(attribute);\n            }\n            // Add padding to satisfy WebGL\'s requirement that all\n            // vertexAttribPointer calls have an offset that is a multiple of\n            // the type size.\n            if (offset % attribute.sizeOfType !== 0) {\n                offset += attribute.sizeOfType - (offset % attribute.sizeOfType);\n                console.warn("Layout requires padding before " + attribute.key + " attribute");\n            }\n            this.attributeMap[attribute.key] = {\n                attribute: attribute,\n                size: attribute.size,\n                type: attribute.type,\n                normalized: attribute.normalized,\n                offset: offset,\n            };\n            offset += attribute.sizeInBytes;\n            maxStrideMultiple = Math.max(maxStrideMultiple, attribute.sizeOfType);\n        }\n        // Add padding to the end to satisfy WebGL\'s requirement that all\n        // vertexAttribPointer calls have a stride that is a multiple of the\n        // type size. Because we\'re putting differently sized attributes into\n        // the same buffer, it must be padded to a multiple of the largest\n        // type size.\n        if (offset % maxStrideMultiple !== 0) {\n            offset += maxStrideMultiple - (offset % maxStrideMultiple);\n            console.warn("Layout requires padding at the back");\n        }\n        this.stride = offset;\n        for (const attribute of attributes) {\n            this.attributeMap[attribute.key].stride = this.stride;\n        }\n    }\n}\n// Geometry attributes\n/**\n * Attribute layout to pack a vertex\'s x, y, & z as floats\n *\n * @see {@link Layout}\n */\nLayout.POSITION = new Attribute("position", 3, TYPES.FLOAT);\n/**\n * Attribute layout to pack a vertex\'s normal\'s x, y, & z as floats\n *\n * @see {@link Layout}\n */\nLayout.NORMAL = new Attribute("normal", 3, TYPES.FLOAT);\n/**\n * Attribute layout to pack a vertex\'s normal\'s x, y, & z as floats.\n * <p>\n * This value will be computed on-the-fly based on the texture coordinates.\n * If no texture coordinates are available, the generated value will default to\n * 0, 0, 0.\n *\n * @see {@link Layout}\n */\nLayout.TANGENT = new Attribute("tangent", 3, TYPES.FLOAT);\n/**\n * Attribute layout to pack a vertex\'s normal\'s bitangent x, y, & z as floats.\n * <p>\n * This value will be computed on-the-fly based on the texture coordinates.\n * If no texture coordinates are available, the generated value will default to\n * 0, 0, 0.\n * @see {@link Layout}\n */\nLayout.BITANGENT = new Attribute("bitangent", 3, TYPES.FLOAT);\n/**\n * Attribute layout to pack a vertex\'s texture coordinates\' u & v as floats\n *\n * @see {@link Layout}\n */\nLayout.UV = new Attribute("uv", 2, TYPES.FLOAT);\n// Material attributes\n/**\n * Attribute layout to pack an unsigned short to be interpreted as a the index\n * into a {@link Mesh}\'s materials list.\n * <p>\n * The intention of this value is to send all of the {@link Mesh}\'s materials\n * into multiple shader uniforms and then reference the current one by this\n * vertex attribute.\n * <p>\n * example glsl code:\n *\n * <pre><code>\n *  // this is bound using MATERIAL_INDEX\n *  attribute int materialIndex;\n *\n *  struct Material {\n *    vec3 diffuse;\n *    vec3 specular;\n *    vec3 specularExponent;\n *  };\n *\n *  uniform Material materials[MAX_MATERIALS];\n *\n *  // ...\n *\n *  vec3 diffuse = materials[materialIndex];\n *\n * </code></pre>\n * TODO: More description & test to make sure subscripting by attributes even\n * works for webgl\n *\n * @see {@link Layout}\n */\nLayout.MATERIAL_INDEX = new Attribute("materialIndex", 1, TYPES.SHORT);\nLayout.MATERIAL_ENABLED = new Attribute("materialEnabled", 1, TYPES.UNSIGNED_SHORT);\nLayout.AMBIENT = new Attribute("ambient", 3, TYPES.FLOAT);\nLayout.DIFFUSE = new Attribute("diffuse", 3, TYPES.FLOAT);\nLayout.SPECULAR = new Attribute("specular", 3, TYPES.FLOAT);\nLayout.SPECULAR_EXPONENT = new Attribute("specularExponent", 3, TYPES.FLOAT);\nLayout.EMISSIVE = new Attribute("emissive", 3, TYPES.FLOAT);\nLayout.TRANSMISSION_FILTER = new Attribute("transmissionFilter", 3, TYPES.FLOAT);\nLayout.DISSOLVE = new Attribute("dissolve", 1, TYPES.FLOAT);\nLayout.ILLUMINATION = new Attribute("illumination", 1, TYPES.UNSIGNED_SHORT);\nLayout.REFRACTION_INDEX = new Attribute("refractionIndex", 1, TYPES.FLOAT);\nLayout.SHARPNESS = new Attribute("sharpness", 1, TYPES.FLOAT);\nLayout.MAP_DIFFUSE = new Attribute("mapDiffuse", 1, TYPES.SHORT);\nLayout.MAP_AMBIENT = new Attribute("mapAmbient", 1, TYPES.SHORT);\nLayout.MAP_SPECULAR = new Attribute("mapSpecular", 1, TYPES.SHORT);\nLayout.MAP_SPECULAR_EXPONENT = new Attribute("mapSpecularExponent", 1, TYPES.SHORT);\nLayout.MAP_DISSOLVE = new Attribute("mapDissolve", 1, TYPES.SHORT);\nLayout.ANTI_ALIASING = new Attribute("antiAliasing", 1, TYPES.UNSIGNED_SHORT);\nLayout.MAP_BUMP = new Attribute("mapBump", 1, TYPES.SHORT);\nLayout.MAP_DISPLACEMENT = new Attribute("mapDisplacement", 1, TYPES.SHORT);\nLayout.MAP_DECAL = new Attribute("mapDecal", 1, TYPES.SHORT);\nLayout.MAP_EMISSIVE = new Attribute("mapEmissive", 1, TYPES.SHORT);\n\n\n//# sourceURL=webpack:///./src/layout.ts?')},"./src/material.ts":
/*!*************************!*\
  !*** ./src/material.ts ***!
  \*************************/
/*! exports provided: Material, MaterialLibrary */function(module,__webpack_exports__,__webpack_require__){"use strict";eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "Material", function() { return Material; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MaterialLibrary", function() { return MaterialLibrary; });\n/**\n * The Material class.\n */\nclass Material {\n    constructor(name) {\n        this.name = name;\n        /**\n         * Constructor\n         * @param {String} name the unique name of the material\n         */\n        // The values for the following attibutes\n        // are an array of R, G, B normalized values.\n        // Ka - Ambient Reflectivity\n        this.ambient = [0, 0, 0];\n        // Kd - Defuse Reflectivity\n        this.diffuse = [0, 0, 0];\n        // Ks\n        this.specular = [0, 0, 0];\n        // Ke\n        this.emissive = [0, 0, 0];\n        // Tf\n        this.transmissionFilter = [0, 0, 0];\n        // d\n        this.dissolve = 0;\n        // valid range is between 0 and 1000\n        this.specularExponent = 0;\n        // either d or Tr; valid values are normalized\n        this.transparency = 0;\n        // illum - the enum of the illumination model to use\n        this.illumination = 0;\n        // Ni - Set to "normal" (air).\n        this.refractionIndex = 1;\n        // sharpness\n        this.sharpness = 0;\n        // map_Kd\n        this.mapDiffuse = emptyTextureOptions();\n        // map_Ka\n        this.mapAmbient = emptyTextureOptions();\n        // map_Ks\n        this.mapSpecular = emptyTextureOptions();\n        // map_Ns\n        this.mapSpecularExponent = emptyTextureOptions();\n        // map_d\n        this.mapDissolve = emptyTextureOptions();\n        // map_aat\n        this.antiAliasing = false;\n        // map_bump or bump\n        this.mapBump = emptyTextureOptions();\n        // disp\n        this.mapDisplacement = emptyTextureOptions();\n        // decal\n        this.mapDecal = emptyTextureOptions();\n        // map_Ke\n        this.mapEmissive = emptyTextureOptions();\n        // refl - when the reflection type is a cube, there will be multiple refl\n        //        statements for each side of the cube. If it\'s a spherical\n        //        reflection, there should only ever be one.\n        this.mapReflections = [];\n    }\n}\nconst SENTINEL_MATERIAL = new Material("sentinel");\n/**\n * https://en.wikipedia.org/wiki/Wavefront_.obj_file\n * http://paulbourke.net/dataformats/mtl/\n */\nclass MaterialLibrary {\n    constructor(data) {\n        this.data = data;\n        /**\n         * Constructs the Material Parser\n         * @param mtlData the MTL file contents\n         */\n        this.currentMaterial = SENTINEL_MATERIAL;\n        this.materials = {};\n        this.parse();\n    }\n    /* eslint-disable camelcase */\n    /* the function names here disobey camelCase conventions\n     to make parsing/routing easier. see the parse function\n     documentation for more information. */\n    /**\n     * Creates a new Material object and adds to the registry.\n     * @param tokens the tokens associated with the directive\n     */\n    parse_newmtl(tokens) {\n        const name = tokens[0];\n        // console.info(\'Parsing new Material:\', name);\n        this.currentMaterial = new Material(name);\n        this.materials[name] = this.currentMaterial;\n    }\n    /**\n     * See the documenation for parse_Ka below for a better understanding.\n     *\n     * Given a list of possible color tokens, returns an array of R, G, and B\n     * color values.\n     *\n     * @param tokens the tokens associated with the directive\n     * @return {*} a 3 element array containing the R, G, and B values\n     * of the color.\n     */\n    parseColor(tokens) {\n        if (tokens[0] == "spectral") {\n            throw new Error("The MTL parser does not support spectral curve files. You will " +\n                "need to convert the MTL colors to either RGB or CIEXYZ.");\n        }\n        if (tokens[0] == "xyz") {\n            throw new Error("The MTL parser does not currently support XYZ colors. Either convert the " +\n                "XYZ values to RGB or create an issue to add support for XYZ");\n        }\n        // from my understanding of the spec, RGB values at this point\n        // will either be 3 floats or exactly 1 float, so that\'s the check\n        // that i\'m going to perform here\n        if (tokens.length == 3) {\n            const [x, y, z] = tokens;\n            return [parseFloat(x), parseFloat(y), parseFloat(z)];\n        }\n        // Since tokens at this point has a length of 3, we\'re going to assume\n        // it\'s exactly 1, skipping the check for 2.\n        const value = parseFloat(tokens[0]);\n        // in this case, all values are equivalent\n        return [value, value, value];\n    }\n    /**\n     * Parse the ambient reflectivity\n     *\n     * A Ka directive can take one of three forms:\n     *   - Ka r g b\n     *   - Ka spectral file.rfl\n     *   - Ka xyz x y z\n     * These three forms are mutually exclusive in that only one\n     * declaration can exist per material. It is considered a syntax\n     * error otherwise.\n     *\n     * The "Ka" form specifies the ambient reflectivity using RGB values.\n     * The "g" and "b" values are optional. If only the "r" value is\n     * specified, then the "g" and "b" values are assigned the value of\n     * "r". Values are normally in the range 0.0 to 1.0. Values outside\n     * of this range increase or decrease the reflectivity accordingly.\n     *\n     * The "Ka spectral" form specifies the ambient reflectivity using a\n     * spectral curve. "file.rfl" is the name of the ".rfl" file containing\n     * the curve data. "factor" is an optional argument which is a multiplier\n     * for the values in the .rfl file and defaults to 1.0 if not specified.\n     *\n     * The "Ka xyz" form specifies the ambient reflectivity using CIEXYZ values.\n     * "x y z" are the values of the CIEXYZ color space. The "y" and "z" arguments\n     * are optional and take on the value of the "x" component if only "x" is\n     * specified. The "x y z" values are normally in the range of 0.0 to 1.0 and\n     * increase or decrease ambient reflectivity accordingly outside of that\n     * range.\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_Ka(tokens) {\n        this.currentMaterial.ambient = this.parseColor(tokens);\n    }\n    /**\n     * Diffuse Reflectivity\n     *\n     * Similar to the Ka directive. Simply replace "Ka" with "Kd" and the rules\n     * are the same\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_Kd(tokens) {\n        this.currentMaterial.diffuse = this.parseColor(tokens);\n    }\n    /**\n     * Spectral Reflectivity\n     *\n     * Similar to the Ka directive. Simply replace "Ks" with "Kd" and the rules\n     * are the same\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_Ks(tokens) {\n        this.currentMaterial.specular = this.parseColor(tokens);\n    }\n    /**\n     * Emissive\n     *\n     * The amount and color of light emitted by the object.\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_Ke(tokens) {\n        this.currentMaterial.emissive = this.parseColor(tokens);\n    }\n    /**\n     * Transmission Filter\n     *\n     * Any light passing through the object is filtered by the transmission\n     * filter, which only allows specific colors to pass through. For example, Tf\n     * 0 1 0 allows all of the green to pass through and filters out all of the\n     * red and blue.\n     *\n     * Similar to the Ka directive. Simply replace "Ks" with "Tf" and the rules\n     * are the same\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_Tf(tokens) {\n        this.currentMaterial.transmissionFilter = this.parseColor(tokens);\n    }\n    /**\n     * Specifies the dissolve for the current material.\n     *\n     * Statement: d [-halo] `factor`\n     *\n     * Example: "d 0.5"\n     *\n     * The factor is the amount this material dissolves into the background. A\n     * factor of 1.0 is fully opaque. This is the default when a new material is\n     * created. A factor of 0.0 is fully dissolved (completely transparent).\n     *\n     * Unlike a real transparent material, the dissolve does not depend upon\n     * material thickness nor does it have any spectral character. Dissolve works\n     * on all illumination models.\n     *\n     * The dissolve statement allows for an optional "-halo" flag which indicates\n     * that a dissolve is dependent on the surface orientation relative to the\n     * viewer. For example, a sphere with the following dissolve, "d -halo 0.0",\n     * will be fully dissolved at its center and will appear gradually more opaque\n     * toward its edge.\n     *\n     * "factor" is the minimum amount of dissolve applied to the material. The\n     * amount of dissolve will vary between 1.0 (fully opaque) and the specified\n     * "factor". The formula is:\n     *\n     *    dissolve = 1.0 - (N*v)(1.0-factor)\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_d(tokens) {\n        // this ignores the -halo option as I can\'t find any documentation on what\n        // it\'s supposed to be.\n        this.currentMaterial.dissolve = parseFloat(tokens.pop() || "0");\n    }\n    /**\n     * The "illum" statement specifies the illumination model to use in the\n     * material. Illumination models are mathematical equations that represent\n     * various material lighting and shading effects.\n     *\n     * The illumination number can be a number from 0 to 10. The following are\n     * the list of illumination enumerations and their summaries:\n     * 0. Color on and Ambient off\n     * 1. Color on and Ambient on\n     * 2. Highlight on\n     * 3. Reflection on and Ray trace on\n     * 4. Transparency: Glass on, Reflection: Ray trace on\n     * 5. Reflection: Fresnel on and Ray trace on\n     * 6. Transparency: Refraction on, Reflection: Fresnel off and Ray trace on\n     * 7. Transparency: Refraction on, Reflection: Fresnel on and Ray trace on\n     * 8. Reflection on and Ray trace off\n     * 9. Transparency: Glass on, Reflection: Ray trace off\n     * 10. Casts shadows onto invisible surfaces\n     *\n     * Example: "illum 2" to specify the "Highlight on" model\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_illum(tokens) {\n        this.currentMaterial.illumination = parseInt(tokens[0]);\n    }\n    /**\n     * Optical Density (AKA Index of Refraction)\n     *\n     * Statement: Ni `index`\n     *\n     * Example: Ni 1.0\n     *\n     * Specifies the optical density for the surface. `index` is the value\n     * for the optical density. The values can range from 0.001 to 10.  A value of\n     * 1.0 means that light does not bend as it passes through an object.\n     * Increasing the optical_density increases the amount of bending. Glass has\n     * an index of refraction of about 1.5. Values of less than 1.0 produce\n     * bizarre results and are not recommended\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_Ni(tokens) {\n        this.currentMaterial.refractionIndex = parseFloat(tokens[0]);\n    }\n    /**\n     * Specifies the specular exponent for the current material. This defines the\n     * focus of the specular highlight.\n     *\n     * Statement: Ns `exponent`\n     *\n     * Example: "Ns 250"\n     *\n     * `exponent` is the value for the specular exponent. A high exponent results\n     * in a tight, concentrated highlight. Ns Values normally range from 0 to\n     * 1000.\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_Ns(tokens) {\n        this.currentMaterial.specularExponent = parseInt(tokens[0]);\n    }\n    /**\n     * Specifies the sharpness of the reflections from the local reflection map.\n     *\n     * Statement: sharpness `value`\n     *\n     * Example: "sharpness 100"\n     *\n     * If a material does not have a local reflection map defined in its material\n     * defintions, sharpness will apply to the global reflection map defined in\n     * PreView.\n     *\n     * `value` can be a number from 0 to 1000. The default is 60. A high value\n     * results in a clear reflection of objects in the reflection map.\n     *\n     * Tip: sharpness values greater than 100 introduce aliasing effects in\n     * flat surfaces that are viewed at a sharp angle.\n     *\n     * @param tokens the tokens associated with the directive\n     */\n    parse_sharpness(tokens) {\n        this.currentMaterial.sharpness = parseInt(tokens[0]);\n    }\n    /**\n     * Parses the -cc flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -cc flag\n     * @param options the Object of all image options\n     */\n    parse_cc(values, options) {\n        options.colorCorrection = values[0] == "on";\n    }\n    /**\n     * Parses the -blendu flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -blendu flag\n     * @param options the Object of all image options\n     */\n    parse_blendu(values, options) {\n        options.horizontalBlending = values[0] == "on";\n    }\n    /**\n     * Parses the -blendv flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -blendv flag\n     * @param options the Object of all image options\n     */\n    parse_blendv(values, options) {\n        options.verticalBlending = values[0] == "on";\n    }\n    /**\n     * Parses the -boost flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -boost flag\n     * @param options the Object of all image options\n     */\n    parse_boost(values, options) {\n        options.boostMipMapSharpness = parseFloat(values[0]);\n    }\n    /**\n     * Parses the -mm flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -mm flag\n     * @param options the Object of all image options\n     */\n    parse_mm(values, options) {\n        options.modifyTextureMap.brightness = parseFloat(values[0]);\n        options.modifyTextureMap.contrast = parseFloat(values[1]);\n    }\n    /**\n     * Parses and sets the -o, -s, and -t  u, v, and w values\n     *\n     * @param values the values passed to the -o, -s, -t flag\n     * @param {Object} option the Object of either the -o, -s, -t option\n     * @param {Integer} defaultValue the Object of all image options\n     */\n    parse_ost(values, option, defaultValue) {\n        while (values.length < 3) {\n            values.push(defaultValue.toString());\n        }\n        option.u = parseFloat(values[0]);\n        option.v = parseFloat(values[1]);\n        option.w = parseFloat(values[2]);\n    }\n    /**\n     * Parses the -o flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -o flag\n     * @param options the Object of all image options\n     */\n    parse_o(values, options) {\n        this.parse_ost(values, options.offset, 0);\n    }\n    /**\n     * Parses the -s flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -s flag\n     * @param options the Object of all image options\n     */\n    parse_s(values, options) {\n        this.parse_ost(values, options.scale, 1);\n    }\n    /**\n     * Parses the -t flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -t flag\n     * @param options the Object of all image options\n     */\n    parse_t(values, options) {\n        this.parse_ost(values, options.turbulence, 0);\n    }\n    /**\n     * Parses the -texres flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -texres flag\n     * @param options the Object of all image options\n     */\n    parse_texres(values, options) {\n        options.textureResolution = parseFloat(values[0]);\n    }\n    /**\n     * Parses the -clamp flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -clamp flag\n     * @param options the Object of all image options\n     */\n    parse_clamp(values, options) {\n        options.clamp = values[0] == "on";\n    }\n    /**\n     * Parses the -bm flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -bm flag\n     * @param options the Object of all image options\n     */\n    parse_bm(values, options) {\n        options.bumpMultiplier = parseFloat(values[0]);\n    }\n    /**\n     * Parses the -imfchan flag and updates the options object with the values.\n     *\n     * @param values the values passed to the -imfchan flag\n     * @param options the Object of all image options\n     */\n    parse_imfchan(values, options) {\n        options.imfChan = values[0];\n    }\n    /**\n     * This only exists for relection maps and denotes the type of reflection.\n     *\n     * @param values the values passed to the -type flag\n     * @param options the Object of all image options\n     */\n    parse_type(values, options) {\n        options.reflectionType = values[0];\n    }\n    /**\n     * Parses the texture\'s options and returns an options object with the info\n     *\n     * @param tokens all of the option tokens to pass to the texture\n     * @return {Object} a complete object of objects to apply to the texture\n     */\n    parseOptions(tokens) {\n        const options = emptyTextureOptions();\n        let option;\n        let values;\n        const optionsToValues = {};\n        tokens.reverse();\n        while (tokens.length) {\n            // token is guaranteed to exists here, hence the explicit "as"\n            const token = tokens.pop();\n            if (token.startsWith("-")) {\n                option = token.substr(1);\n                optionsToValues[option] = [];\n            }\n            else if (option) {\n                optionsToValues[option].push(token);\n            }\n        }\n        for (option in optionsToValues) {\n            if (!optionsToValues.hasOwnProperty(option)) {\n                continue;\n            }\n            values = optionsToValues[option];\n            const optionMethod = this[`parse_${option}`];\n            if (optionMethod) {\n                optionMethod.bind(this)(values, options);\n            }\n        }\n        return options;\n    }\n    /**\n     * Parses the given texture map line.\n     *\n     * @param tokens all of the tokens representing the texture\n     * @return a complete object of objects to apply to the texture\n     */\n    parseMap(tokens) {\n        // according to wikipedia:\n        // (https://en.wikipedia.org/wiki/Wavefront_.obj_file#Vendor_specific_alterations)\n        // there is at least one vendor that places the filename before the options\n        // rather than after (which is to spec). All options start with a \'-\'\n        // so if the first token doesn\'t start with a \'-\', we\'re going to assume\n        // it\'s the name of the map file.\n        let optionsString;\n        let filename = "";\n        if (!tokens[0].startsWith("-")) {\n            [filename, ...optionsString] = tokens;\n        }\n        else {\n            filename = tokens.pop();\n            optionsString = tokens;\n        }\n        const options = this.parseOptions(optionsString);\n        options.filename = filename.replace(/\\\\/g, "/");\n        return options;\n    }\n    /**\n     * Parses the ambient map.\n     *\n     * @param tokens list of tokens for the map_Ka direcive\n     */\n    parse_map_Ka(tokens) {\n        this.currentMaterial.mapAmbient = this.parseMap(tokens);\n    }\n    /**\n     * Parses the diffuse map.\n     *\n     * @param tokens list of tokens for the map_Kd direcive\n     */\n    parse_map_Kd(tokens) {\n        this.currentMaterial.mapDiffuse = this.parseMap(tokens);\n    }\n    /**\n     * Parses the specular map.\n     *\n     * @param tokens list of tokens for the map_Ks direcive\n     */\n    parse_map_Ks(tokens) {\n        this.currentMaterial.mapSpecular = this.parseMap(tokens);\n    }\n    /**\n     * Parses the emissive map.\n     *\n     * @param tokens list of tokens for the map_Ke direcive\n     */\n    parse_map_Ke(tokens) {\n        this.currentMaterial.mapEmissive = this.parseMap(tokens);\n    }\n    /**\n     * Parses the specular exponent map.\n     *\n     * @param tokens list of tokens for the map_Ns direcive\n     */\n    parse_map_Ns(tokens) {\n        this.currentMaterial.mapSpecularExponent = this.parseMap(tokens);\n    }\n    /**\n     * Parses the dissolve map.\n     *\n     * @param tokens list of tokens for the map_d direcive\n     */\n    parse_map_d(tokens) {\n        this.currentMaterial.mapDissolve = this.parseMap(tokens);\n    }\n    /**\n     * Parses the anti-aliasing option.\n     *\n     * @param tokens list of tokens for the map_aat direcive\n     */\n    parse_map_aat(tokens) {\n        this.currentMaterial.antiAliasing = tokens[0] == "on";\n    }\n    /**\n     * Parses the bump map.\n     *\n     * @param tokens list of tokens for the map_bump direcive\n     */\n    parse_map_bump(tokens) {\n        this.currentMaterial.mapBump = this.parseMap(tokens);\n    }\n    /**\n     * Parses the bump map.\n     *\n     * @param tokens list of tokens for the bump direcive\n     */\n    parse_bump(tokens) {\n        this.parse_map_bump(tokens);\n    }\n    /**\n     * Parses the disp map.\n     *\n     * @param tokens list of tokens for the disp direcive\n     */\n    parse_disp(tokens) {\n        this.currentMaterial.mapDisplacement = this.parseMap(tokens);\n    }\n    /**\n     * Parses the decal map.\n     *\n     * @param tokens list of tokens for the map_decal direcive\n     */\n    parse_decal(tokens) {\n        this.currentMaterial.mapDecal = this.parseMap(tokens);\n    }\n    /**\n     * Parses the refl map.\n     *\n     * @param tokens list of tokens for the refl direcive\n     */\n    parse_refl(tokens) {\n        this.currentMaterial.mapReflections.push(this.parseMap(tokens));\n    }\n    /**\n     * Parses the MTL file.\n     *\n     * Iterates line by line parsing each MTL directive.\n     *\n     * This function expects the first token in the line\n     * to be a valid MTL directive. That token is then used\n     * to try and run a method on this class. parse_[directive]\n     * E.g., the `newmtl` directive would try to call the method\n     * parse_newmtl. Each parsing function takes in the remaining\n     * list of tokens and updates the currentMaterial class with\n     * the attributes provided.\n     */\n    parse() {\n        const lines = this.data.split(/\\r?\\n/);\n        for (let line of lines) {\n            line = line.trim();\n            if (!line || line.startsWith("#")) {\n                continue;\n            }\n            const [directive, ...tokens] = line.split(/\\s/);\n            const parseMethod = this[`parse_${directive}`];\n            if (!parseMethod) {\n                console.warn(`Don\'t know how to parse the directive: "${directive}"`);\n                continue;\n            }\n            // console.log(`Parsing "${directive}" with tokens: ${tokens}`);\n            parseMethod.bind(this)(tokens);\n        }\n        // some cleanup. These don\'t need to be exposed as public data.\n        delete this.data;\n        this.currentMaterial = SENTINEL_MATERIAL;\n    }\n}\nfunction emptyTextureOptions() {\n    return {\n        colorCorrection: false,\n        horizontalBlending: true,\n        verticalBlending: true,\n        boostMipMapSharpness: 0,\n        modifyTextureMap: {\n            brightness: 0,\n            contrast: 1,\n        },\n        offset: { u: 0, v: 0, w: 0 },\n        scale: { u: 1, v: 1, w: 1 },\n        turbulence: { u: 0, v: 0, w: 0 },\n        clamp: false,\n        textureResolution: null,\n        bumpMultiplier: 1,\n        imfChan: null,\n        filename: "",\n    };\n}\n\n\n//# sourceURL=webpack:///./src/material.ts?')},"./src/mesh.ts":
/*!*********************!*\
  !*** ./src/mesh.ts ***!
  \*********************/
/*! exports provided: default */function(module,__webpack_exports__,__webpack_require__){"use strict";eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Mesh; });\n/* harmony import */ var _layout__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./layout */ "./src/layout.ts");\n\n/**\n * The main Mesh class. The constructor will parse through the OBJ file data\n * and collect the vertex, vertex normal, texture, and face information. This\n * information can then be used later on when creating your VBOs. See\n * OBJ.initMeshBuffers for an example of how to use the newly created Mesh\n */\nclass Mesh {\n    /**\n     * Create a Mesh\n     * @param {String} objectData - a string representation of an OBJ file with\n     *     newlines preserved.\n     * @param {Object} options - a JS object containing valid options. See class\n     *     documentation for options.\n     * @param {bool} options.enableWTextureCoord - Texture coordinates can have\n     *     an optional "w" coordinate after the u and v coordinates. This extra\n     *     value can be used in order to perform fancy transformations on the\n     *     textures themselves. Default is to truncate to only the u an v\n     *     coordinates. Passing true will provide a default value of 0 in the\n     *     event that any or all texture coordinates don\'t provide a w value.\n     *     Always use the textureStride attribute in order to determine the\n     *     stride length of the texture coordinates when rendering the element\n     *     array.\n     * @param {bool} options.calcTangentsAndBitangents - Calculate the tangents\n     *     and bitangents when loading of the OBJ is completed. This adds two new\n     *     attributes to the Mesh instance: `tangents` and `bitangents`.\n     */\n    constructor(objectData, options) {\n        this.name = "";\n        this.indicesPerMaterial = [];\n        this.materialsByIndex = {};\n        this.tangents = [];\n        this.bitangents = [];\n        options = options || {};\n        options.materials = options.materials || {};\n        options.enableWTextureCoord = !!options.enableWTextureCoord;\n        // the list of unique vertex, normal, texture, attributes\n        this.vertexNormals = [];\n        this.textures = [];\n        // the indicies to draw the faces\n        this.indices = [];\n        this.textureStride = options.enableWTextureCoord ? 3 : 2;\n        /*\n        The OBJ file format does a sort of compression when saving a model in a\n        program like Blender. There are at least 3 sections (4 including textures)\n        within the file. Each line in a section begins with the same string:\n          * \'v\': indicates vertex section\n          * \'vn\': indicates vertex normal section\n          * \'f\': indicates the faces section\n          * \'vt\': indicates vertex texture section (if textures were used on the model)\n        Each of the above sections (except for the faces section) is a list/set of\n        unique vertices.\n\n        Each line of the faces section contains a list of\n        (vertex, [texture], normal) groups.\n\n        **Note:** The following documentation will use a capital "V" Vertex to\n        denote the above (vertex, [texture], normal) groups whereas a lowercase\n        "v" vertex is used to denote an X, Y, Z coordinate.\n\n        Some examples:\n            // the texture index is optional, both formats are possible for models\n            // without a texture applied\n            f 1/25 18/46 12/31\n            f 1//25 18//46 12//31\n\n            // A 3 vertex face with texture indices\n            f 16/92/11 14/101/22 1/69/1\n\n            // A 4 vertex face\n            f 16/92/11 40/109/40 38/114/38 14/101/22\n\n        The first two lines are examples of a 3 vertex face without a texture applied.\n        The second is an example of a 3 vertex face with a texture applied.\n        The third is an example of a 4 vertex face. Note: a face can contain N\n        number of vertices.\n\n        Each number that appears in one of the groups is a 1-based index\n        corresponding to an item from the other sections (meaning that indexing\n        starts at one and *not* zero).\n\n        For example:\n            `f 16/92/11` is saying to\n              - take the 16th element from the [v] vertex array\n              - take the 92nd element from the [vt] texture array\n              - take the 11th element from the [vn] normal array\n            and together they make a unique vertex.\n        Using all 3+ unique Vertices from the face line will produce a polygon.\n\n        Now, you could just go through the OBJ file and create a new vertex for\n        each face line and WebGL will draw what appears to be the same model.\n        However, vertices will be overlapped and duplicated all over the place.\n\n        Consider a cube in 3D space centered about the origin and each side is\n        2 units long. The front face (with the positive Z-axis pointing towards\n        you) would have a Top Right vertex (looking orthogonal to its normal)\n        mapped at (1,1,1) The right face would have a Top Left vertex (looking\n        orthogonal to its normal) at (1,1,1) and the top face would have a Bottom\n        Right vertex (looking orthogonal to its normal) at (1,1,1). Each face\n        has a vertex at the same coordinates, however, three distinct vertices\n        will be drawn at the same spot.\n\n        To solve the issue of duplicate Vertices (the `(vertex, [texture], normal)`\n        groups), while iterating through the face lines, when a group is encountered\n        the whole group string (\'16/92/11\') is checked to see if it exists in the\n        packed.hashindices object, and if it doesn\'t, the indices it specifies\n        are used to look up each attribute in the corresponding attribute arrays\n        already created. The values are then copied to the corresponding unpacked\n        array (flattened to play nice with WebGL\'s ELEMENT_ARRAY_BUFFER indexing),\n        the group string is added to the hashindices set and the current unpacked\n        index is used as this hashindices value so that the group of elements can\n        be reused. The unpacked index is incremented. If the group string already\n        exists in the hashindices object, its corresponding value is the index of\n        that group and is appended to the unpacked indices array.\n       */\n        const verts = [];\n        const vertNormals = [];\n        const textures = [];\n        const materialNamesByIndex = [];\n        const materialIndicesByName = {};\n        // keep track of what material we\'ve seen last\n        let currentMaterialIndex = -1;\n        let currentObjectByMaterialIndex = 0;\n        // unpacking stuff\n        const unpacked = {\n            verts: [],\n            norms: [],\n            textures: [],\n            hashindices: {},\n            indices: [[]],\n            materialIndices: [],\n            index: 0,\n        };\n        const VERTEX_RE = /^v\\s/;\n        const NORMAL_RE = /^vn\\s/;\n        const TEXTURE_RE = /^vt\\s/;\n        const FACE_RE = /^f\\s/;\n        const WHITESPACE_RE = /\\s+/;\n        const USE_MATERIAL_RE = /^usemtl/;\n        // array of lines separated by the newline\n        const lines = objectData.split("\\n");\n        for (let line of lines) {\n            line = line.trim();\n            if (!line || line.startsWith("#")) {\n                continue;\n            }\n            const elements = line.split(WHITESPACE_RE);\n            elements.shift();\n            if (VERTEX_RE.test(line)) {\n                // if this is a vertex\n                verts.push(...elements);\n            }\n            else if (NORMAL_RE.test(line)) {\n                // if this is a vertex normal\n                vertNormals.push(...elements);\n            }\n            else if (TEXTURE_RE.test(line)) {\n                let coords = elements;\n                // by default, the loader will only look at the U and V\n                // coordinates of the vt declaration. So, this truncates the\n                // elements to only those 2 values. If W texture coordinate\n                // support is enabled, then the texture coordinate is\n                // expected to have three values in it.\n                if (elements.length > 2 && !options.enableWTextureCoord) {\n                    coords = elements.slice(0, 2);\n                }\n                else if (elements.length === 2 && options.enableWTextureCoord) {\n                    // If for some reason W texture coordinate support is enabled\n                    // and only the U and V coordinates are given, then we supply\n                    // the default value of 0 so that the stride length is correct\n                    // when the textures are unpacked below.\n                    coords.push("0");\n                }\n                textures.push(...coords);\n            }\n            else if (USE_MATERIAL_RE.test(line)) {\n                const materialName = elements[0];\n                // check to see if we\'ve ever seen it before\n                if (!(materialName in materialIndicesByName)) {\n                    // new material we\'ve never seen\n                    materialNamesByIndex.push(materialName);\n                    materialIndicesByName[materialName] = materialNamesByIndex.length - 1;\n                    // push new array into indices\n                    // already contains an array at index zero, don\'t add\n                    if (materialIndicesByName[materialName] > 0) {\n                        unpacked.indices.push([]);\n                    }\n                }\n                // keep track of the current material index\n                currentMaterialIndex = materialIndicesByName[materialName];\n                // update current index array\n                currentObjectByMaterialIndex = currentMaterialIndex;\n            }\n            else if (FACE_RE.test(line)) {\n                // if this is a face\n                /*\n                split this face into an array of Vertex groups\n                for example:\n                   f 16/92/11 14/101/22 1/69/1\n                becomes:\n                  [\'16/92/11\', \'14/101/22\', \'1/69/1\'];\n                */\n                const triangles = triangulate(elements);\n                for (const triangle of triangles) {\n                    for (let j = 0, eleLen = triangle.length; j < eleLen; j++) {\n                        const hash = triangle[j] + "," + currentMaterialIndex;\n                        if (hash in unpacked.hashindices) {\n                            unpacked.indices[currentObjectByMaterialIndex].push(unpacked.hashindices[hash]);\n                        }\n                        else {\n                            /*\n                        Each element of the face line array is a Vertex which has its\n                        attributes delimited by a forward slash. This will separate\n                        each attribute into another array:\n                            \'19/92/11\'\n                        becomes:\n                            Vertex = [\'19\', \'92\', \'11\'];\n                        where\n                            Vertex[0] is the vertex index\n                            Vertex[1] is the texture index\n                            Vertex[2] is the normal index\n                         Think of faces having Vertices which are comprised of the\n                         attributes location (v), texture (vt), and normal (vn).\n                         */\n                            const vertex = triangle[j].split("/");\n                            // it\'s possible for faces to only specify the vertex\n                            // and the normal. In this case, vertex will only have\n                            // a length of 2 and not 3 and the normal will be the\n                            // second item in the list with an index of 1.\n                            const normalIndex = vertex.length - 1;\n                            /*\n                         The verts, textures, and vertNormals arrays each contain a\n                         flattend array of coordinates.\n\n                         Because it gets confusing by referring to Vertex and then\n                         vertex (both are different in my descriptions) I will explain\n                         what\'s going on using the vertexNormals array:\n\n                         vertex[2] will contain the one-based index of the vertexNormals\n                         section (vn). One is subtracted from this index number to play\n                         nice with javascript\'s zero-based array indexing.\n\n                         Because vertexNormal is a flattened array of x, y, z values,\n                         simple pointer arithmetic is used to skip to the start of the\n                         vertexNormal, then the offset is added to get the correct\n                         component: +0 is x, +1 is y, +2 is z.\n\n                         This same process is repeated for verts and textures.\n                         */\n                            // Vertex position\n                            unpacked.verts.push(+verts[(+vertex[0] - 1) * 3 + 0]);\n                            unpacked.verts.push(+verts[(+vertex[0] - 1) * 3 + 1]);\n                            unpacked.verts.push(+verts[(+vertex[0] - 1) * 3 + 2]);\n                            // Vertex textures\n                            if (textures.length) {\n                                const stride = options.enableWTextureCoord ? 3 : 2;\n                                unpacked.textures.push(+textures[(+vertex[1] - 1) * stride + 0]);\n                                unpacked.textures.push(+textures[(+vertex[1] - 1) * stride + 1]);\n                                if (options.enableWTextureCoord) {\n                                    unpacked.textures.push(+textures[(+vertex[1] - 1) * stride + 2]);\n                                }\n                            }\n                            // Vertex normals\n                            unpacked.norms.push(+vertNormals[(+vertex[normalIndex] - 1) * 3 + 0]);\n                            unpacked.norms.push(+vertNormals[(+vertex[normalIndex] - 1) * 3 + 1]);\n                            unpacked.norms.push(+vertNormals[(+vertex[normalIndex] - 1) * 3 + 2]);\n                            // Vertex material indices\n                            unpacked.materialIndices.push(currentMaterialIndex);\n                            // add the newly created Vertex to the list of indices\n                            unpacked.hashindices[hash] = unpacked.index;\n                            unpacked.indices[currentObjectByMaterialIndex].push(unpacked.hashindices[hash]);\n                            // increment the counter\n                            unpacked.index += 1;\n                        }\n                    }\n                }\n            }\n        }\n        this.vertices = unpacked.verts;\n        this.vertexNormals = unpacked.norms;\n        this.textures = unpacked.textures;\n        this.vertexMaterialIndices = unpacked.materialIndices;\n        this.indices = unpacked.indices[currentObjectByMaterialIndex];\n        this.indicesPerMaterial = unpacked.indices;\n        this.materialNames = materialNamesByIndex;\n        this.materialIndices = materialIndicesByName;\n        this.materialsByIndex = {};\n        if (options.calcTangentsAndBitangents) {\n            this.calculateTangentsAndBitangents();\n        }\n    }\n    /**\n     * Calculates the tangents and bitangents of the mesh that forms an orthogonal basis together with the\n     * normal in the direction of the texture coordinates. These are useful for setting up the TBN matrix\n     * when distorting the normals through normal maps.\n     * Method derived from: http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-13-normal-mapping/\n     *\n     * This method requires the normals and texture coordinates to be parsed and set up correctly.\n     * Adds the tangents and bitangents as members of the class instance.\n     */\n    calculateTangentsAndBitangents() {\n        console.assert(!!(this.vertices &&\n            this.vertices.length &&\n            this.vertexNormals &&\n            this.vertexNormals.length &&\n            this.textures &&\n            this.textures.length), "Missing attributes for calculating tangents and bitangents");\n        const unpacked = {\n            tangents: [...new Array(this.vertices.length)].map(_ => 0),\n            bitangents: [...new Array(this.vertices.length)].map(_ => 0),\n        };\n        // Loop through all faces in the whole mesh\n        const indices = this.indices;\n        const vertices = this.vertices;\n        const normals = this.vertexNormals;\n        const uvs = this.textures;\n        for (let i = 0; i < indices.length; i += 3) {\n            const i0 = indices[i + 0];\n            const i1 = indices[i + 1];\n            const i2 = indices[i + 2];\n            const x_v0 = vertices[i0 * 3 + 0];\n            const y_v0 = vertices[i0 * 3 + 1];\n            const z_v0 = vertices[i0 * 3 + 2];\n            const x_uv0 = uvs[i0 * 2 + 0];\n            const y_uv0 = uvs[i0 * 2 + 1];\n            const x_v1 = vertices[i1 * 3 + 0];\n            const y_v1 = vertices[i1 * 3 + 1];\n            const z_v1 = vertices[i1 * 3 + 2];\n            const x_uv1 = uvs[i1 * 2 + 0];\n            const y_uv1 = uvs[i1 * 2 + 1];\n            const x_v2 = vertices[i2 * 3 + 0];\n            const y_v2 = vertices[i2 * 3 + 1];\n            const z_v2 = vertices[i2 * 3 + 2];\n            const x_uv2 = uvs[i2 * 2 + 0];\n            const y_uv2 = uvs[i2 * 2 + 1];\n            const x_deltaPos1 = x_v1 - x_v0;\n            const y_deltaPos1 = y_v1 - y_v0;\n            const z_deltaPos1 = z_v1 - z_v0;\n            const x_deltaPos2 = x_v2 - x_v0;\n            const y_deltaPos2 = y_v2 - y_v0;\n            const z_deltaPos2 = z_v2 - z_v0;\n            const x_uvDeltaPos1 = x_uv1 - x_uv0;\n            const y_uvDeltaPos1 = y_uv1 - y_uv0;\n            const x_uvDeltaPos2 = x_uv2 - x_uv0;\n            const y_uvDeltaPos2 = y_uv2 - y_uv0;\n            const rInv = x_uvDeltaPos1 * y_uvDeltaPos2 - y_uvDeltaPos1 * x_uvDeltaPos2;\n            const r = 1.0 / Math.abs(rInv < 0.0001 ? 1.0 : rInv);\n            // Tangent\n            const x_tangent = (x_deltaPos1 * y_uvDeltaPos2 - x_deltaPos2 * y_uvDeltaPos1) * r;\n            const y_tangent = (y_deltaPos1 * y_uvDeltaPos2 - y_deltaPos2 * y_uvDeltaPos1) * r;\n            const z_tangent = (z_deltaPos1 * y_uvDeltaPos2 - z_deltaPos2 * y_uvDeltaPos1) * r;\n            // Bitangent\n            const x_bitangent = (x_deltaPos2 * x_uvDeltaPos1 - x_deltaPos1 * x_uvDeltaPos2) * r;\n            const y_bitangent = (y_deltaPos2 * x_uvDeltaPos1 - y_deltaPos1 * x_uvDeltaPos2) * r;\n            const z_bitangent = (z_deltaPos2 * x_uvDeltaPos1 - z_deltaPos1 * x_uvDeltaPos2) * r;\n            // Gram-Schmidt orthogonalize\n            //t = glm::normalize(t - n * glm:: dot(n, t));\n            const x_n0 = normals[i0 * 3 + 0];\n            const y_n0 = normals[i0 * 3 + 1];\n            const z_n0 = normals[i0 * 3 + 2];\n            const x_n1 = normals[i1 * 3 + 0];\n            const y_n1 = normals[i1 * 3 + 1];\n            const z_n1 = normals[i1 * 3 + 2];\n            const x_n2 = normals[i2 * 3 + 0];\n            const y_n2 = normals[i2 * 3 + 1];\n            const z_n2 = normals[i2 * 3 + 2];\n            // Tangent\n            const n0_dot_t = x_tangent * x_n0 + y_tangent * y_n0 + z_tangent * z_n0;\n            const n1_dot_t = x_tangent * x_n1 + y_tangent * y_n1 + z_tangent * z_n1;\n            const n2_dot_t = x_tangent * x_n2 + y_tangent * y_n2 + z_tangent * z_n2;\n            const x_resTangent0 = x_tangent - x_n0 * n0_dot_t;\n            const y_resTangent0 = y_tangent - y_n0 * n0_dot_t;\n            const z_resTangent0 = z_tangent - z_n0 * n0_dot_t;\n            const x_resTangent1 = x_tangent - x_n1 * n1_dot_t;\n            const y_resTangent1 = y_tangent - y_n1 * n1_dot_t;\n            const z_resTangent1 = z_tangent - z_n1 * n1_dot_t;\n            const x_resTangent2 = x_tangent - x_n2 * n2_dot_t;\n            const y_resTangent2 = y_tangent - y_n2 * n2_dot_t;\n            const z_resTangent2 = z_tangent - z_n2 * n2_dot_t;\n            const magTangent0 = Math.sqrt(x_resTangent0 * x_resTangent0 + y_resTangent0 * y_resTangent0 + z_resTangent0 * z_resTangent0);\n            const magTangent1 = Math.sqrt(x_resTangent1 * x_resTangent1 + y_resTangent1 * y_resTangent1 + z_resTangent1 * z_resTangent1);\n            const magTangent2 = Math.sqrt(x_resTangent2 * x_resTangent2 + y_resTangent2 * y_resTangent2 + z_resTangent2 * z_resTangent2);\n            // Bitangent\n            const n0_dot_bt = x_bitangent * x_n0 + y_bitangent * y_n0 + z_bitangent * z_n0;\n            const n1_dot_bt = x_bitangent * x_n1 + y_bitangent * y_n1 + z_bitangent * z_n1;\n            const n2_dot_bt = x_bitangent * x_n2 + y_bitangent * y_n2 + z_bitangent * z_n2;\n            const x_resBitangent0 = x_bitangent - x_n0 * n0_dot_bt;\n            const y_resBitangent0 = y_bitangent - y_n0 * n0_dot_bt;\n            const z_resBitangent0 = z_bitangent - z_n0 * n0_dot_bt;\n            const x_resBitangent1 = x_bitangent - x_n1 * n1_dot_bt;\n            const y_resBitangent1 = y_bitangent - y_n1 * n1_dot_bt;\n            const z_resBitangent1 = z_bitangent - z_n1 * n1_dot_bt;\n            const x_resBitangent2 = x_bitangent - x_n2 * n2_dot_bt;\n            const y_resBitangent2 = y_bitangent - y_n2 * n2_dot_bt;\n            const z_resBitangent2 = z_bitangent - z_n2 * n2_dot_bt;\n            const magBitangent0 = Math.sqrt(x_resBitangent0 * x_resBitangent0 +\n                y_resBitangent0 * y_resBitangent0 +\n                z_resBitangent0 * z_resBitangent0);\n            const magBitangent1 = Math.sqrt(x_resBitangent1 * x_resBitangent1 +\n                y_resBitangent1 * y_resBitangent1 +\n                z_resBitangent1 * z_resBitangent1);\n            const magBitangent2 = Math.sqrt(x_resBitangent2 * x_resBitangent2 +\n                y_resBitangent2 * y_resBitangent2 +\n                z_resBitangent2 * z_resBitangent2);\n            unpacked.tangents[i0 * 3 + 0] += x_resTangent0 / magTangent0;\n            unpacked.tangents[i0 * 3 + 1] += y_resTangent0 / magTangent0;\n            unpacked.tangents[i0 * 3 + 2] += z_resTangent0 / magTangent0;\n            unpacked.tangents[i1 * 3 + 0] += x_resTangent1 / magTangent1;\n            unpacked.tangents[i1 * 3 + 1] += y_resTangent1 / magTangent1;\n            unpacked.tangents[i1 * 3 + 2] += z_resTangent1 / magTangent1;\n            unpacked.tangents[i2 * 3 + 0] += x_resTangent2 / magTangent2;\n            unpacked.tangents[i2 * 3 + 1] += y_resTangent2 / magTangent2;\n            unpacked.tangents[i2 * 3 + 2] += z_resTangent2 / magTangent2;\n            unpacked.bitangents[i0 * 3 + 0] += x_resBitangent0 / magBitangent0;\n            unpacked.bitangents[i0 * 3 + 1] += y_resBitangent0 / magBitangent0;\n            unpacked.bitangents[i0 * 3 + 2] += z_resBitangent0 / magBitangent0;\n            unpacked.bitangents[i1 * 3 + 0] += x_resBitangent1 / magBitangent1;\n            unpacked.bitangents[i1 * 3 + 1] += y_resBitangent1 / magBitangent1;\n            unpacked.bitangents[i1 * 3 + 2] += z_resBitangent1 / magBitangent1;\n            unpacked.bitangents[i2 * 3 + 0] += x_resBitangent2 / magBitangent2;\n            unpacked.bitangents[i2 * 3 + 1] += y_resBitangent2 / magBitangent2;\n            unpacked.bitangents[i2 * 3 + 2] += z_resBitangent2 / magBitangent2;\n            // TODO: check handedness\n        }\n        this.tangents = unpacked.tangents;\n        this.bitangents = unpacked.bitangents;\n    }\n    /**\n     * @param layout - A {@link Layout} object that describes the\n     * desired memory layout of the generated buffer\n     * @return The packed array in the ... TODO\n     */\n    makeBufferData(layout) {\n        const numItems = this.vertices.length / 3;\n        const buffer = new ArrayBuffer(layout.stride * numItems);\n        buffer.numItems = numItems;\n        const dataView = new DataView(buffer);\n        for (let i = 0, vertexOffset = 0; i < numItems; i++) {\n            vertexOffset = i * layout.stride;\n            // copy in the vertex data in the order and format given by the\n            // layout param\n            for (const attribute of layout.attributes) {\n                const offset = vertexOffset + layout.attributeMap[attribute.key].offset;\n                switch (attribute.key) {\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].POSITION.key:\n                        dataView.setFloat32(offset, this.vertices[i * 3], true);\n                        dataView.setFloat32(offset + 4, this.vertices[i * 3 + 1], true);\n                        dataView.setFloat32(offset + 8, this.vertices[i * 3 + 2], true);\n                        break;\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].UV.key:\n                        dataView.setFloat32(offset, this.textures[i * 2], true);\n                        dataView.setFloat32(offset + 4, this.textures[i * 2 + 1], true);\n                        break;\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].NORMAL.key:\n                        dataView.setFloat32(offset, this.vertexNormals[i * 3], true);\n                        dataView.setFloat32(offset + 4, this.vertexNormals[i * 3 + 1], true);\n                        dataView.setFloat32(offset + 8, this.vertexNormals[i * 3 + 2], true);\n                        break;\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].MATERIAL_INDEX.key:\n                        dataView.setInt16(offset, this.vertexMaterialIndices[i], true);\n                        break;\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].AMBIENT.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setFloat32(offset, material.ambient[0], true);\n                        dataView.setFloat32(offset + 4, material.ambient[1], true);\n                        dataView.setFloat32(offset + 8, material.ambient[2], true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].DIFFUSE.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setFloat32(offset, material.diffuse[0], true);\n                        dataView.setFloat32(offset + 4, material.diffuse[1], true);\n                        dataView.setFloat32(offset + 8, material.diffuse[2], true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].SPECULAR.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setFloat32(offset, material.specular[0], true);\n                        dataView.setFloat32(offset + 4, material.specular[1], true);\n                        dataView.setFloat32(offset + 8, material.specular[2], true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].SPECULAR_EXPONENT.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setFloat32(offset, material.specularExponent, true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].EMISSIVE.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setFloat32(offset, material.emissive[0], true);\n                        dataView.setFloat32(offset + 4, material.emissive[1], true);\n                        dataView.setFloat32(offset + 8, material.emissive[2], true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].TRANSMISSION_FILTER.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setFloat32(offset, material.transmissionFilter[0], true);\n                        dataView.setFloat32(offset + 4, material.transmissionFilter[1], true);\n                        dataView.setFloat32(offset + 8, material.transmissionFilter[2], true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].DISSOLVE.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setFloat32(offset, material.dissolve, true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].ILLUMINATION.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setInt16(offset, material.illumination, true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].REFRACTION_INDEX.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setFloat32(offset, material.refractionIndex, true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].SHARPNESS.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setFloat32(offset, material.sharpness, true);\n                        break;\n                    }\n                    case _layout__WEBPACK_IMPORTED_MODULE_0__["Layout"].ANTI_ALIASING.key: {\n                        const materialIndex = this.vertexMaterialIndices[i];\n                        const material = this.materialsByIndex[materialIndex];\n                        if (!material) {\n                            console.warn(\'Material "\' +\n                                this.materialNames[materialIndex] +\n                                \'" not found in mesh. Did you forget to call addMaterialLibrary(...)?"\');\n                            break;\n                        }\n                        dataView.setInt16(offset, material.antiAliasing ? 1 : 0, true);\n                        break;\n                    }\n                }\n            }\n        }\n        return buffer;\n    }\n    makeIndexBufferData() {\n        const buffer = new Uint16Array(this.indices);\n        buffer.numItems = this.indices.length;\n        return buffer;\n    }\n    makeIndexBufferDataForMaterials(...materialIndices) {\n        const indices = new Array().concat(...materialIndices.map(mtlIdx => this.indicesPerMaterial[mtlIdx]));\n        const buffer = new Uint16Array(indices);\n        buffer.numItems = indices.length;\n        return buffer;\n    }\n    addMaterialLibrary(mtl) {\n        for (const name in mtl.materials) {\n            if (!(name in this.materialIndices)) {\n                // This material is not referenced by the mesh\n                continue;\n            }\n            const material = mtl.materials[name];\n            // Find the material index for this material\n            const materialIndex = this.materialIndices[material.name];\n            // Put the material into the materialsByIndex object at the right\n            // spot as determined when the obj file was parsed\n            this.materialsByIndex[materialIndex] = material;\n        }\n    }\n}\nfunction* triangulate(elements) {\n    if (elements.length <= 3) {\n        yield elements;\n    }\n    else if (elements.length === 4) {\n        yield [elements[0], elements[1], elements[2]];\n        yield [elements[2], elements[3], elements[0]];\n    }\n    else {\n        for (let i = 1; i < elements.length - 1; i++) {\n            yield [elements[0], elements[i], elements[i + 1]];\n        }\n    }\n}\n\n\n//# sourceURL=webpack:///./src/mesh.ts?')},"./src/utils.ts":
/*!**********************!*\
  !*** ./src/utils.ts ***!
  \**********************/
/*! exports provided: downloadModels, downloadMeshes, initMeshBuffers, deleteMeshBuffers */function(module,__webpack_exports__,__webpack_require__){"use strict";eval('__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "downloadModels", function() { return downloadModels; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "downloadMeshes", function() { return downloadMeshes; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "initMeshBuffers", function() { return initMeshBuffers; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "deleteMeshBuffers", function() { return deleteMeshBuffers; });\n/* harmony import */ var _mesh__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./mesh */ "./src/mesh.ts");\n/* harmony import */ var _material__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./material */ "./src/material.ts");\n\n\nfunction downloadMtlTextures(mtl, root) {\n    const mapAttributes = [\n        "mapDiffuse",\n        "mapAmbient",\n        "mapSpecular",\n        "mapDissolve",\n        "mapBump",\n        "mapDisplacement",\n        "mapDecal",\n        "mapEmissive",\n    ];\n    if (!root.endsWith("/")) {\n        root += "/";\n    }\n    const textures = [];\n    for (const materialName in mtl.materials) {\n        if (!mtl.materials.hasOwnProperty(materialName)) {\n            continue;\n        }\n        const material = mtl.materials[materialName];\n        for (const attr of mapAttributes) {\n            const mapData = material[attr];\n            if (!mapData || !mapData.filename) {\n                continue;\n            }\n            const url = root + mapData.filename;\n            textures.push(fetch(url)\n                .then(response => {\n                if (!response.ok) {\n                    throw new Error();\n                }\n                return response.blob();\n            })\n                .then(function (data) {\n                const image = new Image();\n                image.src = URL.createObjectURL(data);\n                mapData.texture = image;\n                return new Promise(resolve => (image.onload = resolve));\n            })\n                .catch(() => {\n                console.error(`Unable to download texture: ${url}`);\n            }));\n        }\n    }\n    return Promise.all(textures);\n}\nfunction getMtl(modelOptions) {\n    if (!(typeof modelOptions.mtl === "string")) {\n        return modelOptions.obj.replace(/\\.obj$/, ".mtl");\n    }\n    return modelOptions.mtl;\n}\n/**\n * Accepts a list of model request objects and returns a Promise that\n * resolves when all models have been downloaded and parsed.\n *\n * The list of model objects follow this interface:\n * {\n *  obj: \'path/to/model.obj\',\n *  mtl: true | \'path/to/model.mtl\',\n *  downloadMtlTextures: true | false\n *  mtlTextureRoot: \'/models/suzanne/maps\'\n *  name: \'suzanne\'\n * }\n *\n * The `obj` attribute is required and should be the path to the\n * model\'s .obj file relative to the current repo (absolute URLs are\n * suggested).\n *\n * The `mtl` attribute is optional and can either be a boolean or\n * a path to the model\'s .mtl file relative to the current URL. If\n * the value is `true`, then the path and basename given for the `obj`\n * attribute is used replacing the .obj suffix for .mtl\n * E.g.: {obj: \'models/foo.obj\', mtl: true} would search for \'models/foo.mtl\'\n *\n * The `name` attribute is optional and is a human friendly name to be\n * included with the parsed OBJ and MTL files. If not given, the base .obj\n * filename will be used.\n *\n * The `downloadMtlTextures` attribute is a flag for automatically downloading\n * any images found in the MTL file and attaching them to each Material\n * created from that file. For example, if material.mapDiffuse is set (there\n * was data in the MTL file), then material.mapDiffuse.texture will contain\n * the downloaded image. This option defaults to `true`. By default, the MTL\'s\n * URL will be used to determine the location of the images.\n *\n * The `mtlTextureRoot` attribute is optional and should point to the location\n * on the server that this MTL\'s texture files are located. The default is to\n * use the MTL file\'s location.\n *\n * @returns {Promise} the result of downloading the given list of models. The\n * promise will resolve with an object whose keys are the names of the models\n * and the value is its Mesh object. Each Mesh object will automatically\n * have its addMaterialLibrary() method called to set the given MTL data (if given).\n */\nfunction downloadModels(models) {\n    const finished = [];\n    for (const model of models) {\n        if (!model.obj) {\n            throw new Error(\'"obj" attribute of model object not set. The .obj file is required to be set \' +\n                "in order to use downloadModels()");\n        }\n        const options = {\n            indicesPerMaterial: !!model.indicesPerMaterial,\n            calcTangentsAndBitangents: !!model.calcTangentsAndBitangents,\n        };\n        // if the name is not provided, dervive it from the given OBJ\n        let name = model.name;\n        if (!name) {\n            const parts = model.obj.split("/");\n            name = parts[parts.length - 1].replace(".obj", "");\n        }\n        const namePromise = Promise.resolve(name);\n        const meshPromise = fetch(model.obj)\n            .then(response => response.text())\n            .then(data => {\n            return new _mesh__WEBPACK_IMPORTED_MODULE_0__["default"](data, options);\n        });\n        let mtlPromise;\n        // Download MaterialLibrary file?\n        if (model.mtl) {\n            const mtl = getMtl(model);\n            mtlPromise = fetch(mtl)\n                .then(response => response.text())\n                .then((data) => {\n                const material = new _material__WEBPACK_IMPORTED_MODULE_1__["MaterialLibrary"](data);\n                if (model.downloadMtlTextures !== false) {\n                    let root = model.mtlTextureRoot;\n                    if (!root) {\n                        // get the directory of the MTL file as default\n                        root = mtl.substr(0, mtl.lastIndexOf("/"));\n                    }\n                    // downloadMtlTextures returns a Promise that\n                    // is resolved once all of the images it\n                    // contains are downloaded. These are then\n                    // attached to the map data objects\n                    return Promise.all([Promise.resolve(material), downloadMtlTextures(material, root)]);\n                }\n                return Promise.all([Promise.resolve(material), undefined]);\n            })\n                .then((value) => {\n                return value[0];\n            });\n        }\n        const parsed = [namePromise, meshPromise, mtlPromise];\n        finished.push(Promise.all(parsed));\n    }\n    return Promise.all(finished).then(ms => {\n        // the "finished" promise is a list of name, Mesh instance,\n        // and MaterialLibary instance. This unpacks and returns an\n        // object mapping name to Mesh (Mesh points to MTL).\n        const models = {};\n        for (const model of ms) {\n            const [name, mesh, mtl] = model;\n            mesh.name = name;\n            if (mtl) {\n                mesh.addMaterialLibrary(mtl);\n            }\n            models[name] = mesh;\n        }\n        return models;\n    });\n}\n/**\n * Takes in an object of `mesh_name`, `\'/url/to/OBJ/file\'` pairs and a callback\n * function. Each OBJ file will be ajaxed in and automatically converted to\n * an OBJ.Mesh. When all files have successfully downloaded the callback\n * function provided will be called and passed in an object containing\n * the newly created meshes.\n *\n * **Note:** In order to use this function as a way to download meshes, a\n * webserver of some sort must be used.\n *\n * @param {Object} nameAndAttrs an object where the key is the name of the mesh and the value is the url to that mesh\'s OBJ file\n *\n * @param {Function} completionCallback should contain a function that will take one parameter: an object array where the keys will be the unique object name and the value will be a Mesh object\n *\n * @param {Object} meshes In case other meshes are loaded separately or if a previously declared variable is desired to be used, pass in a (possibly empty) json object of the pattern: { \'<mesh_name>\': OBJ.Mesh }\n *\n */\nfunction downloadMeshes(nameAndURLs, completionCallback, meshes) {\n    if (meshes === undefined) {\n        meshes = {};\n    }\n    const completed = [];\n    for (const mesh_name in nameAndURLs) {\n        if (!nameAndURLs.hasOwnProperty(mesh_name)) {\n            continue;\n        }\n        const url = nameAndURLs[mesh_name];\n        completed.push(fetch(url)\n            .then(response => response.text())\n            .then(data => {\n            return [mesh_name, new _mesh__WEBPACK_IMPORTED_MODULE_0__["default"](data)];\n        }));\n    }\n    Promise.all(completed).then(ms => {\n        for (const [name, mesh] of ms) {\n            meshes[name] = mesh;\n        }\n        return completionCallback(meshes);\n    });\n}\nfunction _buildBuffer(gl, type, data, itemSize) {\n    const buffer = gl.createBuffer();\n    const arrayView = type === gl.ARRAY_BUFFER ? Float32Array : Uint16Array;\n    gl.bindBuffer(type, buffer);\n    gl.bufferData(type, new arrayView(data), gl.STATIC_DRAW);\n    buffer.itemSize = itemSize;\n    buffer.numItems = data.length / itemSize;\n    return buffer;\n}\n/**\n * Takes in the WebGL context and a Mesh, then creates and appends the buffers\n * to the mesh object as attributes.\n *\n * @param {WebGLRenderingContext} gl the `canvas.getContext(\'webgl\')` context instance\n * @param {Mesh} mesh a single `OBJ.Mesh` instance\n *\n * The newly created mesh attributes are:\n *\n * Attrbute | Description\n * :--- | ---\n * **normalBuffer**       |contains the model&#39;s Vertex Normals\n * normalBuffer.itemSize  |set to 3 items\n * normalBuffer.numItems  |the total number of vertex normals\n * |\n * **textureBuffer**      |contains the model&#39;s Texture Coordinates\n * textureBuffer.itemSize |set to 2 items\n * textureBuffer.numItems |the number of texture coordinates\n * |\n * **vertexBuffer**       |contains the model&#39;s Vertex Position Coordinates (does not include w)\n * vertexBuffer.itemSize  |set to 3 items\n * vertexBuffer.numItems  |the total number of vertices\n * |\n * **indexBuffer**        |contains the indices of the faces\n * indexBuffer.itemSize   |is set to 1\n * indexBuffer.numItems   |the total number of indices\n *\n * A simple example (a lot of steps are missing, so don\'t copy and paste):\n *\n *     const gl   = canvas.getContext(\'webgl\'),\n *         mesh = OBJ.Mesh(obj_file_data);\n *     // compile the shaders and create a shader program\n *     const shaderProgram = gl.createProgram();\n *     // compilation stuff here\n *     ...\n *     // make sure you have vertex, vertex normal, and texture coordinate\n *     // attributes located in your shaders and attach them to the shader program\n *     shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");\n *     gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);\n *\n *     shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");\n *     gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);\n *\n *     shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");\n *     gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);\n *\n *     // create and initialize the vertex, vertex normal, and texture coordinate buffers\n *     // and save on to the mesh object\n *     OBJ.initMeshBuffers(gl, mesh);\n *\n *     // now to render the mesh\n *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);\n *     gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);\n *     // it\'s possible that the mesh doesn\'t contain\n *     // any texture coordinates (e.g. suzanne.obj in the development branch).\n *     // in this case, the texture vertexAttribArray will need to be disabled\n *     // before the call to drawElements\n *     if(!mesh.textures.length){\n *       gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);\n *     }\n *     else{\n *       // if the texture vertexAttribArray has been previously\n *       // disabled, then it needs to be re-enabled\n *       gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);\n *       gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);\n *       gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);\n *     }\n *\n *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);\n *     gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);\n *\n *     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);\n *     gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);\n */\nfunction initMeshBuffers(gl, mesh) {\n    mesh.normalBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.vertexNormals, 3);\n    mesh.textureBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.textures, mesh.textureStride);\n    mesh.vertexBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.vertices, 3);\n    mesh.indexBuffer = _buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.indices, 1);\n    return mesh;\n}\nfunction deleteMeshBuffers(gl, mesh) {\n    gl.deleteBuffer(mesh.normalBuffer);\n    gl.deleteBuffer(mesh.textureBuffer);\n    gl.deleteBuffer(mesh.vertexBuffer);\n    gl.deleteBuffer(mesh.indexBuffer);\n}\n\n\n//# sourceURL=webpack:///./src/utils.ts?')},0:
/*!****************************!*\
  !*** multi ./src/index.ts ***!
  \****************************/
/*! no static exports found */function(module,exports,__webpack_require__){eval('module.exports = __webpack_require__(/*! /home/aaron/google_drive/projects/webgl-obj-loader/src/index.ts */"./src/index.ts");\n\n\n//# sourceURL=webpack:///multi_./src/index.ts?')}})}));

/***/ }),

/***/ "./src/shaders/lambert-frag.glsl":
/*!***************************************!*\
  !*** ./src/shaders/lambert-frag.glsl ***!
  \***************************************/
/***/ ((module) => {

module.exports = "#version 300 es\n\n// This is a fragment shader. If you've opened this file first, please\n// open and read lambert.vert.glsl before reading on.\n// Unlike the vertex shader, the fragment shader actually does compute\n// the shading of geometry. For every pixel in your program's output\n// screen, the fragment shader is run for every bit of geometry that\n// particular pixel overlaps. By implicitly interpolating the position\n// data passed into the fragment shader by the vertex shader, the fragment shader\n// can compute what color to apply to its pixel based on things like vertex\n// position, light position, and vertex color.\nprecision highp float;\n\nuniform vec4 u_Color; // The color with which to render this instance of geometry.\nuniform int u_Shader;\nuniform vec4 u_CameraEye;\nuniform sampler2D u_Texture;\n\n// These are the interpolated values out of the rasterizer, so you can't know\n// their specific values without knowing the vertices that contributed to them\nin vec4 fs_Nor;\nin vec4 fs_LightVec;\nin vec4 fs_Col;\nin vec4 fs_Pos;\n\nout vec4 out_Col; // This is the final output color that you will see on your\n                  // screen for the pixel that is currently being processed.\n\nint shiftleft(int x, int n) {\n    return int(float(x) * pow(2.0, float(n)));\n}\n\n// bitwise shift x to the right n spaces (bitwise >>)\n// x is int to shift\n// n is number of \"shifts\" or spaces to shift right\nint shiftright(int x, int n) {\n    return int(floor(float(x) / pow(2.0, float(n))));\n}\n\nvoid main() {\n    if(u_Shader == 0) {\n    // Material base color (before shading)\n        vec4 diffuseColor = u_Color;\n\n        // Calculate the diffuse term for Lambert shading\n        float diffuseTerm = dot(normalize(fs_Nor.xyz), normalize(fs_LightVec.xyz));\n        // Avoid negative lighting values\n        diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);\n\n        float ambientTerm = 0.2;\n\n        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier\n                                                            //to simulate ambient lighting. This ensures that faces that are not\n                                                            //lit by our point light are not completely black.\n\n        // Compute final shaded color\n        out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);\n    //out_Col = vec4((normalize(fs_Nor.xyz) + vec3(1.)) * 0.5, 1.);\n    } else if(u_Shader == 1) { // one-dimensional texture shading\n        float nl = dot(vec3(fs_Nor), vec3(fs_LightVec));\n        if(nl > 0.5) {\n            out_Col = vec4(1.45 * u_Color.xyz, 1.0);\n        } else if(nl > 0.0) {\n            out_Col = u_Color;\n        } else {\n            out_Col = vec4(0.35 * u_Color.xyz, 1.0);\n        }\n    } else if(u_Shader == 2) { // shininess-based highlights\n        vec3 n = normalize(fs_Nor.xyz);\n        vec3 v = normalize(u_CameraEye.xyz);\n        vec3 l = normalize(fs_LightVec.xyz);\n        vec3 r = l - 2.0 * dot(l, n) * n;\n        float s = 0.5;\n        float D = pow(abs(dot(v, r)), s);\n        float nl = dot(n, l);\n        out_Col = vec4(nl, D, 0.5, 1.0); // replace with texture sample\n\n    } else if(u_Shader == 3) {\n        mediump vec2 coord = vec2(gl_FragCoord.x / 512.0, 1.0 - (gl_FragCoord.y / 512.0));\n        mediump vec4 samp = texture(u_Texture, coord);\n        out_Col = vec4(samp.b, samp.r, samp.g, 1.0);\n    } else {\n        out_Col = vec4(normalize(fs_Nor.xyz), 1.0);\n    }\n}\n"

/***/ }),

/***/ "./src/shaders/lambert-vert.glsl":
/*!***************************************!*\
  !*** ./src/shaders/lambert-vert.glsl ***!
  \***************************************/
/***/ ((module) => {

module.exports = "#version 300 es\n\n//This is a vertex shader. While it is called a \"shader\" due to outdated conventions, this file\n//is used to apply matrix transformations to the arrays of vertex data passed to it.\n//Since this code is run on your GPU, each vertex is transformed simultaneously.\n//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.\n//This simultaneous transformation allows your program to run much faster, especially when rendering\n//geometry with millions of vertices.\n\nuniform mat4 u_Model;       // The matrix that defines the transformation of the\n                            // object we're rendering. In this assignment,\n                            // this will be the result of traversing your scene graph.\n\nuniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.\n                            // This allows us to transform the object's normals properly\n                            // if the object has been non-uniformly scaled.\n\nuniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.\n                            // We've written a static matrix for you to use for HW2,\n                            // but in HW3 you'll have to generate one yourself\nuniform vec4 u_CameraEye;\nuniform vec4 u_LightPos;\n\nin vec4 vs_Pos;             // The array of vertex positions passed to the shader\n\nin vec4 vs_Nor;             // The array of vertex normals passed to the shader\n\nin vec4 vs_Col;             // The array of vertex colors passed to the shader.\n\nout vec4 fs_Pos;\nout vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.\nout vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.\nout vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.\n\nconst vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of\n                                        //the geometry in the fragment shader.\n\nvoid main()\n{\n    fs_Pos = vs_Pos;\n    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation\n\n    mat3 invTranspose = mat3(u_ModelInvTr);\n    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.\n                                                            // Transform the geometry's normals by the inverse transpose of the\n                                                            // model matrix. This is necessary to ensure the normals remain\n                                                            // perpendicular to the surface after the surface is transformed by\n                                                            // the model matrix.\n                                                            \n    vec4 modelposition = u_Model * vs_Pos;   // Temporarily store the transformed vertex positions for use below\n\n    fs_LightVec = u_LightPos - modelposition;  // Compute the direction in which the light source lies\n\n    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is\n                                             // used to render the final positions of the geometry's vertices\n}\n"

/***/ }),

/***/ "./src/shaders/post/noOp-vert.glsl":
/*!*****************************************!*\
  !*** ./src/shaders/post/noOp-vert.glsl ***!
  \*****************************************/
/***/ ((module) => {

module.exports = "#version 300 es\r\nprecision highp float;\r\n// The vertex shader used to render the background of the scene\r\nin vec4 vs_Pos;\r\nin vec2 vs_UV;\r\nout vec2 fs_UV;\r\n\r\nvoid main() {\r\n  fs_UV = vs_UV;\r\n  gl_Position = vs_Pos;\r\n}"

/***/ }),

/***/ "./src/shaders/post/transition-frag.glsl":
/*!***********************************************!*\
  !*** ./src/shaders/post/transition-frag.glsl ***!
  \***********************************************/
/***/ ((module) => {

module.exports = "#version 300 es\r\nprecision highp float;\r\n// transition.frag.glsl:\r\n// A fragment shader used for post-processing that simply reads the\r\n// image produced in the first render pass by the surface shader\r\n\r\n// blur adapted from: https://learnopengl.com/Advanced-OpenGL/Framebuffers\r\nin vec2 fs_UV;\r\nuniform float u_Time;\r\nuniform int u_TransitionType;\r\n\r\nout vec4 out_Col;\r\nuniform sampler2D u_RenderedTexture;\r\nconst float PI = 3.141592653589;\r\nconst vec2 pixel = vec2(0.0, 0.0);\r\nconst float offset = 1.0 / 300.0;\r\nconst vec2 offsets[9] = vec2[] (vec2(-offset, offset), // top-left\r\n  vec2(0.0f, offset), // top-center\r\n  vec2(offset, offset), // top-right\r\n  vec2(-offset, 0.0f),   // center-left\r\n  vec2(0.0f, 0.0f),   // center-center\r\n  vec2(offset, 0.0f),   // center-right\r\n  vec2(-offset, -offset), // bottom-left\r\n  vec2(0.0f, -offset), // bottom-center\r\n  vec2(offset, -offset)  // bottom-right    \r\n  );\r\n\r\n\r\nfloat rand(vec2 uv) {\r\n  return fract(sin(u_Time / 100.0 * dot(uv, vec2(12.9898, 78.233))) * 43758.5453);\r\n}\r\n\r\nvoid main() {\r\n  vec3 col = vec3(0.0);\r\n  if (u_TransitionType == 1) {\r\n\r\n  // noise\r\n  vec4 diffuseColor = vec4(texture(u_RenderedTexture, fs_UV).rgb, 1.0);\r\n  vec3 noise = vec3(rand(fs_UV));\r\n  float sinVal = 0.5 * (sin(u_Time / 100.0) + 1.0);\r\n  col = noise * (1.0 - sinVal) + vec3(diffuseColor * sinVal);\r\n\r\n  } else if (u_TransitionType == 2) {\r\n\r\n  // blur\r\n  float x = sin(u_Time / 50.0);\r\n  float y = 2.0 * x;\r\n  float kernel[9] = float[](\r\n    (1.0 - x) / 16.0, (2.0 - y) / 16.0, (1.0 - x) / 16.0,\r\n    (2.0 - y) / 16.0, (4.0 + (4.0 * (x + y))) / 16.0, (2.0 - y) / 16.0,\r\n    (1.0 - x) / 16.0, (2.0 - y) / 16.0, (1.0 - x) / 16.0 \r\n  );\r\n\r\n  vec3 sampleTex[9];\r\n  for(int i = 0; i < 9; i++) {\r\n    sampleTex[i] = vec3(texture(u_RenderedTexture, fs_UV + offsets[i]));\r\n  }\r\n  col = vec3(0.0);\r\n  for(int i = 0; i < 9; i++)\r\n    col += sampleTex[i] * kernel[i];\r\n\r\n  } else if (u_TransitionType == 3) {\r\n\r\n    // inversion\r\n      vec3 normalColor = texture(u_RenderedTexture, fs_UV).rgb;\r\n      float sinVal = 0.5 * (sin(u_Time / 100.0) + 1.0);\r\n      col = vec3(1.0) - normalColor;\r\n      col = mix(normalColor, col, sinVal);\r\n\r\n  } else if (u_TransitionType == 4) {\r\n\r\n    // night vision\r\n     float kernel[9] = float[](\r\n        1.0, 1.0, 1.0,\r\n        1.0,  -8.0, 1.0,\r\n        1.0, 1.0, 1.0\r\n    );\r\n\r\n    vec3 sampleTex[9];\r\n  for(int i = 0; i < 9; i++) {\r\n    sampleTex[i] = vec3(texture(u_RenderedTexture, fs_UV + offsets[i]));\r\n  }\r\n  col = vec3(0.0);\r\n  for(int i = 0; i < 9; i++) {\r\n    col += sampleTex[i] * kernel[i];\r\n  }\r\n  vec3 normalColor = texture(u_RenderedTexture, fs_UV).rgb;\r\n  float average = 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;\r\n  col = average * vec3(0.0, 1.0, 0.0);\r\n  float sinVal = 0.5 * (sin(u_Time / 100.0) + 1.0);\r\n  col = mix(normalColor, col, sinVal);\r\n  } else if (u_TransitionType == 5) {\r\n\r\n    // pixelation\r\n    float numPixels = 50.0;\r\n    float numCircles = 6.0;\r\n    float xLength = .00625;\r\n    float yLength = .0125;\r\n    float sinVal = 0.5 * (sin(u_Time / 100.0) + 1.0);\r\n    vec3 normalColor = texture(u_RenderedTexture, fs_UV).rgb;\r\n    clamp(sinVal, .15, .90);\r\n    if (length(fs_UV - vec2(0.40)) < 1.5 * sin(sinVal)) {\r\n      col = mix(normalColor, vec3(1.0), length(fs_UV - vec2(0.40))/.6);\r\n    } else {\r\n        col = normalColor;\r\n    }\r\n    for(float j = 1.0; j <= numCircles; j++) {\r\n      for(float i = 0.0; i < numPixels; i++) {\r\n        vec2 point = vec2(.4) + (1.5 * sin(sinVal) / j * vec2(cos(2.0 * PI / numPixels * i + (.5 * numCircles)), \r\n                                                        sin((.5 * numCircles) + 2.0 * PI / numPixels * i)));\r\n        float distFromCenter = length(point - vec2(.4));\r\n        if(length(fs_UV.x - point.x) < xLength * (sin(sinVal) + 1.0) * (pow(distFromCenter * 2.5, 3.0) + 1.0) && \r\n           length(fs_UV.y - point.y) < yLength * (sin(sinVal) + 1.0) * (pow(distFromCenter * 2.5, 3.0) + 1.0)) {\r\n          col = mix(normalColor, vec3(1.0), rand(point));\r\n        }\r\n      }\r\n    }\r\n\r\n  }\r\n  out_Col = vec4(col, 1.0);\r\n//  out_Col = texture(u_RenderedTexture, fs_UV);\r\n}"

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec4.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/vec3.js");
/* harmony import */ var gl_matrix__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! gl-matrix */ "./node_modules/gl-matrix/esm/mat4.js");
/* harmony import */ var dat_gui__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! dat.gui */ "./node_modules/dat.gui/build/dat.gui.module.js");
/* harmony import */ var _rendering_gl_OpenGLRenderer__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./rendering/gl/OpenGLRenderer */ "./src/rendering/gl/OpenGLRenderer.ts");
/* harmony import */ var _Camera__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Camera */ "./src/Camera.ts");
/* harmony import */ var _globals__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./globals */ "./src/globals.ts");
/* harmony import */ var _rendering_gl_ShaderProgram__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./rendering/gl/ShaderProgram */ "./src/rendering/gl/ShaderProgram.ts");
/* harmony import */ var _geometry_Mesh__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./geometry/Mesh */ "./src/geometry/Mesh.ts");
/* harmony import */ var _rendering_gl_FrameBuffer__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./rendering/gl/FrameBuffer */ "./src/rendering/gl/FrameBuffer.ts");

const Stats = __webpack_require__(/*! stats-js */ "./node_modules/stats-js/build/stats.min.js");







// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
    shader: 0,
    mesh: 0,
    light_rotation: 0,
    "Reload Scene": loadScene, // A function pointer, essentially
};
var palette = {
    main_color: [255 * 0.42, 255 * 0.2, 255 * 0.14, 255],
};
let clearColor = gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(.08, .03, .24, 1);
let lightPos = gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(0, 0, 5);
let lightPos4 = gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(0, 0, 5, 1);
let prevLightAngle = 0;
let prevColor = gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(1.0, 0.0, 0.0, 0.0);
let prevShader = -1;
let prevMesh = 0;
let suzanne = new _geometry_Mesh__WEBPACK_IMPORTED_MODULE_5__["default"](_globals__WEBPACK_IMPORTED_MODULE_3__.suzanne_str, gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(0, 0, 0));
let buddha = new _geometry_Mesh__WEBPACK_IMPORTED_MODULE_5__["default"](_globals__WEBPACK_IMPORTED_MODULE_3__.suzanne_str, gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(1, 1, 1));
let renderMesh = suzanne;
function loadScene() {
    renderMesh.create();
}
function main() {
    // Initial display for framerate
    const stats = Stats();
    stats.setMode(0);
    stats.domElement.style.position = "absolute";
    stats.domElement.style.left = "0px";
    stats.domElement.style.top = "0px";
    document.body.appendChild(stats.domElement);
    // Add controls to the gui
    const gui = new dat_gui__WEBPACK_IMPORTED_MODULE_0__.GUI();
    gui.add(controls, "shader", {
        normals: -1,
        lambert: 0,
        one_dimensional_toon: 1,
        shininess_highlights: 2,
        texture_test: 3,
    });
    gui.add(controls, "mesh", {
        monkey: 0,
        buddha: 1,
    });
    gui.addColor(palette, "main_color");
    gui.add(controls, "light_rotation", 0, 360).step(1);
    gui.add(controls, "Reload Scene");
    // get canvas and webgl context
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL 2 not supported!");
    }
    const texWidth = window.innerWidth;
    const texHeight = window.innerHeight;
    let frameBuffer;
    frameBuffer = new _rendering_gl_FrameBuffer__WEBPACK_IMPORTED_MODULE_6__["default"](gl, texWidth, texHeight, window.devicePixelRatio);
    frameBuffer.create();
    // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
    // Later, we can import `gl` from `globals.ts` to access it
    (0,_globals__WEBPACK_IMPORTED_MODULE_3__.setGL)(gl);
    // Initial call to load scene
    loadScene();
    const camera = new _Camera__WEBPACK_IMPORTED_MODULE_2__["default"](gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(0, 0, 5), gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(0, 0, 0));
    const renderer = new _rendering_gl_OpenGLRenderer__WEBPACK_IMPORTED_MODULE_1__["default"](canvas);
    renderer.setClearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
    gl.enable(gl.DEPTH_TEST);
    const lambert = new _rendering_gl_ShaderProgram__WEBPACK_IMPORTED_MODULE_4__["default"]([
        new _rendering_gl_ShaderProgram__WEBPACK_IMPORTED_MODULE_4__.Shader(gl.VERTEX_SHADER, __webpack_require__(/*! ./shaders/lambert-vert.glsl */ "./src/shaders/lambert-vert.glsl")),
        new _rendering_gl_ShaderProgram__WEBPACK_IMPORTED_MODULE_4__.Shader(gl.FRAGMENT_SHADER, __webpack_require__(/*! ./shaders/lambert-frag.glsl */ "./src/shaders/lambert-frag.glsl")),
    ]);
    const postShader = new _rendering_gl_ShaderProgram__WEBPACK_IMPORTED_MODULE_4__["default"]([
        new _rendering_gl_ShaderProgram__WEBPACK_IMPORTED_MODULE_4__.Shader(gl.VERTEX_SHADER, __webpack_require__(/*! ./shaders/post/noOp-vert.glsl */ "./src/shaders/post/noOp-vert.glsl")),
        new _rendering_gl_ShaderProgram__WEBPACK_IMPORTED_MODULE_4__.Shader(gl.FRAGMENT_SHADER, __webpack_require__(/*! ./shaders/post/transition-frag.glsl */ "./src/shaders/post/transition-frag.glsl")),
    ]);
    const img = new Image();
    img.onload = function () {
        gl.activeTexture(gl.TEXTURE0);
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        const texLoc = gl.getUniformLocation(lambert, "u_Texture");
        gl.uniform1i(texLoc, 0);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // draw over the entire viewport
    };
    img.src = "./resources/test_texture.jpg";
    // This function will be called every frame
    function tick() {
        camera.update();
        stats.begin();
        gl.viewport(0, 0, window.innerWidth, window.innerHeight);
        renderer.clear();
        if (controls.shader != prevShader) {
            prevShader = controls.shader;
        }
        if (controls.mesh != prevMesh) {
            prevMesh = controls.mesh;
            if (controls.mesh == 0) {
                renderMesh = new _geometry_Mesh__WEBPACK_IMPORTED_MODULE_5__["default"](_globals__WEBPACK_IMPORTED_MODULE_3__.suzanne_str, gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(0, 0, 0));
            }
            else if (controls.mesh == 1) {
                renderMesh = new _geometry_Mesh__WEBPACK_IMPORTED_MODULE_5__["default"]((0,_globals__WEBPACK_IMPORTED_MODULE_3__.readTextFile)("resources/buddha.obj"), gl_matrix__WEBPACK_IMPORTED_MODULE_8__.fromValues(0, 0, 0));
            }
            loadScene();
        }
        let currColor = gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(palette.main_color[0] / 255, palette.main_color[1] / 255, palette.main_color[2] / 255.0, 1);
        if (currColor != prevColor) {
            prevColor = currColor;
        }
        if (controls.light_rotation != prevLightAngle) {
            let change_radians = ((controls.light_rotation - prevLightAngle) * _globals__WEBPACK_IMPORTED_MODULE_3__.PI) / 180;
            let rot1 = gl_matrix__WEBPACK_IMPORTED_MODULE_9__.create();
            let rot2 = gl_matrix__WEBPACK_IMPORTED_MODULE_9__.create();
            rot1 = gl_matrix__WEBPACK_IMPORTED_MODULE_9__.rotateX(rot1, rot1, change_radians);
            rot2 = gl_matrix__WEBPACK_IMPORTED_MODULE_9__.rotateY(rot2, rot2, change_radians);
            let currLightPos = gl_matrix__WEBPACK_IMPORTED_MODULE_8__.transformMat4(lightPos, lightPos, gl_matrix__WEBPACK_IMPORTED_MODULE_9__.multiply(gl_matrix__WEBPACK_IMPORTED_MODULE_9__.create(), rot1, rot2));
            lightPos4 = gl_matrix__WEBPACK_IMPORTED_MODULE_7__.fromValues(currLightPos[0], currLightPos[1], currLightPos[2], 1.0);
            prevLightAngle = controls.light_rotation;
        }
        if (false) {}
        else {
            // render without post-processing effects
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.enable(gl.DEPTH_TEST);
            renderer.render(camera, lambert, controls.shader, currColor, lightPos4, [
                renderMesh,
            ]);
        }
        stats.end();
        // Tell the browser to call `tick` again whenever it renders a new frame
        requestAnimationFrame(tick);
    }
    window.addEventListener("resize", function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.setAspectRatio(window.innerWidth / window.innerHeight);
        camera.updateProjectionMatrix();
    }, false);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    // Start the render loop
    tick();
}
main();

})();

/******/ })()
;
//# sourceMappingURL=bundle.js.map