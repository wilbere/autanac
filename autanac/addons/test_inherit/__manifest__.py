# -*- coding: utf-8 -*-
{
    'name': 'test-inherit',
    'version': '0.1',
    'category': 'Tests',
    'description': """Un módulo para verificar la herencia.""",
    'depends': ['base', 'test_new_api'],
    'data': [
        'ir.model.access.csv',
        'demo_data.xml',
    ],
    'installable': True,
    'auto_install': False,
}
