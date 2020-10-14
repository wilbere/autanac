autanac.define('iap.redirect_autanac_credit_widget', function(require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var core = require('web.core');


var IapautanacCreditRedirect = AbstractAction.extend({
    template: 'iap.redirect_to_autanac_credit',
    events : {
        "click .redirect_confirm" : "autanac_redirect",
    },
    init: function (parent, action) {
        this._super(parent, action);
        this.url = action.params.url;
    },

    autanac_redirect: function () {
        window.open(this.url, '_blank');
        this.do_action({type: 'ir.actions.act_window_close'});
        // framework.redirect(this.url);
    },

});
core.action_registry.add('iap_autanac_credit_redirect', IapautanacCreditRedirect);
});
