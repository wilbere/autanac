# -*- coding: utf-8 -*-
{
    'name': 'Partners Geolocation',
    'version': '2.1',
    'category': 'Tools',
    'description': """
Geolocalización
========================
    """,
    'depends': ['base_setup'],
    'data': [
        'security/ir.model.access.csv',
        'views/res_partner_views.xml',
        'views/res_config_settings_views.xml',
        'data/data.xml',
    ],
    'installable': True,
}
