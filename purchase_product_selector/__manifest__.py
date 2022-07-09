# -*- coding: utf-8 -*-
{
    'name': "purchase_product_selector",

    'summary': """
        Purchase Product Selector
        for product Varients""",

    'description': """
        Purchase Product Selector
        for product Varients
    """,

    'author': "odoozone",
    'website': 'http://odoozone.com/',
    'license': 'LGPL-3',

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/14.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Inventory',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base','purchase','sale_product_configurator'],

    'data': [
        # 'security/ir.model.access.csv',
        'views/purchase_order_form.xml',
         ],


    # always loaded

    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
     'price': 29,
    'currency': 'EUR',

    'assets': {
        'web.assets_backend': [
            'purchase_product_selector/static/src/js/mrp_configurator.js',
        ],
    },

}
