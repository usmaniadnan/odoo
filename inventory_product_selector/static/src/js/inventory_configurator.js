odoo.define('purchase_product_selector.inventory_configurator', function (require) {

var relationalFields = require('web.relational_fields');
var FieldsRegistry = require('web.field_registry');
var core = require('web.core');
var _t = core._t;

/**
 * The purchase.product_matrix_configurator widget is a widget extending FieldMany2One
 * It triggers the opening of the matrix edition when the product has multiple variants.
 *
 *
 * !!! WARNING !!!
 *
 * This widget is only designed for Purchase Order Lines.
 * !!! It should only be used on a product_template field !!!
 */
var MrpConfiguratorWidget = relationalFields.FieldMany2One.extend({
    events: _.extend({}, relationalFields.FieldMany2One.prototype.events, {
        'click .o_edit_product_configuration': '_onEditProductConfiguration'
    }),

    /**
     * @override
     */
    _render: function () {
        console.log("inside rendere",this.mode,this.value);
       this._super.apply(this, arguments);
       if (this.mode === 'edit' && this.value &&
       (this._isConfigurableProduct())) {
           this._addProductLinkButton();
           this._addConfigurationEditButton();
       } else if (this.mode === 'edit' && this.value) {
           this._addProductLinkButton();
       } else {
           this.$('.o_edit_product_configuration').hide();
       }
    },

    /**
    * Add button linking to product_id/product_template_id form.
    */
    _addProductLinkButton: function () {
       if (this.$('.o_external_button').length === 0) {
           var $productLinkButton = $('<button>', {
               type: 'button',
               class: 'fa fa-external-link btn btn-secondary o_external_button',
               tabindex: '-1',
               draggable: false,
               'aria-label': _t('External Link'),
               title: _t('External Link')
           });

           var $inputDropdown = this.$('.o_input_dropdown');
           $inputDropdown.after($productLinkButton);
       }
    },

    /**
    * If current product is configurable,
    * Show edit button (in Edit Mode) after the product/product_template
    */
    _addConfigurationEditButton: function () {
       var $inputDropdown = this.$('.o_input_dropdown');

       if ($inputDropdown.length !== 0 &&
           this.$('.o_edit_product_configuration').length === 0) {
           var $editConfigurationButton = $('<button>', {
               type: 'button',
               class: 'fa fa-pencil btn btn-secondary o_edit_product_configuration',
               tabindex: '-1',
               draggable: false,
               'aria-label': _t('Edit Configuration'),
               title: _t('Edit Configuration')
           });

           $inputDropdown.after($editConfigurationButton);
       }
    },

    /**
     * Hook to override with _onEditProductConfiguration
     * to know if edit pencil button has to be put next to the field
     *
     * @private
     */
    _isConfigurableProduct: function () {
        console.log("inside   _isConfigurableProduct",this.recordData.is_configurable_product);
        return this.recordData.is_configurable_product;
    },

    /**
     * Override catching changes on product_id or product_template_id.
     * Calls _onTemplateChange in case of product_template change.
     * Calls _onProductChange in case of product change.
     * Shouldn't be overridden by product configurators
     * or only to setup some data for further computation
     * before calling super.
     *
     * @override
     */
    reset: async function (record, ev) {
        await this._super(...arguments);
         this.restoreProductTemplateId = this.recordData.product_tmpl_id;
         console.log("inside reset",ev,record)
         if(!this.recordData.product_id){
        if (ev && ev.target === this && ev.data.changes && ev.data.changes.product_tmpl_id && record.data.product_tmpl_id.data.id) {
            this._onTemplateChange(record.data.product_tmpl_id.data.id, ev.data.dataPointID);
            }
        }
    },

    /**
     * Hook for product_template based configurators
     * (product configurator, matrix, ...).
     *
     * @param {integer} productTemplateId
     * @param {String} dataPointID
     *
     * @private
     */
     _getPricelistId: function () {
         console.log("_getPricelistId",this.recordData,this.recordData.price_lst);
        return this.recordData.price_lst;
    },
    _onTemplateChange: function (productTemplateId, dataPointId) {
        console.log("inside _onTemplateChange")
        var self = this;

        return this._rpc({
            model: 'product.template',
            method: 'get_single_product_variant',
            args: [
                productTemplateId
            ]
        }).then(function (result) {
            if (result.product_id && !result.has_optional_products) {
                self.trigger_up('field_changed', {
                    dataPointID: dataPointId,
                    changes: {
                      product_id: {id: result.product_id}
//                        product_custom_attribute_value_ids: {
//                            operation: 'DELETE_ALL'
//                        }
                    },
                });
            } else {
                return self._openConfigurator(result, productTemplateId, dataPointId);
            }
            // always returns true for the moment because no other configurator exists.
        });
    },

    _addProducts: function (result, dataPointId) {
         console.log("inside _addProducts mrp",dataPointId,result);
         console.log("Ayesha",this._getMainProductChanges(result.mainProduct))

        this.trigger_up('field_changed', {
            dataPointID: dataPointId,
            preventProductIdCheck: true,
            optionalProducts: result.options,
            changes: this._getMainProductChanges(result.mainProduct)
        });
        console.log("after add");
        var self = this;
        //this._super.apply(this, arguments);
        var parentList = self.getParent();
        var unselectRow = (parentList.unselectRow || function() {}).bind(parentList);
        console.log("adnan",parentList);
        console.log("usmani",unselectRow)
        unselectRow();




    },

    /**
     * This will convert the result of the product configurator into
     * "changes" that are understood by the basic_model.js
     *
     * For the product_custom_attribute_value_ids, we need to do a DELETE_ALL
     * command to clean the currently selected values and then a CREATE for every
     * custom value specified in the configurator.
     *
     * For the product_no_variant_attribute_value_ids, we also need to do a DELETE_ALL
     * command to clean the currently selected values and issue a single ADD_M2M containing
     * all the ids of the product_attribute_values.
     *
     * @param {Object} mainProduct
     *
     * @private
     */
    _getMainProductChanges: function (mainProduct) {
        console.log("inside _getMainProductChanges mrp mainproduct ",mainProduct,result);
        var result = {
            product_id: {id: mainProduct.product_id},
            product_tmpl_id: {id: mainProduct.product_template_id} ,
            product_qty: mainProduct.quantity
        };

        console.log("inside _getMainProductChanges mrp result",result);

        var customAttributeValues = mainProduct.product_custom_attribute_values;
        console.log("inside _getMainProductChanges mrp customAttributeValues ",customAttributeValues,result);
        var customValuesCommands = [{operation: 'DELETE_ALL'}];
        if (customAttributeValues && customAttributeValues.length !== 0) {
            console.log("inside if of MRP");
            _.each(customAttributeValues, function (customValue) {
                // FIXME awa: This could be optimized by adding a "disableDefaultGet" to avoid
                // having multiple default_get calls that are useless since we already
                // have all the default values locally.
                // However, this would mean a lot of changes in basic_model.js to handle
                // those "default_" values and set them on the various fields (text,o2m,m2m,...).
                // -> This is not considered as worth it right now.
                customValuesCommands.push({
                    operation: 'CREATE',
                    context: [{
                        default_custom_product_template_attribute_value_id: customValue.custom_product_template_attribute_value_id,
                        default_custom_value: customValue.custom_value
                    }]
                });
            });
        }

//        result['product_custom_attribute_value_ids'] = {
//            operation: 'MULTI',
//            commands: customValuesCommands
//        };

        var noVariantAttributeValues = mainProduct.no_variant_attribute_values;
        var noVariantCommands = [{operation: 'DELETE_ALL'}];
        if (noVariantAttributeValues && noVariantAttributeValues.length !== 0) {
            var resIds = _.map(noVariantAttributeValues, function (noVariantValue) {
                return {id: parseInt(noVariantValue.value)};
            });

            noVariantCommands.push({
                operation: 'ADD_M2M',
                ids: resIds
            });
        }

//        result['product_no_variant_attribute_value_ids'] = {
//            operation: 'MULTI',
//            commands: noVariantCommands
//        };

        return result;
    },




    _openConfigurator: function (result, productTemplateId, dataPointId) {
        if (!result.mode || result.mode === 'configurator') {
            this._openProductConfigurator({
                    configuratorMode: result && result.has_optional_products ? 'options' : 'add',
                    default_pricelist_id: 1,
                    default_product_template_id: productTemplateId
                },
                dataPointId
            );
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    },


    /**
     * Hook for editing a configured line.
     * The button triggering this function is only shown in Edit mode,
     * when _isConfigurableProduct is True.
     *
     * @private
     */
    _onEditProductConfiguration: function () {

        console.log("inside  adnan  _onEditProductConfiguration",this.recordData.product_tmpl_id.data.id, this.recordData);
        if (this.recordData.is_configurable_product) {

            this._openProductConfigurator({
                default_pricelist_id: 1,
                    default_product_template_id: this.recordData.product_tmpl_id.data.id
            },this.dataPointID);
            //this._openMatrix(this.recordData.product_tmpl_id.data.id, this.dataPointID, true);
        }
    },




     _openProductConfigurator: function (data, dataPointId) {
        console.log("_openProductConfigurator",data,dataPointId);
        this.optionalProducts = undefined;
        var self = this;
        this.do_action('sale_product_configurator.sale_product_configurator_action', {
            additional_context: data,
            on_close: function (result) {
                if (result && !result.special) {
                    self._addProducts(result, dataPointId);
                }
//                else {after
//                    console.log("inside else");
//                    if (self.restoreProductTemplateId) {
//                        // if configurator opened in edit mode.
//                        self.trigger_up('field_changed', {
//                            dataPointID: dataPointId,
//                            preventProductIdCheck: true,
//                            changes: {
//                                product_tmpl_id: self.restoreProductTemplateId.data
//                            }
//                        });
//                    } else {
//                        // if configurator opened to create line:
//                        // destroy line if configurator closed during configuration process.
//                        self.trigger_up('field_changed', {
//                            dataPointID: dataPointId,
//                            changes: {
//                                product_tmpl_id: false,
//                                product_id: false,
//                            },
//                        });
//                    }
//                }
            }
        });
    },


    _openMatrix: function (productTemplateId, dataPointId, edit) {
         console.log("inside   _openMatrix");
        var attribs = edit ? this._getPTAVS() : [];
        console.log("inside   _openMatrix",attribs);
        this.trigger_up('open_matrix', {
            product_tmpl_id: productTemplateId,
            model: 'mrp.production',
            dataPointId: dataPointId,
            edit: edit,
            editedCellAttributes: attribs,
            // used to focus the cell representing the line on which the pencil was clicked.
        });
    },
    _onLineConfigured: function () {
    console.log("hihiihhihhii");
        var self = this;
        this._super.apply(this, arguments);
        var parentList = self.getParent();
        var unselectRow = (parentList.unselectRow || function() {}).bind(parentList); // form view on mobile
        if (self.optionalProducts && self.optionalProducts.length !== 0) {
            self.trigger_up('add_record', {
                context: self._productsToRecords(self.optionalProducts),
                forceEditable: 'bottom',
                allowWarning: true,
                onSuccess: function () {
                    // Leave edit mode of one2many list.
                    unselectRow();
                }
            });
        } else if (!self._isConfigurableLine() && self._isConfigurableProduct()) {
            // Leave edit mode of current line if line was configured
            // only through the product configurator.
            unselectRow();
        }
    },

    _productsToRecords: function (products) {


        var records = [];
        _.each(products, function (product) {
            var record = {
                default_product_id: product.product_id,
                default_product_template_id: product.product_template_id,
                default_product_qty: product.quantity
            };

            if (product.no_variant_attribute_values) {
                var defaultProductNoVariantAttributeValues = [];
                _.each(product.no_variant_attribute_values, function (attributeValue) {
                        defaultProductNoVariantAttributeValues.push(
                            [4, parseInt(attributeValue.value)]
                        );
                });
                record['default_product_no_variant_attribute_value_ids']
                    = defaultProductNoVariantAttributeValues;
            }

            if (product.product_custom_attribute_values) {
                var defaultCustomAttributeValues = [];
                _.each(product.product_custom_attribute_values, function (attributeValue) {
                    defaultCustomAttributeValues.push(
                            [0, 0, {
                                custom_product_template_attribute_value_id: attributeValue.custom_product_template_attribute_value_id,
                                custom_value: attributeValue.custom_value
                            }]
                        );
                });
                record['default_product_custom_attribute_value_ids']
                    = defaultCustomAttributeValues;
            }

            records.push(record);
        });

        return records;
    },

    /**
     * Returns the list of attribute ids (product.template.attribute.value)
     * from the current POLine.
    */
    _getPTAVS: function () {
        var PTAVSIDS = [];
        _.each(this.recordData.product_no_variant_attribute_value_ids.res_ids, function (id) {
            PTAVSIDS.push(id);
        });
        _.each(this.recordData.product_template_attribute_value_ids.res_ids, function (id) {
            PTAVSIDS.push(id);
        });
        return PTAVSIDS.sort(function (a, b) {return a - b;});
    }
});

FieldsRegistry.add('inventory_configurator', MrpConfiguratorWidget);

return MrpConfiguratorWidget

});
