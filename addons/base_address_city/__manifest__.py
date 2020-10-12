# -*- coding: utf-8 -*-
{
    'name': 'City Addresses',
    'summary': 'Add a many2one field city on addresses',
    'sequence': '19',
    'category': 'Tools',
    'complexity': 'easy',
    'description': """
Gestión de direcciones de ciudades

        """,
    'data': [
        'security/ir.model.access.csv',
        'views/res_city_view.xml',
        'views/res_country_view.xml',
    ],
    'depends': ['base'],
}
