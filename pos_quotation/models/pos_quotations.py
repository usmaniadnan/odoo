# -*- coding: utf-8 -*-


from odoo import fields, models,tools,api, _
import logging
from functools import partial
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
from datetime import datetime, timedelta
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

class PosOrder(models.Model):
    _inherit = "pos.order"

    quotation_id = fields.Many2one("pos.quotation",string="Quotation Ref.",readonly=True)

    @api.model
    def _order_fields(self, ui_order):
        result = super(PosOrder, self)._order_fields(ui_order)
        if 'quotation_id' in ui_order:
            result['quotation_id'] = ui_order['quot_id']
        return result

class pos_quotation(models.Model):
    _name = 'pos.quotation'
    _order = "id desc"

    @api.model
    def _amount_line_tax(self, line, fiscal_position_id):

        print("inside amount line tax")
        taxes = line.tax_ids.filtered(lambda t: t.company_id.id == line.quotation_id.company_id.id)
        if fiscal_position_id:
            taxes = fiscal_position_id.map_tax(taxes, line.product_id, line.quotation_id.partner_id)
        price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
        taxes = taxes.compute_all(price, line.quotation_id.pricelist_id.currency_id, line.qty, product=line.product_id, partner=line.quotation_id.partner_id or False)['taxes']
        print("tax : ", taxes)
        return sum(tax.get('amount', 0.0) for tax in taxes)

    def _default_session(self):
        return self.env['pos.session'].search([('state', '=', 'opened'), ('user_id', '=', self.env.uid)], limit=1)

    def _default_pricelist(self):
        return self._default_session().config_id.pricelist_id

    name = fields.Char(string='Name', required=True, readonly=True, copy=False, default=lambda self: self.env['ir.sequence'].next_by_code('pos.quotation'))
    lines = fields.One2many('pos.quotation.line', 'quotation_id', string='POS Lines')
    company_id = fields.Many2one('res.company', string='Company', required=True,
                                 default=lambda self: self.env.user.company_id)
    partner_id = fields.Many2one('res.partner', string='Customer')
    order_id = fields.Many2one('pos.order', string='Order Ref.',readonly=True)
    session_id = fields.Many2one('pos.session', string='Session')
    config_id = fields.Many2one('pos.config', related='session_id.config_id', string="Point of Sale")
    amount_tax = fields.Float(compute='_compute_amount_all', string='Taxes', digits=0, readonly=1)
    amount_untaxed = fields.Float(compute='_compute_amount_all', string='SubTotal', digits=0, readonly=1)
    amount_total = fields.Float(compute='_compute_amount_all', string='Total', digits=0, readonly=1)
    state = fields.Selection(
        [('draft', 'New'), ('cancel', 'Cancelled'), ('sent', 'Quotation Sent'), ('done', 'Done')],
        'Status', readonly=True, copy=False, default='draft')
    pricelist_id = fields.Many2one('product.pricelist', string='Pricelist', required=True, default=_default_pricelist)
    note = fields.Text(string='Internal Notes')
    fiscal_position_id = fields.Many2one('account.fiscal.position', string='Fiscal Position', default=lambda self: self._default_session().config_id.default_fiscal_position_id)

    @api.depends('lines.price_subtotal_incl', 'lines.discount')
    def _compute_amount_all(self):
        for order in self:
            order.amount_tax = 0.0
            currency = order.pricelist_id.currency_id
            order.amount_tax = currency.round(sum(self._amount_line_tax(line, order.fiscal_position_id) for line in order.lines))
            order.amount_untaxed = currency.round(sum(line.price_subtotal for line in order.lines))
            order.amount_total = order.amount_tax + order.amount_untaxed


    @api.onchange('partner_id')
    def _onchange_partner_id(self):
        if self.partner_id:
            self.partner_id = self.partner_id.property_product_pricelist.id

    @api.model
    def _order_fields(self, ui_order):

        print("inside _order_fields : ",ui_order)
        process_line = partial(self.env['pos.quotation.line']._order_line_fields)
        return {
            'session_id':   ui_order['pos_session_id'],
            'lines':        [process_line(l) for l in ui_order['lines']] if ui_order['lines'] else False,
            'partner_id':   ui_order['partner_id'] or False,
            'fiscal_position_id': ui_order['fiscal_position_id'],
            'note':         ui_order['wv_note'],
            'amount_tax':   ui_order['amount_tax'],
            'amount_total':  ui_order['amount_total'],
            'amount_untaxed': ui_order['amount_total']-ui_order['amount_tax'],
        }
    @api.model
    def create_new_quotation(self,quotation):

        print("inside create quot : ",quotation)
        quotation_obj = self.create(self._order_fields(quotation))
        order_line = self.env['pos.quotation.line'].search_read([('quotation_id','=',quotation_obj.id)],[])
        print("Testing>>>>>>>>>>",quotation_obj.read([]))
        return {'result':quotation_obj.read([])}


    @api.model
    def create(self, vals):
        vals['name'] = self.env['ir.sequence'].get('pos.quotation')
        return super(pos_quotation, self).create(vals)

    @api.model
    def quotation_fetch_line(self, quotation_id):
        quotation_obj = self.browse(int(quotation_id))
        if quotation_obj:
            quotation_obj.state = 'done'
            return quotation_obj.lines.read(['product_id','price_unit','qty','discount','tax_ids'])
        return False


class pos_quotation_line(models.Model):
    _name = 'pos.quotation.line'

    def _order_line_fields(self, line):

        print("inside _order_line_fields : ",line)
        line2 = [0,0,{}]
        print("line2 : ",line[2])
        if line and 'tax_ids' not in line[2]:
            product = self.env['product.product'].browse(line[2]['product_id'])
            line2[2]['tax_ids'] = [(6, 0, [x.id for x in product.taxes_id])]
        line2[2]['product_id'] = line[2]['product_id']
        line2[2]['qty'] = line[2]['qty']
        line2[2]['price_unit'] = line[2]['price_unit']
        line2[2]['discount'] = line[2]['discount']
        line2[2]['price_subtotal'] = line[2]['price_subtotal']
        line2[2]['tax_ids'] = line[2]['tax_ids']
        return line2

    company_id = fields.Many2one('res.company', string='Company', required=True, default=lambda self: self.env.user.company_id)
    notice = fields.Char(string='Discount Notice')
    product_id = fields.Many2one('product.product', string='Product', required=True, change_default=True)
    quotation_id = fields.Many2one('pos.quotation')
    price_unit = fields.Float(string='Unit Price', digits=0)
    qty = fields.Float('Quantity', default=1)
    price_subtotal = fields.Float(compute='_compute_amount_line_all',digits=0, string='Subtotal w/o Tax')
    price_subtotal_incl = fields.Float(compute='_compute_amount_line_all',digits=0, string='Subtotal')
    discount = fields.Float(string='Discount (%)', digits=0, default=0.0)
    create_date = fields.Datetime(string='Creation Date', readonly=True)
    tax_ids = fields.Many2many('account.tax', string='Taxes')
    display_type = fields.Selection([
        ('line_section', "Section"),
        ('line_note', "Note")], default=False, help="Technical field for UX purpose.")


    @api.depends('price_unit', 'tax_ids', 'qty', 'discount', 'product_id')
    def _compute_amount_line_all(self):
        for line in self:
            currency = line.quotation_id.pricelist_id.currency_id
            taxes = line.tax_ids.filtered(lambda tax: tax.company_id.id == line.quotation_id.company_id.id)
            fiscal_position_id = line.quotation_id.fiscal_position_id
            if fiscal_position_id:
                taxes = fiscal_position_id.map_tax(taxes, line.product_id, line.quotation_id.partner_id)
            price = line.price_unit * (1 - (line.discount or 0.0) / 100.0)
            line.price_subtotal = line.price_subtotal_incl = price * line.qty
            if taxes:
                taxes = taxes.compute_all(price, currency, line.qty, product=line.product_id, partner=line.quotation_id.partner_id or False)
                line.price_subtotal = taxes['total_excluded']
                line.price_subtotal_incl = taxes['total_included']

            line.price_subtotal = currency.round(line.price_subtotal)
            line.price_subtotal_incl = currency.round(line.price_subtotal_incl)

    @api.onchange('product_id')
    def _onchange_product_id(self):
        print("inside product change")
        if self.product_id:
            if not self.quotation_id.pricelist_id:
                raise UserError(
                    _('You have to select a pricelist in the sale form !\n'
                      'Please set one before choosing a product.'))
            price = self.quotation_id.pricelist_id.get_product_price(
                self.product_id, self.qty or 1.0, self.quotation_id.partner_id)
            self._onchange_qty()
            self.price_unit = price
            self.tax_ids = self.product_id.taxes_id
            print("tax : ", self.tax_ids)

    @api.onchange('qty', 'discount', 'price_unit', 'tax_ids')
    def _onchange_qty(self):
        if self.product_id:
            if not self.quotation_id.pricelist_id:
                raise UserError(_('You have to select a pricelist in the sale form !'))
            price = self.price_unit * (1 - (self.discount or 0.0) / 100.0)
            self.price_subtotal = self.price_subtotal_incl = price * self.qty
            if (self.product_id.taxes_id):
                taxes = self.product_id.taxes_id.compute_all(price, self.quotation_id.pricelist_id.currency_id, self.qty, product=self.product_id, partner=False)
                self.price_subtotal = taxes['total_excluded']
                self.price_subtotal_incl = taxes['total_included']
                # self.tax_ids = self.product_id.taxes_id


class pos_config(models.Model):
    _inherit = 'pos.config' 
    
    allow_create_quotation = fields.Boolean("Allow Create Quotation")



    