

{
    'name': 'POS Quotation Print',
    'version': '14.0.0.1',
    'category': 'Point of Sale',
    'sequence': 6,
    'author': 'pharmola',
    'summary': "This module allows you to create quotations in pos." ,
    'license': 'LGPL-3',
    'description': """
    

=======================

This module allows you to create quotations in pos.

""",
    'depends': ['point_of_sale'],
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
        'views/templates.xml',
        'views/sequence.xml',
        'report/quotation_template.xml'
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
    'price': 50,
    'currency': 'USD',
}
