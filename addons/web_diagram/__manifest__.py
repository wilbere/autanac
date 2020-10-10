# -*- coding: utf-8 -*-


{
    'name': 'Autana Cars Web Diagram',
    'category': 'Hidden',
    'description': """
Ver Diagrama Web.
=========================

""",
    'version': '2.0',
    'depends': ['web'],
    'data': [
        'views/web_diagram_templates.xml',
    ],
    'qweb': [
        'static/src/xml/*.xml',
    ],
    'auto_install': True,
}
