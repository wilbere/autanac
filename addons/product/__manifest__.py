# -*- coding: utf-8 -*-
# Part of autanac. See LICENSE file for full copyright and licensing details.

{
    'name': 'Products & Pricelists',
    'version': '1.2',
    'category': 'Sales/Sales',
    'depends': ['base', 'mail', 'uom'],
    'description': """
This is the base module for managing products and pricelists in autanac.
========================================================================

Products support variants, different pricing methods, vendors information,
make to stock/order, different units of measure, packaging and properties.

Pricelists support:
-------------------
    * Multiple-level of discount (by product, category, quantities)
    * Compute price based on different criteria:
        * Other pricelist
        * Cost price
        * List price
        * Vendor price

Pricelists preferences by product and/or partners.

Print product labels with barcode.
    """,
    'data': [
        'data/product_data.xml',
        'security/product_security.xml',
        'security/ir.model.access.csv',
        'wizard/product_price_list_views.xml',
        'views/res_config_settings_views.xml',
        'views/product_attribute_views.xml',
        'views/product_views.xml',
        'views/product_template_views.xml',
        'views/product_pricelist_views.xml',
        'views/res_partner_views.xml',
        'report/product_reports.xml',
        'report/product_pricelist_templates.xml',
        'report/product_product_templates.xml',
        'report/product_template_templates.xml',
        'report/product_packaging.xml',
    ],
    'demo': [
        'data/product_demo.xml',
    ],
    'installable': True,
    'auto_install': False,
}
