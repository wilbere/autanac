# -*- coding: utf-8 -*-
# Part of autanac. See LICENSE file for full copyright and licensing details.

from autanac import api, models


class AutoVacuum(models.AbstractModel):
    _inherit = 'ir.autovacuum'

    @api.model
    def power_on(self, *args, **kwargs):
        self.env['mail.thread']._garbage_collect_attachments()
        return super(AutoVacuum, self).power_on(*args, **kwargs)
