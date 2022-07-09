# -*- coding: utf-8 -*-
# from odoo import http


# class PurchaseProductSelector(http.Controller):
#     @http.route('/purchase_product_selector/purchase_product_selector/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/purchase_product_selector/purchase_product_selector/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('purchase_product_selector.listing', {
#             'root': '/purchase_product_selector/purchase_product_selector',
#             'objects': http.request.env['purchase_product_selector.purchase_product_selector'].search([]),
#         })

#     @http.route('/purchase_product_selector/purchase_product_selector/objects/<model("purchase_product_selector.purchase_product_selector"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('purchase_product_selector.object', {
#             'object': obj
#         })
