# -*- coding: utf-8 -*-
{
    'name': 'test-lint',
    'version': '0.1',
    'category': 'Tests',
    'description': """Un módulo para probar el código con varios linters.""",
    'maintainer': 'autanac SA',
    'depends': ['base'],
    'installable': True,
    'auto_install': False,
    'pre_init_hook': 'uninstall_test_pylint'
}
