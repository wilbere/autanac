# -*- coding: utf-8 -*-
# Part of autanac. See LICENSE file for full copyright and licensing details.

from autanac import models
from autanac.http import request


class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    def session_info(self):
        user = request.env.user
        result = super(IrHttp, self).session_info()
        if self.env.user.has_group('base.group_user'):
            result['out_of_office_message'] = user.out_of_office_message
        return result
