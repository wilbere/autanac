# -*- coding: utf-8 -*-
{
    'name': "Sparse Fields",
    'summary': """Implementation of sparse fields.""",
    'description': """
        El propósito de este módulo es implementar campos "dispersos", es decir, campos
         que son en su mayoría nulos. Esta implementación elude la limitación de PostgreSQL
         en el número de columnas en una tabla. Los valores de todos los campos dispersos dispersos
         se almacenan en un campo "serializado" en forma de mapeo JSON.
    """,
    'category': 'Hidden',
    'version': '1.0',
    'depends': ['base'],
    'data': [
        'views/views.xml',
    ],
}
