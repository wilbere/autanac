# -*- coding: utf-8 -*-


from autanac import models
from autanac.http import request


class Http(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        result = super(Http, self).session_info()
        if result['is_admin']:
            result['web_tours'] = request.env['web_tour.tour'].get_consumed_tours()
        return result
