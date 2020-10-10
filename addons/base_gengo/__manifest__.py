# -*- coding: utf-8 -*-
{
    'name': 'Automated Translations through Gengo API',
    'category': 'Tools',
    'description': """
Traducciones automatizadas a través de la API de Gengo

    """,
    'depends': ['base_setup'],
    'data': [
        'data/ir_cron_data.xml',
        'views/ir_translation_views.xml',
        'views/res_config_settings_views.xml',
        'wizard/base_gengo_translations_view.xml',
    ],
    'demo': ['data/res_company_demo.xml'],
    'test': [],
    'installable': True,
    'auto_install': False,
}
