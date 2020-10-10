# -*- coding: utf-8 -*-

{
    'name': 'Signup',
    'description': """
Permite a las usuarios registrarse y restablecer su contraseña
===============================================
    """,
    'version': '1.0',
    'category': 'Tools',
    'auto_install': True,
    'depends': [
        'base_setup',
        'mail',
        'web',
    ],
    'data': [
        'data/auth_signup_data.xml',
        'data/ir_cron_data.xml',
        'views/res_config_settings_views.xml',
        'views/res_users_views.xml',
        'views/auth_signup_login_templates.xml',
        'views/auth_signup_assets.xml',
    ],
    'bootstrap': True,
}
