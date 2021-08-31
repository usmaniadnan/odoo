
{
    'name': 'POS invoice note',
    'version': '14.0.0.1',
    'category': 'Point of Sale',
    'sequence': 6,
    'author': 'odoozone',
    'website': 'http://odoozone.com/',
    'summary': "Add notes to POS orders and invoice." ,
    'license': 'LGPL-3',
    'description': """


=======================

This module allows you to add notes in pos orders and invoices.

""",
    'depends': ['point_of_sale'],
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',

    ],
    'qweb': [
        'static/src/xml/pos.xml',
    ],
    'images': [
        'static/description/create_qut.jpg',
    ],
    'installable': True,
    'website': '',
    'auto_install': False,
    'price': 30,
    'currency': 'USD',
    'images': [
        'static/description/banner.gif',
        'static/description/icon.png',
        'static/description/image1.png',
        'static/description/image2.png',
        'static/description/image3.png',
        'static/description/image4.png',

    ],
}
