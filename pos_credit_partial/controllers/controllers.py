# -*- coding: utf-8 -*-
# from odoo import http


# class PosCreditPayment(http.Controller):
#     @http.route('/pos_credit_payment/pos_credit_payment/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/pos_credit_payment/pos_credit_payment/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('pos_credit_payment.listing', {
#             'root': '/pos_credit_payment/pos_credit_payment',
#             'objects': http.request.env['pos_credit_payment.pos_credit_payment'].search([]),
#         })

#     @http.route('/pos_credit_payment/pos_credit_payment/objects/<model("pos_credit_payment.pos_credit_payment"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('pos_credit_payment.object', {
#             'object': obj
#         })
