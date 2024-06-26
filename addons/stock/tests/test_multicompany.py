# -*- coding: utf-8 -*-
# Part of autanac. See LICENSE file for full copyright and licensing details.

from autanac.exceptions import UserError
from autanac.tests.common import SavepointCase, Form


class TestMultiCompany(SavepointCase):
    @classmethod
    def setUpClass(cls):
        super(TestMultiCompany, cls).setUpClass()
        group_user = cls.env.ref('base.group_user')
        group_stock_manager = cls.env.ref('stock.group_stock_manager')

        cls.company_a = cls.env['res.company'].create({'name': 'Company A'})
        cls.company_b = cls.env['res.company'].create({'name': 'Company B'})
        cls.warehouse_a = cls.env['stock.warehouse'].search([('company_id', '=', cls.company_a.id)], limit=1)
        cls.warehouse_b = cls.env['stock.warehouse'].search([('company_id', '=', cls.company_b.id)], limit=1)
        cls.stock_location_a = cls.warehouse_a.lot_stock_id
        cls.stock_location_b = cls.warehouse_b.lot_stock_id

        cls.user_a = cls.env['res.users'].create({
            'name': 'user company a with access to company b',
            'login': 'user a',
            'groups_id': [(6, 0, [group_user.id, group_stock_manager.id])],
            'company_id': cls.company_a.id,
            'company_ids': [(6, 0, [cls.company_a.id, cls.company_b.id])]
        })
        cls.user_b = cls.env['res.users'].create({
            'name': 'user company a with access to company b',
            'login': 'user b',
            'groups_id': [(6, 0, [group_user.id, group_stock_manager.id])],
            'company_id': cls.company_b.id,
            'company_ids': [(6, 0, [cls.company_a.id, cls.company_b.id])]
        })

    def test_picking_type_1(self):
        """As a user of Company A, check it is not possible to use a warehouse of Company B in a
        picking type of Company A.
        """
        picking_type_company_a = self.env['stock.picking.type'].search([
            ('company_id', '=', self.company_a.id)
        ], limit=1)
        with self.assertRaises(UserError):
            picking_type_company_a.warehouse_id = self.warehouse_b

    def test_picking_type_2(self):
        """As a user of Company A, check it is not possible to change the company on an existing
        picking type of Company A to Company B.
        """
        picking_type_company_a = self.env['stock.picking.type'].search([
            ('company_id', '=', self.company_a.id)
        ], limit=1)
        with self.assertRaises(UserError):
            picking_type_company_a.with_user(self.user_a).company_id = self.company_b

    def test_putaway_1(self):
        """As a user of Company A, create a putaway rule with locations of Company A and set the
        company to Company B before saving. Check it is not possible.
        """
        stock_location_a_1 = self.env['stock.location'].with_user(self.user_a).create({
            'location_id': self.stock_location_a.id,
            'usage': 'internal',
            'name': 'A_1',
        })
        putaway_form = Form(self.env['stock.putaway.rule'])
        putaway_form.location_in_id = self.stock_location_a
        putaway_form.location_out_id = stock_location_a_1
        putaway_form.company_id = self.company_b
        with self.assertRaises(UserError):
            putaway_form.save()

    def test_putaway_2(self):
        """As a user of Company A, check it is not possible to change the company on an existing
        putaway rule to Company B.
        """
        stock_location_a_1 = self.env['stock.location'].with_user(self.user_a).create({
            'name': 'A_1',
            'location_id': self.stock_location_a.id,
            'usage': 'internal',
        })
        putaway_rule = self.env['stock.putaway.rule'].with_user(self.user_a).create({
            'location_in_id': self.stock_location_a.id,
            'location_out_id': stock_location_a_1.id
        })
        with self.assertRaises(UserError):
            putaway_rule.company_id = self.company_b

    def test_company_1(self):
        """Check it is not possible to use the internal transit location of Company B on Company A."""
        with self.assertRaises(UserError):
            self.company_a.internal_transit_location_id = self.company_b.internal_transit_location_id

    def test_partner_1(self):
        """On a partner without company, as a user of Company B, check it is not possible to use a
        location limited to Company A as `property_stock_supplier` or `property_stock_customer`.
        """
        shared_partner = self.env['res.partner'].create({
            'name': 'Shared Partner',
            'company_id': False,
        })
        with self.assertRaises(UserError):
            shared_partner.with_user(self.user_b).property_stock_customer = self.stock_location_a

    def test_inventory_1(self):
        """Create an inventory in Company A for a product limited to Company A and, as a user of company
        B, start the inventory and set its counted quantity to 10 before validating. The inventory
        lines and stock moves should belong to Company A. The inventory loss location used should be
        the one of Company A.
        """
        product = self.env['product.product'].create({
            'type': 'product',
            'company_id': self.company_a.id,
            'name': 'Product limited to company A',
        })
        inventory = self.env['stock.inventory'].with_user(self.user_a).create({})
        self.assertEqual(inventory.company_id, self.company_a)
        inventory.with_user(self.user_b).action_start()
        inventory.with_user(self.user_b).line_ids = [(0, 0, {
            'product_qty': 10,
            'product_id': product.id,
            'location_id': self.stock_location_a.id,
        })]
        inventory.with_user(self.user_b).action_validate()
        self.assertEqual(inventory.line_ids.company_id, self.company_a)
        self.assertEqual(inventory.move_ids.company_id, self.company_a)
        self.assertEqual(inventory.move_ids.location_id.company_id, self.company_a)

    def test_inventory_2(self):
        """Create an empty inventory in Company A and check it is not possible to use products limited
        to Company B in it.
        """
        product = self.env['product.product'].create({
            'name': 'product limited to company b',
            'company_id': self.company_b.id,
            'type': 'product'
        })
        inventory = self.env['stock.inventory'].with_user(self.user_a).create({})
        inventory.with_user(self.user_a).action_start()
        inventory.with_user(self.user_a).line_ids = [(0, 0, {
            'product_id': product.id,
            'product_qty': 10,
            'location_id': self.stock_location_a.id,
        })]
        with self.assertRaises(UserError):
            inventory.with_user(self.user_a).action_validate()

    def test_inventory_3(self):
        """As a user of Company A, check it is not possible to start an inventory adjustment for
        a product limited to Company B.
        """
        product = self.env['product.product'].create({
            'name': 'product limited to company b',
            'company_id': self.company_b.id,
            'type': 'product'
        })
        inventory = self.env['stock.inventory'].with_user(self.user_a).create({'product_ids': [(4, product.id)]})
        with self.assertRaises(UserError):
            inventory.with_user(self.user_a).action_start()

    def test_picking_1(self):
        """As a user of Company A, create a picking and use a picking type of Company B, check the
        create picking belongs to Company B.
        """
        picking_type_company_b = self.env['stock.picking.type'].search([('company_id', '=', self.company_b.id)], limit=1)
        picking_form = Form(self.env['stock.picking'].with_user(self.user_a))
        picking_form.picking_type_id = picking_type_company_b
        picking = picking_form.save()
        self.assertEqual(picking.company_id, self.company_b)

    def test_location_1(self):
        """Check it is not possible to set a location of Company B under a location of Company A."""
        with self.assertRaises(UserError):
            self.stock_location_b.location_id = self.stock_location_a

    def test_lot_1(self):
        """Check it is possible to create a stock.production.lot with the same name in Company A and
        Company B"""
        product_lot = self.env['product.product'].create({
            'type': 'product',
            'tracking': 'lot',
            'name': 'product lot',
        })
        self.env['stock.production.lot'].create({
            'name': 'lotA',
            'company_id': self.company_a.id,
            'product_id': product_lot.id,
        })
        self.env['stock.production.lot'].create({
            'name': 'lotA',
            'company_id': self.company_b.id,
            'product_id': product_lot.id,
        })

    def test_lot_2(self):
        """Validate a picking of Company A receiving lot1 while being logged into Company B. Check
        the lot is created in Company A.
        """
        product = self.env['product.product'].create({
            'type': 'product',
            'tracking': 'serial',
            'name': 'product',
        })
        picking = self.env['stock.picking'].with_user(self.user_a).create({
            'picking_type_id': self.warehouse_a.in_type_id.id,
            'location_id': self.env.ref('stock.stock_location_suppliers').id,
            'location_dest_id': self.stock_location_a.id,
        })
        self.assertEqual(picking.company_id, self.company_a)
        move1 = self.env['stock.move'].create({
            'name': 'test_lot_2',
            'picking_type_id': picking.picking_type_id.id,
            'location_id': picking.location_id.id,
            'location_dest_id': picking.location_dest_id.id,
            'product_id': product.id,
            'product_uom': product.uom_id.id,
            'product_uom_qty': 1.0,
            'picking_id': picking.id,
            'company_id': picking.company_id.id,
        })
        picking.with_user(self.user_b).action_confirm()
        self.assertEqual(picking.state, 'assigned')
        move1.with_user(self.user_b).move_line_ids[0].qty_done = 1
        move1.with_user(self.user_b).move_line_ids[0].lot_name = 'receipt_serial'
        self.assertEqual(move1.move_line_ids[0].company_id, self.company_a)
        picking.with_user(self.user_b).button_validate()
        self.assertEqual(picking.state, 'done')
        created_serial = self.env['stock.production.lot'].search([
            ('name', '=', 'receipt_serial')
        ])
        self.assertEqual(created_serial.company_id, self.company_a)

    def test_orderpoint_1(self):
        """As a user of company A, create an orderpoint for company B. Check itsn't possible to
        use a warehouse of companny A"""
        product = self.env['product.product'].create({
            'type': 'product',
            'name': 'shared product',
        })
        orderpoint = Form(self.env['stock.warehouse.orderpoint'].with_user(self.user_a))
        orderpoint.company_id = self.company_b
        orderpoint.warehouse_id = self.warehouse_b
        orderpoint.location_id = self.stock_location_a
        orderpoint.product_id = product
        with self.assertRaises(UserError):
            orderpoint.save()
        orderpoint.location_id = self.stock_location_b
        orderpoint = orderpoint.save()
        self.assertEqual(orderpoint.company_id, self.company_b)

    def test_orderpoint_2(self):
        """As a user of Company A, check it is not possible to change the company on an existing
        orderpoint to Company B.
        """
        product = self.env['product.product'].create({
            'type': 'product',
            'name': 'shared product',
        })
        orderpoint = Form(self.env['stock.warehouse.orderpoint'].with_user(self.user_a))
        orderpoint.company_id = self.company_a
        orderpoint.warehouse_id = self.warehouse_a
        orderpoint.location_id = self.stock_location_a
        orderpoint.product_id = product
        orderpoint = orderpoint.save()
        self.assertEqual(orderpoint.company_id, self.company_a)
        with self.assertRaises(UserError):
            orderpoint.company_id = self.company_b.id

    def test_product_1(self):
        """ As an user of Company A, checks we can or cannot create new product
        depending of its `company_id`."""
        # Creates a new product with no company_id and set a responsible.
        # The product must be created as there is no company on the product.
        product_form = Form(self.env['product.template'].with_user(self.user_a))
        product_form.name = 'Paramite Pie'
        product_form.responsible_id = self.user_b
        product = product_form.save()

        self.assertEqual(product.company_id.id, False)
        self.assertEqual(product.responsible_id.id, self.user_b.id)

        # Creates a new product belong to Company A and set a responsible belong
        # to Company B. The product mustn't be created as the product and the
        # user don't belong of the same company.
        self.user_b.company_ids = [(6, 0, [self.company_b.id])]
        product_form = Form(self.env['product.template'].with_user(self.user_a))
        product_form.name = 'Meech Munchy'
        product_form.company_id = self.company_a
        product_form.responsible_id = self.user_b

        with self.assertRaises(UserError):
            # Raises an UserError for company incompatibility.
            product = product_form.save()

        # Creates a new product belong to Company A and set a responsible belong
        # to Company A & B (default B). The product must be created as the user
        # belongs to product's company.
        self.user_b.company_ids = [(6, 0, [self.company_a.id, self.company_b.id])]
        product_form = Form(self.env['product.template'].with_user(self.user_a))
        product_form.name = 'Scrab Cake'
        product_form.company_id = self.company_a
        product_form.responsible_id = self.user_b
        product = product_form.save()

        self.assertEqual(product.company_id.id, self.company_a.id)
        self.assertEqual(product.responsible_id.id, self.user_b.id)

    def test_warehouse_1(self):
        """As a user of Company A, on its main warehouse, see it is impossible to change the
        company_id, to use a view location of another company, to set a picking type to one
        of another company
        """
        with self.assertRaises(UserError):
            self.warehouse_a.company_id = self.company_b.id
        with self.assertRaises(UserError):
            self.warehouse_a.view_location_id = self.warehouse_b.view_location_id
        with self.assertRaises(UserError):
            self.warehouse_a.pick_type_id = self.warehouse_b.pick_type_id

    def test_move_1(self):
        """See it is not possible to confirm a stock move of Company A with a picking type of
        Company B.
        """
        product = self.env['product.product'].create({
            'name': 'p1',
            'type': 'product'
        })
        picking_type_b = self.env['stock.picking.type'].search([
            ('company_id', '=', self.company_b.id),
        ], limit=1)
        move = self.env['stock.move'].create({
            'company_id': self.company_a.id,
            'picking_type_id': picking_type_b.id,
            'location_id': self.stock_location_a.id,
            'location_dest_id': self.stock_location_a.id,
            'product_id': product.id,
            'product_uom': product.uom_id.id,
            'name': 'stock_move',
        })
        with self.assertRaises(UserError):
            move._action_confirm()

    def test_move_2(self):
        """See it is not possible to confirm a stock move of Company A with a destination location
        of Company B.
        """
        product = self.env['product.product'].create({
            'name': 'p1',
            'type': 'product'
        })
        picking_type_b = self.env['stock.picking.type'].search([
            ('company_id', '=', self.company_b.id),
        ], limit=1)
        move = self.env['stock.move'].create({
            'company_id': self.company_a.id,
            'picking_type_id': picking_type_b.id,
            'location_id': self.stock_location_a.id,
            'location_dest_id': self.stock_location_b.id,
            'product_id': product.id,
            'product_uom': product.uom_id.id,
            'name': 'stock_move',
        })
        with self.assertRaises(UserError):
            move._action_confirm()

    def test_move_3(self):
        """See it is not possible to confirm a stock move of Company A with a product restricted to
        Company B.
        """
        product = self.env['product.product'].create({
            'name': 'p1',
            'type': 'product',
            'company_id': self.company_b.id,
        })
        picking_type_b = self.env['stock.picking.type'].search([
            ('company_id', '=', self.company_b.id),
        ], limit=1)
        move = self.env['stock.move'].create({
            'company_id': self.company_a.id,
            'picking_type_id': picking_type_b.id,
            'location_id': self.stock_location_a.id,
            'location_dest_id': self.stock_location_a.id,
            'product_id': product.id,
            'product_uom': product.uom_id.id,
            'name': 'stock_move',
        })
        with self.assertRaises(UserError):
            move._action_confirm()
