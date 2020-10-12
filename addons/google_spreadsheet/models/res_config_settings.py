# -*- coding: utf-8 -*-


from autanac import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    google_drive_uri_copy = fields.Char(related='google_drive_uri', string='URI Copy', help="The URL to generate the authorization code from Google", readonly=False)
