# -*- coding: ascii -*-

from autanac import fields, models


class ReportLayout(models.Model):
    _name = "report.layout"
    _description = 'Report Layout'

    view_id = fields.Many2one('ir.ui.view', 'Document Template', required=True)
    image = fields.Char(string="Preview image src")
    pdf = fields.Char(string="Preview pdf src")

    name = fields.Char()
