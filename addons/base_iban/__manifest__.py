# -*- coding: utf-8 -*-
{
    'name': 'IBAN Bank Accounts',
    'category': 'Tools',
    'description': """
Este módulo instala la base para las cuentas bancarias IBAN (número de cuenta bancaria internacional) y verifica su validez
    """,
    'depends': ['account', 'web'],
    'data': [
        'views/templates.xml',
        'views/partner_view.xml'
    ],
    'demo': ['data/res_partner_bank_demo.xml'],
}
