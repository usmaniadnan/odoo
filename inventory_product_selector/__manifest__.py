# -*- coding: utf-8 -*-
{
    'name': "inventory_product_selector",

    'summary': """
        Stock Inventory Line Product Selector
        for product Varients""",

    'description': """
        Inventory Product Selector
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
    'depends': ['base','stock','sale_product_configurator'],

    'data': [
        # 'security/ir.model.access.csv',
        'views/stock_inventory_list_view.xml',
         'views/assets.xml',
         ],


    # always loaded

    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
     'price': 29,
    'currency': 'EUR',

'images': [
'static/description/banner.png',
'static/description/icon.png',
'static/description/image1.png',
    ],


}
