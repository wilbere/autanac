# -*- coding: utf-8 -*-

{
    'name': 'OAuth2 Authentication',
    'category': 'Tools',
    'description': """
Permitir a las usuarios iniciar sesión a través del Proveedor OAuth2.
""",
    'depends': ['base', 'web', 'base_setup', 'auth_signup'],
    'data': [
        'data/auth_oauth_data.xml',
        'views/auth_oauth_views.xml',
        'views/res_users_views.xml',
        'views/res_config_settings_views.xml',
        'views/auth_oauth_templates.xml',
        'security/ir.model.access.csv',
    ],
}
