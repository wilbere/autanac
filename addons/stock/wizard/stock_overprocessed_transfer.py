# -*- coding: utf-8 -*-
# Part of autanac. See LICENSE file for full copyright and licensing details.

from autanac import api, fields, models, _
from autanac.exceptions import UserError


class StockOverProcessedTransfer(models.TransientModel):
    _name = 'stock.overprocessed.transfer'
    _description = 'Transfer Over Processed Stock'

    picking_id = fields.Many2one('stock.picking')
    overprocessed_product_name = fields.Char(compute='_compute_overprocessed_product_name',
                                             readonly=True)

    def _compute_overprocessed_product_name(self):
        for wizard in self:
            wizard.overprocessed_product_name = False
            if wizard.picking_id:
                moves = wizard.picking_id._get_overprocessed_stock_moves()
                wizard.overprocessed_product_name = moves[0].product_id.display_name

    def action_confirm(self):
        self.ensure_one()
        return self.picking_id.with_context(skip_overprocessed_check=True).button_validate()
