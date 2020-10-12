{
    'name': 'Base import',
    'description': """
Importación de archivos extensibles para el sistema
""",
    'depends': ['web'],
    'category': 'Tools',
    'installable': True,
    'auto_install': True,
    'data': [
        'security/ir.model.access.csv',
        'views/base_import_templates.xml',
    ],
    'qweb': ['static/src/xml/base_import.xml'],
}
