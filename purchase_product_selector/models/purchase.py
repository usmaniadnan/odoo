from odoo import _, api, exceptions, fields, models

class PurchaseOrderLine(models.Model):
    _inherit = 'purchase.order.line'

    product_tmpl_id = fields.Many2one('product.template', 'Product Template',
                                       index=True,
                                      required=True)

    # product_id = fields.Many2one('product.product', string='Product',
    #                              domain=[('purchase_ok', '=', True), ('product_tmpl_id', '=', product_tmpl_id)],
    #                              change_default=True)
    is_configurable_product = fields.Boolean('Is the product configurable?',
                                             related="product_tmpl_id.has_configurable_attributes")
