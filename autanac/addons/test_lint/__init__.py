# -*- coding: utf-8 -*-


from autanac import api, SUPERUSER_ID


# TO REMOVE in master
def uninstall_test_pylint(cr):
    env = api.Environment(cr, SUPERUSER_ID, {})
    env['ir.module.module'].search([
        ('name', '=', 'test_pylint'),
        ('state', '=', 'installed')
    ]).write({'state': 'uninstalled'})
