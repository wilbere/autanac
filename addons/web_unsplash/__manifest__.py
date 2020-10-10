# -*- coding: utf-8 -*-

{
    'name': 'Unsplash Image Library',
    'category': 'Hidden',
    'summary': 'Find free high-resolution images from Unsplash',
    'version': '1.1',
    'description': """Explore la biblioteca de imágenes de alta resolución gratuita de Unsplash.com y busque imágenes para usar en Autana. Se agrega una barra de búsqueda Unsplash al modal de la biblioteca de imágenes.""",
    'depends': ['base_setup', 'web_editor'],
    'data': [
        'views/res_config_settings_view.xml',
        'views/web_unsplash_templates.xml',
    ],
    'auto_install': True,
}
