# -*- coding: utf-8 -*-


{
    'name': 'ESC/POS Hardware Driver',
    'category': 'Sales/Point Of Sale',
    'sequence': 6,
    'summary': 'Hardware Driver for ESC/POS Printers and Cashdrawers',
    'description': """
ESC/POS Hardware Driver
=======================

Este módulo permite imprimir con impresoras compatibles con ESC / POS y
abrir cajones de efectivo controlados por ESC / POS en el punto de venta y otros módulos
que necesitaría tal funcionalidad

""",
    'depends': ['hw_proxy'],
    'external_dependencies': {
        'python' : ['pyusb','pyserial','qrcode'],
    },
    'installable': False,
}
