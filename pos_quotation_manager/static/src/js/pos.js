odoo.define('pos_quotations.pos_quotations', function (require) {
"use strict";

	const models = require('point_of_sale.models');
    const ReceiptScreen = require('point_of_sale.ReceiptScreen');
    const PosComponent = require('point_of_sale.PosComponent');
    const { useListener } = require('web.custom_hooks');
    const Registries = require('point_of_sale.Registries');
    const ProductScreen = require('point_of_sale.ProductScreen');
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const { useState, useRef } = owl.hooks;
    const { posbus } = require('point_of_sale.utils');
    const { debounce } = owl.utils;




	models.load_models({
	    model: 'pos.quotation',
	    fields: ['id','name','create_date','amount_total','partner_id','lines'],
	    domain: function(self){ return [['state','=','draft']]; },
	    loaded: function(self,quotations){
	    	self.quotations = quotations;
	    },
	});

	var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function() {
            _super_order.initialize.apply(this,arguments);
            this.wv_note = "";
            this.save_to_db();
            this.quotation_id = "";
            this.quot_id = false;
        },
        export_as_JSON: function() {
            var json = _super_order.export_as_JSON.apply(this,arguments);
            json.wv_note = this.wv_note;
            json.quotation_id = this.quotation_id;
            json.quot_id = this.quot_id;
            return json;
        },
        init_from_JSON: function(json) {
            _super_order.init_from_JSON.apply(this,arguments);
            this.wv_note = json.wv_note;
            this.quotation_id = json.quotation_id;
            this.quot_id = json.quot_id;
        },
        export_for_printing:function() {
            var json = _super_order.export_for_printing.apply(this,arguments);
            json.wv_note = this.wv_note;
            json.quotation_id = this.quotation_id;
            return json
        },
    });

    class CreateQuotationButton extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('click', this.onClick);
        }
        async onClick() {
            var self = this;
            await this.showPopup('CreateSaleOrderPopupWidget');
            
        }
        
    }
    CreateQuotationButton.template = 'CreateQuotationButton';

    ProductScreen.addControlButton({
        component: CreateQuotationButton,
        condition: function() {
            return this.env.pos.config.allow_create_quotation;
        },
    });

    Registries.Component.add(CreateQuotationButton);

    class CreateSaleOrderPopupWidget extends AbstractAwaitablePopup {
        constructor() {
            super(...arguments);
            this.state = useState({ inputValue: this.props.startingValue });
            this.inputRef = useRef('input');
            this.changes = {};
        }

        getPayload() {
            return this.state.inputValue;
        }

        async captureChange(event) {
            var order =this.env.pos.get('selectedOrder');
            if(order.get_client() != null){
                 order.wv_note = $(".wv_note").val();
                 // await this.save_order();

                  await this.save_order();
                 await this.trigger('close-popup');

            }
            else{
             alert("Customer is required for sale order. Please select customer first !!!!");
            }
            // this.cancel();
        }

        async print_quotation_bill(event) {
            var order =this.env.pos.get('selectedOrder');
            if(order.get_client() != null){
                 order.wv_note = $(".wv_note").val();
                await this.save_order2();
                await this.trigger('close-popup');
            }
            else{
             alert("Customer is required for sale order. Please select customer first !!!!");
            }
        }
        save_order(){
         var self = this;
         var order = self.env.pos.get_order();
         var data = order.export_as_JSON();

        return  self.rpc({
                  model: 'pos.quotation',
                  method: 'create_new_quotation',
                  args: [data],
              }).then(function (quotation_data) {
                while(order.get_orderlines().length > 0){
                    var line = order.get_selected_orderline();
                    order.remove_orderline(line);
                }
                order.set_client(null);
                self.env.pos.quotations.push(quotation_data['result'][0]);
              });
        }
        save_order2(){
	         var self = this;
	         var order = self.env.pos.get_order();
	         var data = order.export_as_JSON();

        	return  self.rpc({
                  model: 'pos.quotation',
                  method: 'create_new_quotation',
                  args: [data],
              }).then(function (quotation_data) {
                    self.env.pos.quotations.push(quotation_data['result'][0]);
                    order.order_ref = quotation_data['result'];
                    order.quotation_id = quotation_data['result'][0].name;
                    console.log("order.quotation_id",quotation_data);
                    self.showTempScreen('QuotationBillScreenWidget')
              });
        }

    }
    CreateSaleOrderPopupWidget.template = 'CreateSaleOrderPopupWidget';
    Registries.Component.add(CreateSaleOrderPopupWidget);
    CreateSaleOrderPopupWidget.defaultProps = {
        confirmText: 'Ok',
        cancelText: 'Cancel',
        title: 'Create Quotation',
        body: '',
    };

    const QuotationBillScreenWidget = (ReceiptScreen) => {
        class QuotationBillScreenWidget extends ReceiptScreen {
            confirm() {
                var order = this.env.pos.get_order();
                while(order.get_orderlines().length > 0){
                    var line = order.get_selected_orderline();
                    order.remove_orderline(line);
                }
                order.set_client(null);
                this.props.resolve({ confirmed: true, payload: null });
                this.trigger('close-temp-screen');
            }
        }
        QuotationBillScreenWidget.template = 'QuotationBillScreenWidget';
        return QuotationBillScreenWidget;
    };

    Registries.Component.addByExtending(QuotationBillScreenWidget, ReceiptScreen); 

    
    class QuotationListButton extends PosComponent {
        constructor() {
            super(...arguments);
            useListener('click', this.onClick);
        }
        async onClick() {
            var self = this;
            await self.showTempScreen('QuotationListScreenWidget')
            // await this.showPopup('CreateSaleOrderPopupWidget');
            
        }
        
    }
    QuotationListButton.template = 'QuotationListButton';

    ProductScreen.addControlButton({
        component: QuotationListButton,
        condition: function() {
            return this.env.pos.config.allow_create_quotation;
        },
    });

    Registries.Component.add(QuotationListButton);

    class QuotationListScreenWidget extends PosComponent {
        constructor() {
            super(...arguments);
            this.state = {
                query: null,
                selectedClient: this.props.client,
                detailIsShown: false,
                isEditMode: false,
                editModeProps: {
                    partner: {
                        country_id: this.env.pos.company.country_id,
                        state_id: this.env.pos.company.state_id,
                    }
                },
            };
            this.updateClientList = debounce(this.updateClientList, 70);
        }

        back() {
            this.trigger('close-temp-screen');
        }


        get currentOrder() {
            return this.env.pos.get_order();
        }
        perform_search(query){
        var quotations = this.env.pos.quotations;
        var results = [];
            for(var i = 0; i < quotations.length; i++){
                var res = this.search_quotations(query, quotations[i]);
                if(res != false){
                    results.push(res);
                }
            }
            return results;
        }
        search_quotations(query,quotations){
            try {
                query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g,'.');
                query = query.replace(' ','.+');
                var re = RegExp("([0-9]+):.*?"+query,"gi");
            }catch(e){
                return [];
            }
            var results = [];
            var r = re.exec(this._quotations_search_string(quotations));
            if(r){
                var id = Number(r[1]);
                return this.get_quotations_by_id(id);
            }
            return false;
        }
        get_quotations_by_id(id){
            var quotations = this.env.pos.quotations;
            for(var i=0;i<quotations.length;i++){
                if(quotations[i].id == id){
                    return quotations[i];
                }
            }
        }
        _quotations_search_string(quotations){
            var str =  quotations.name;
            if(quotations.partner_id){
                str += '|' + quotations.partner_id[1];
            }
            str = '' + quotations.id + ':' + str.replace(':','') + '\n';
            return str;
         }
        get clients() {
            if (this.state.query && this.state.query.trim() !== '') {
                return this.perform_search(this.state.query.trim());
            } else {
                return this.env.pos.quotations;
            }
        }
        updateClientList(event) {
            this.state.query = event.target.value;
            this.render();
        }

    }
    QuotationListScreenWidget.template = 'QuotationListScreenWidget';

    Registries.Component.add(QuotationListScreenWidget);

    class QuotationLine extends PosComponent {
        get_quotations_by_id(id){
             var quotations = this.env.pos.quotations;
             for(var i=0;i<quotations.length;i++){
                 if(quotations[i].id == id){
                     return quotations[i];
                 }
             }
        }
        load_quotation(quotation_id){
            var self = this;
             var quotation = self.get_quotations_by_id(quotation_id);
             var order = self.env.pos.get_order();
                var orderlines = order.get_orderlines();
             if(orderlines.length == 0){
                 self.rpc({
                        model: 'pos.quotation',
                        method: 'quotation_fetch_line',
                        args: [quotation.id],
                    }).then(function(quotation_data){
                     order.set('client',undefined);
                     order.quotation_id = quotation.name;
                     order.quot_id = quotation.id;
                     for(var j=0;j<self.env.pos.quotations.length;j++){
                         if(self.env.pos.quotations[j].id==quotation.id){
                             self.env.pos.quotations.splice(j,1);
                         }
                     }
                     if(quotation.partner_id){
                         order.set_client(self.env.pos.db.get_partner_by_id(quotation.partner_id[0]));
                     }
                     for(var i=0;i<quotation_data.length;i++){
                         var product = self.env.pos.db.get_product_by_id(quotation_data[i]['product_id'][0]);
                         order.add_product(product,{'quantity':quotation_data[i]['qty'],'discount':quotation_data[i]['discount']});
                     }
                     self.trigger('close-temp-screen');
                 });
         }
         else{
             alert("Please remove all products from cart and try again.");
         }
        }
    }
    QuotationLine.template = 'QuotationLine';

    Registries.Component.add(QuotationLine);
});
