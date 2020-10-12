# -*- coding: utf-8 -*-


{
    'name': 'Google Spreadsheet',
    'version': '1.0',
    'category': 'Tools',
    'depends': ['google_drive'],
    'data': [
        'data/google_spreadsheet_data.xml',
        'views/google_spreadsheet_views.xml',
        'views/google_spreadsheet_templates.xml',
        'views/res_config_settings_views.xml',
    ],
    'qweb': ['static/src/xml/*.xml'],
    'demo': [],
    'installable': True,
    'auto_install': False,
}
