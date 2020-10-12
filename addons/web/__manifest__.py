# -*- coding: utf-8 -*-


{
    'name': 'Web',
    'category': 'Hidden',
    'version': '1.0',
    'description':
        """
Mudulo CORE Web
========================

This module provides the core of the autanac Web Client.
        """,
    'depends': ['base'],
    'auto_install': True,
    'data': [
        'security/ir.model.access.csv',
        'views/webclient_templates.xml',
        'views/report_templates.xml',
        'data/report_layout.xml',
    ],
    'qweb': [
        "static/src/xml/base.xml",
        "static/src/xml/chart.xml",
        "static/src/xml/kanban.xml",
        "static/src/xml/menu.xml",
        "static/src/xml/notification.xml",
        "static/src/xml/rainbow_man.xml",
        "static/src/xml/report.xml",
        "static/src/xml/web_calendar.xml",
    ],
    'bootstrap': True,  # load translations for login screen
}
