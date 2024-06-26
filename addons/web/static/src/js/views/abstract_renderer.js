autanac.define('web.AbstractRenderer', function (require) {
"use strict";

/**
 * The renderer should not handle pagination, data loading, or coordination
 * with the control panel. It is only concerned with rendering.
 *
 */

var mvc = require('web.mvc');

/**
 * @class AbstractRenderer
 */
return mvc.Renderer.extend({
    /**
     * @override
     * @param {string} [params.noContentHelp]
     */
    init: function (parent, state, params) {
        this._super.apply(this, arguments);
        this.arch = params.arch;
        this.noContentHelp = params.noContentHelp;
        this.withSearchPanel = params.withSearchPanel;
    },
    /**
     * The rendering is asynchronous. The start
     * method simply makes sure that we render the view.
     *
     * @returns {Promise}
     */
    start: function () {
        this.$el.addClass(this.arch.attrs.class);
        if (this.withSearchPanel) {
            this.$el.addClass('o_renderer_with_searchpanel');
        }
        return Promise.all([this._render(), this._super()]);
    },
    /**
     * Called each time the renderer is attached into the DOM.
     */
    on_attach_callback: function () {},
    /**
     * Called each time the renderer is detached from the DOM.
     */
    on_detach_callback: function () {},

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Returns any relevant state that the renderer might want to keep.
     *
     * The idea is that a renderer can be destroyed, then be replaced by another
     * one instantiated with the state from the model and the localState from
     * the renderer, and the end result should be the same.
     *
     * The kind of state that we expect the renderer to have is mostly DOM state
     * such as the scroll position, the currently active tab page, ...
     *
     * This method is called before each updateState, by the controller.
     *
     * @see setLocalState
     * @returns {any}
     */
    getLocalState: function () {
    },
    /**
     * Order to focus to be given to the content of the current view
     */
    giveFocus: function () {
    },
    /**
     * This is the reverse operation from getLocalState.  With this method, we
     * expect the renderer to restore all DOM state, if it is relevant.
     *
     * This method is called after each updateState, by the controller.
     *
     * @see getLocalState
     * @param {any} localState the result of a call to getLocalState
     */
    setLocalState: function (localState) {
    },
    /**
     * Updates the state of the view. It retriggers a full rerender, unless told
     * otherwise (for optimization for example).
     *
     * @param {any} state
     * @param {Object} params
     * @param {boolean} [params.noRender=false]
     *        if true, the method only updates the state without rerendering
     * @returns {Promise}
     */
    updateState: function (state, params) {
        this.state = state;
        return params.noRender ? Promise.resolve() : this._render();
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     *  Render the view
     *
     * @abstract
     * @private
     * @returns {Promise}
     */
    _render: function () {
        return Promise.resolve();
    },
});

});
