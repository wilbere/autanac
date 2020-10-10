# -*- coding: utf-8 -*-
{
    'name': 'Initial Setup Tools',
    'version': '1.0',
    'category': 'Hidden',
    'description': """
Este módulo ayuda a configurar el sistema en la instalación de una nueva base de datos.
================================================================================


    """,
    'depends': ['base', 'web'],
    'data': [
        'data/base_setup_data.xml',
        'views/res_config_settings_views.xml',
        'views/res_partner_views.xml',
        'views/assets.xml',
    ],
    'demo': [],
    'installable': True,
    'auto_install': False,

    'qweb': [
        'static/src/xml/res_config_dev_tool.xml',
        'static/src/xml/res_config_edition.xml',
        'static/src/xml/res_config_invite_users.xml',
    ],

    
}
