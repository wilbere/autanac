# -*- coding: utf-8 -*-

from autanac.http import Controller, request, route


class Referral(Controller):

    @route(['/autanac_referral/go'], type='json', auth='user', method='POST', website=True)
    def referral_go(self):
        return {'link': request.env.user._get_referral_link(reset_count=True)}
