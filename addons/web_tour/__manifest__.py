# -*- coding: utf-8 -*-


{
    'name': 'Tours',
    'category': 'Hidden',
    'description': """
Web tours.
========================

""",
    'version': '0.1',
    'depends': ['web'],
    'data': [
        'security/ir.model.access.csv',
        'security/ir.rule.csv',
        'views/tour_templates.xml',
        'views/tour_views.xml'
    ],
    'demo': [
        'data/web_tour_demo.xml',
    ],
    'qweb': [
        "static/src/xml/debug_manager.xml",
    ],
    'auto_install': True
}
