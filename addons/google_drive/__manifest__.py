# -*- coding: utf-8 -*-


{
    'name': 'Google Drive™ integration',
    'version': '0.2',
    'category': 'Tools',
    'installable': True,
    'auto_install': False,
    'data': [
        'security/ir.model.access.csv',
        'data/google_drive_data.xml',
        'views/google_drive_views.xml',
        'views/google_drive_templates.xml',
        'views/res_config_settings_views.xml',
    ],
    'demo': [
        'data/google_drive_demo.xml'
    ],
    'depends': ['base_setup', 'google_account'],
    'description': """
Integracions de Google Drive al sistema.
============================================
"""
}
