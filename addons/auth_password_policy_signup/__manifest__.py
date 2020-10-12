{
    'name': "Soporte de política de contraseña para el registro",
    'depends': ['auth_password_policy', 'auth_signup'],
    'category': 'Tools',
    'auto_install': True,
    'data': [
        'views/assets.xml',
        'views/signup_templates.xml',
    ]
}
