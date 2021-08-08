# -*- coding: utf-8 -*-
{
    'name': "pos credit payment",

    'summary': """
        pos credit payment
        pos partial credit""",

    'description': """
        pos credit payment
        pos partial credit
        credit payment with correct partner ledger data
    """,

    'author': "Pharmola",
    'license': 'LGPL-3',

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/14.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['point_of_sale'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
'price': 50,
    'currency': 'USD',
    'images': [
'static/description/banner.PNG',
'static/description/icon.png',
'static/description/image1.png',
'static/description/image2.png',
'static/description/image3.png',
'static/description/image4.png',
'static/description/image5.png',
'static/description/image6.png',
'static/description/image7.png',
'static/description/image8.png',
'static/description/image9.png',
'static/description/image10.png',

],
}
