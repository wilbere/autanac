autanac.define('web.config', function () {
"use strict";

/**
 * This module contains all the (mostly) static 'environmental' information.
 * This is often necessary to allow the rest of the web client to properly
 * render itself.
 *
 * Note that many informations currently stored in session should be moved to
 * this file someday.
 */

var config = {
    device: {
        /**
         * touch is a boolean, true if the device supports touch interaction
         *
         * @type Boolean
         */
        touch: 'ontouchstart' in window || 'onmsgesturechange' in window,
        /**
         * size_class is an integer: 0, 1, 2, 3 or 4, depending on the (current)
         * size of the device.  This is a dynamic property, updated whenever the
         * browser is resized
         *
         * @type Number
         */
        size_class: null,
        /**
         * A frequent use case is to have a different render in 'mobile' mode,
         * meaning when the screen is small.  This flag (boolean) is true when
         * the size is XS/VSM/SM. It is also updated dynamically.
         *
         * @type Boolean
         */
        isMobile: null,
        /**
         * Mapping between the numbers 0,1,2,3,4,5,6 and some descriptions
         */
        SIZES: { XS: 0, VSM: 1, SM: 2, MD: 3, LG: 4, XL: 5, XXL: 6 },
    },
    /**
     * States whether the current environment is in debug or not.
     *
     * @param debugMode the debug mode to check, empty for simple debug mode
     * @returns {boolean}
     */
    isDebug: function (debugMode) {
        if (debugMode) {
            return autanac.debug && autanac.debug.indexOf(debugMode) !== -1;
        }
        return autanac.debug;
    },
};


var medias = [
    window.matchMedia('(max-width: 474px)'),
    window.matchMedia('(min-width: 475px) and (max-width: 575px)'),
    window.matchMedia('(min-width: 576px) and (max-width: 767px)'),
    window.matchMedia('(min-width: 768px) and (max-width: 991px)'),
    window.matchMedia('(min-width: 992px) and (max-width: 1199px)'),
    window.matchMedia('(min-width: 1200px) and (max-width: 1533px)'),
    window.matchMedia('(min-width: 1534px)'),
];

/**
 * Return the current size class
 *
 * @returns {integer} a number between 0 and 5, included
 */
function _getSizeClass() {
    for (var i = 0 ; i < medias.length ; i++) {
        if (medias[i].matches) {
            return i;
        }
    }
}
/**
 * Update the size dependant properties in the config object.  This method
 * should be called every time the size class changes.
 */
function _updateSizeProps() {
    var sc = _getSizeClass();
    if (sc !== config.device.size_class) {
        config.device.size_class = sc;
        config.device.isMobile = config.device.size_class <= config.device.SIZES.SM;
    }
}

_.invoke(medias, 'addListener', _updateSizeProps);
_updateSizeProps();

return config;

});
