

{
    'name': 'POS Quotation Manager',
    'version': '14.0.0.1',
    'category': 'Point of Sale',
    'sequence': 6,
    'author': "odoozone",
    'website': "http://odoozone.com/",
    'summary': "This module allows you to create quotations in pos." ,
    'license': 'LGPL-3',
    'description': """
    

=======================

This module allows you to create quotations in pos and print in A4 and mobile Printer size.

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
    'images': [
'static/description/banner.PNG',
'static/description/icon.png',
'static/description/image 1.png',
'static/description/image 2.png',
'static/description/image 3.png',
'static/description/image 4.png',
'static/description/image 5.png',
'static/description/image 6.png',
'static/description/image 7.png',
'static/description/image 8.png',
'static/description/Capture.png',

],
}
