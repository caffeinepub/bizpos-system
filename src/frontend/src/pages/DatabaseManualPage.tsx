import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Download,
  Search,
} from "lucide-react";
import { useCallback, useState } from "react";

interface TableDef {
  name: string;
  description: string;
  sql: string;
}

interface SchemaGroup {
  id: string;
  title: string;
  tables: TableDef[];
}

const schemaGroups: SchemaGroup[] = [
  {
    id: "auth",
    title: "Authentication & System",
    tables: [
      {
        name: "companies",
        description: "Top-level company entities managed by the super user.",
        sql: `CREATE TABLE companies (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200)  NOT NULL,
  code         VARCHAR(50)   UNIQUE NOT NULL,
  address      TEXT,
  phone        VARCHAR(50),
  email        VARCHAR(150),
  tax_number   VARCHAR(100),
  logo_url     VARCHAR(500),
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`,
      },
      {
        name: "roles",
        description: "User roles with a JSON permissions array.",
        sql: `CREATE TABLE roles (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(100) NOT NULL,
  description  VARCHAR(500),
  permissions  JSON         NOT NULL COMMENT 'Array of permission keys e.g. ["pos","sales","inventory"]',
  is_active    TINYINT(1)  NOT NULL DEFAULT 1,
  created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_roles_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "users",
        description: "System users with role and company assignment.",
        sql: `CREATE TABLE users (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      BIGINT UNSIGNED,
  role_id         BIGINT UNSIGNED,
  name            VARCHAR(200) NOT NULL,
  email           VARCHAR(200) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  phone           VARCHAR(50),
  job_title       VARCHAR(150),
  department      VARCHAR(150),
  bio             TEXT,
  photo_url       VARCHAR(500),
  is_super_user   TINYINT(1)  NOT NULL DEFAULT 0,
  is_active       TINYINT(1)  NOT NULL DEFAULT 1,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_users_role    FOREIGN KEY (role_id)    REFERENCES roles(id)
);`,
      },
      {
        name: "user_warehouses",
        description: "Many-to-many: which warehouses a user can access.",
        sql: `CREATE TABLE user_warehouses (
  user_id      BIGINT UNSIGNED NOT NULL,
  warehouse_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, warehouse_id),
  CONSTRAINT fk_uw_user      FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_uw_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
);`,
      },
      {
        name: "user_shops",
        description: "Many-to-many: which shops a user can access.",
        sql: `CREATE TABLE user_shops (
  user_id  BIGINT UNSIGNED NOT NULL,
  shop_id  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, shop_id),
  CONSTRAINT fk_us_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_us_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);`,
      },
      {
        name: "audit_logs",
        description: "Immutable audit trail of all user actions.",
        sql: `CREATE TABLE audit_logs (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED,
  company_id   BIGINT UNSIGNED,
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(100),
  entity_id    VARCHAR(100),
  description  TEXT,
  ip_address   VARCHAR(50),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);`,
      },
    ],
  },
  {
    id: "hierarchy",
    title: "Warehouse & Shop Hierarchy",
    tables: [
      {
        name: "warehouses",
        description: "Physical stock-holding locations under a company.",
        sql: `CREATE TABLE warehouses (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   BIGINT UNSIGNED NOT NULL,
  name         VARCHAR(200) NOT NULL,
  code         VARCHAR(50)  NOT NULL,
  address      TEXT,
  manager      VARCHAR(200),
  is_active    TINYINT(1)  NOT NULL DEFAULT 1,
  created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_warehouse_code (company_id, code),
  CONSTRAINT fk_warehouses_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "shops",
        description: "Sales points (POS locations) linked to a warehouse.",
        sql: `CREATE TABLE shops (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(200) NOT NULL,
  code          VARCHAR(50)  NOT NULL,
  address       TEXT,
  phone         VARCHAR(50),
  is_active     TINYINT(1)  NOT NULL DEFAULT 1,
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_shop_code (warehouse_id, code),
  CONSTRAINT fk_shops_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);`,
      },
    ],
  },
  {
    id: "inventory",
    title: "Inventory & Products",
    tables: [
      {
        name: "item_categories",
        description:
          "Product categories with display sequence and optional accounting overrides.",
        sql: `CREATE TABLE item_categories (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id             BIGINT UNSIGNED NOT NULL,
  name                   VARCHAR(200) NOT NULL,
  code                   VARCHAR(50),
  seq_no                 INT          NOT NULL DEFAULT 0,
  inventory_account_id   BIGINT UNSIGNED COMMENT 'Override COA account',
  cogs_account_id        BIGINT UNSIGNED COMMENT 'Override COA account',
  revenue_account_id     BIGINT UNSIGNED COMMENT 'Override COA account',
  is_active              TINYINT(1)  NOT NULL DEFAULT 1,
  created_at             DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ic_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "item_brands",
        description: "Product brand master.",
        sql: `CREATE TABLE item_brands (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(200) NOT NULL,
  is_active  TINYINT(1)  NOT NULL DEFAULT 1,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ib_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "item_units",
        description: "Units of measure (pcs, kg, litre, box, etc.).",
        sql: `CREATE TABLE item_units (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id        BIGINT UNSIGNED NOT NULL,
  name              VARCHAR(100) NOT NULL,
  abbreviation      VARCHAR(20),
  conversion_factor DECIMAL(10,4) NOT NULL DEFAULT 1,
  is_active         TINYINT(1)  NOT NULL DEFAULT 1,
  created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_iu_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "items",
        description:
          "Product / item master with pricing, tax, reorder, and warehouse assignment.",
        sql: `CREATE TABLE items (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  warehouse_id     BIGINT UNSIGNED NOT NULL,
  category_id      BIGINT UNSIGNED,
  brand_id         BIGINT UNSIGNED,
  unit_id          BIGINT UNSIGNED,
  name             VARCHAR(300) NOT NULL,
  sku              VARCHAR(100) UNIQUE,
  barcode          VARCHAR(100),
  description      TEXT,
  cost_price       DECIMAL(15,4) NOT NULL DEFAULT 0,
  selling_price    DECIMAL(15,4) NOT NULL DEFAULT 0,
  tax_rate         DECIMAL(7,4)  NOT NULL DEFAULT 0 COMMENT 'Percentage',
  discount_rate    DECIMAL(7,4)  NOT NULL DEFAULT 0 COMMENT 'Percentage',
  reorder_level    INT           NOT NULL DEFAULT 0,
  reorder_qty      INT           NOT NULL DEFAULT 0,
  current_stock    INT           NOT NULL DEFAULT 0,
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_company   FOREIGN KEY (company_id)   REFERENCES companies(id),
  CONSTRAINT fk_items_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_items_category  FOREIGN KEY (category_id)  REFERENCES item_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_items_brand     FOREIGN KEY (brand_id)     REFERENCES item_brands(id) ON DELETE SET NULL,
  CONSTRAINT fk_items_unit      FOREIGN KEY (unit_id)      REFERENCES item_units(id) ON DELETE SET NULL
);`,
      },
      {
        name: "item_variants",
        description: "Size/color/weight variants of a parent item.",
        sql: `CREATE TABLE item_variants (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id         BIGINT UNSIGNED NOT NULL,
  variant_name    VARCHAR(200) NOT NULL COMMENT 'e.g. Red / XL',
  sku_suffix      VARCHAR(50),
  price_adjustment DECIMAL(15,4) NOT NULL DEFAULT 0,
  current_stock   INT           NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_iv_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);`,
      },
      {
        name: "stock_movements",
        description: "Immutable ledger of every inventory transaction.",
        sql: `CREATE TABLE stock_movements (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id       BIGINT UNSIGNED NOT NULL,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  type          ENUM('Sale','Purchase','Adjustment','GRN','Transfer-In','Transfer-Out','Return') NOT NULL,
  quantity      INT            NOT NULL COMMENT 'Positive = stock in, Negative = stock out',
  reference_id  VARCHAR(100)   COMMENT 'Sale ID, PO ID, GRN ID, etc.',
  notes         TEXT,
  created_by    BIGINT UNSIGNED,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sm_item      FOREIGN KEY (item_id)      REFERENCES items(id),
  CONSTRAINT fk_sm_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);`,
      },
      {
        name: "stock_adjustments",
        description: "Manual stock correction records.",
        sql: `CREATE TABLE stock_adjustments (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  item_id       BIGINT UNSIGNED NOT NULL,
  type          ENUM('Add','Remove') NOT NULL,
  quantity      INT           NOT NULL,
  reason        VARCHAR(500),
  created_by    BIGINT UNSIGNED,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sa_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_sa_item      FOREIGN KEY (item_id)      REFERENCES items(id)
);`,
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing (Taxes, Discounts, Promotions)",
    tables: [
      {
        name: "tax_rates",
        description: "Named tax rates assignable to products or categories.",
        sql: `CREATE TABLE tax_rates (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL COMMENT 'e.g. GST 10%, VAT 5%',
  rate        DECIMAL(7,4) NOT NULL,
  is_active   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tr_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "discounts",
        description: "Permanent percentage discounts per product or category.",
        sql: `CREATE TABLE discounts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(200) NOT NULL,
  rate        DECIMAL(7,4) NOT NULL COMMENT 'Percentage',
  item_id     BIGINT UNSIGNED COMMENT 'Null = applies to category',
  category_id BIGINT UNSIGNED COMMENT 'Null = applies to item',
  is_active   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_disc_company  FOREIGN KEY (company_id)  REFERENCES companies(id),
  CONSTRAINT fk_disc_item     FOREIGN KEY (item_id)     REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_disc_category FOREIGN KEY (category_id) REFERENCES item_categories(id) ON DELETE CASCADE
);`,
      },
      {
        name: "promotions",
        description: "Date-range promotions auto-applied at POS.",
        sql: `CREATE TABLE promotions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(200) NOT NULL,
  discount_type ENUM('Percentage','Fixed') NOT NULL DEFAULT 'Percentage',
  discount_value DECIMAL(15,4) NOT NULL,
  start_date    DATE  NOT NULL,
  end_date      DATE  NOT NULL,
  item_id       BIGINT UNSIGNED,
  category_id   BIGINT UNSIGNED,
  is_active     TINYINT(1)  NOT NULL DEFAULT 1,
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_promo_company  FOREIGN KEY (company_id)  REFERENCES companies(id),
  CONSTRAINT fk_promo_item     FOREIGN KEY (item_id)     REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_promo_category FOREIGN KEY (category_id) REFERENCES item_categories(id) ON DELETE CASCADE
);`,
      },
    ],
  },
  {
    id: "customers",
    title: "Customers & Suppliers",
    tables: [
      {
        name: "customer_groups",
        description:
          "Pricing tiers (Retail, Wholesale, VIP) with group-level discounts.",
        sql: `CREATE TABLE customer_groups (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id     BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(200) NOT NULL,
  discount_rate  DECIMAL(7,4) NOT NULL DEFAULT 0,
  is_active      TINYINT(1)  NOT NULL DEFAULT 1,
  created_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cg_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "customers",
        description:
          "Customer master with opening balance and group assignment.",
        sql: `CREATE TABLE customers (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  group_id         BIGINT UNSIGNED,
  name             VARCHAR(200) NOT NULL,
  email            VARCHAR(200),
  phone            VARCHAR(50),
  address          TEXT,
  tax_number       VARCHAR(100),
  opening_balance  DECIMAL(15,4) NOT NULL DEFAULT 0,
  current_balance  DECIMAL(15,4) NOT NULL DEFAULT 0 COMMENT 'Derived from transactions',
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cust_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_cust_group   FOREIGN KEY (group_id)   REFERENCES customer_groups(id) ON DELETE SET NULL
);`,
      },
      {
        name: "suppliers",
        description: "Supplier master with payment terms.",
        sql: `CREATE TABLE suppliers (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(200) NOT NULL,
  contact_person   VARCHAR(200),
  email            VARCHAR(200),
  phone            VARCHAR(50),
  address          TEXT,
  tax_number       VARCHAR(100),
  payment_terms    INT     NOT NULL DEFAULT 30 COMMENT 'Days',
  opening_balance  DECIMAL(15,4) NOT NULL DEFAULT 0,
  current_balance  DECIMAL(15,4) NOT NULL DEFAULT 0,
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sup_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
    ],
  },
  {
    id: "sales",
    title: "Sales & POS",
    tables: [
      {
        name: "sales",
        description: "Sales invoice header.",
        sql: `CREATE TABLE sales (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoice_number   VARCHAR(50)  UNIQUE NOT NULL,
  company_id       BIGINT UNSIGNED NOT NULL,
  shop_id          BIGINT UNSIGNED NOT NULL,
  warehouse_id     BIGINT UNSIGNED NOT NULL,
  customer_id      BIGINT UNSIGNED,
  cashier_id       BIGINT UNSIGNED NOT NULL,
  sale_date        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subtotal         DECIMAL(15,4) NOT NULL DEFAULT 0,
  discount_amount  DECIMAL(15,4) NOT NULL DEFAULT 0,
  promo_savings    DECIMAL(15,4) NOT NULL DEFAULT 0,
  tax_amount       DECIMAL(15,4) NOT NULL DEFAULT 0,
  total_amount     DECIMAL(15,4) NOT NULL DEFAULT 0,
  payment_method   ENUM('Cash','Card','Bank Transfer','Credit') NOT NULL DEFAULT 'Cash',
  payment_status   ENUM('Paid','Partial','Unpaid') NOT NULL DEFAULT 'Paid',
  notes            TEXT,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sales_company   FOREIGN KEY (company_id)   REFERENCES companies(id),
  CONSTRAINT fk_sales_shop      FOREIGN KEY (shop_id)      REFERENCES shops(id),
  CONSTRAINT fk_sales_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_sales_customer  FOREIGN KEY (customer_id)  REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_sales_cashier   FOREIGN KEY (cashier_id)   REFERENCES users(id)
);`,
      },
      {
        name: "sale_items",
        description: "Line items for each sale.",
        sql: `CREATE TABLE sale_items (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sale_id          BIGINT UNSIGNED NOT NULL,
  item_id          BIGINT UNSIGNED NOT NULL,
  item_name        VARCHAR(300) NOT NULL COMMENT 'Snapshot at time of sale',
  quantity         INT           NOT NULL,
  unit_price       DECIMAL(15,4) NOT NULL,
  discount_rate    DECIMAL(7,4)  NOT NULL DEFAULT 0,
  tax_rate         DECIMAL(7,4)  NOT NULL DEFAULT 0,
  line_total       DECIMAL(15,4) NOT NULL,
  CONSTRAINT fk_si_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_si_item FOREIGN KEY (item_id) REFERENCES items(id)
);`,
      },
      {
        name: "sales_returns",
        description: "Sales return header.",
        sql: `CREATE TABLE sales_returns (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  return_number  VARCHAR(50) UNIQUE NOT NULL,
  sale_id        BIGINT UNSIGNED NOT NULL,
  customer_id    BIGINT UNSIGNED,
  reason         VARCHAR(500),
  total_amount   DECIMAL(15,4) NOT NULL,
  status         ENUM('Draft','Confirmed') NOT NULL DEFAULT 'Draft',
  created_by     BIGINT UNSIGNED,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sr_sale     FOREIGN KEY (sale_id)     REFERENCES sales(id),
  CONSTRAINT fk_sr_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);`,
      },
      {
        name: "sales_return_items",
        description: "Line items for a sales return.",
        sql: `CREATE TABLE sales_return_items (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  return_id       BIGINT UNSIGNED NOT NULL,
  item_id         BIGINT UNSIGNED NOT NULL,
  quantity        INT           NOT NULL,
  unit_price      DECIMAL(15,4) NOT NULL,
  CONSTRAINT fk_sri_return FOREIGN KEY (return_id) REFERENCES sales_returns(id) ON DELETE CASCADE,
  CONSTRAINT fk_sri_item   FOREIGN KEY (item_id)   REFERENCES items(id)
);`,
      },
      {
        name: "credit_notes",
        description: "Credit notes issued for sales returns.",
        sql: `CREATE TABLE credit_notes (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  note_number    VARCHAR(50) UNIQUE NOT NULL,
  return_id      BIGINT UNSIGNED,
  customer_id    BIGINT UNSIGNED NOT NULL,
  amount         DECIMAL(15,4) NOT NULL,
  status         ENUM('Draft','Posted') NOT NULL DEFAULT 'Draft',
  notes          TEXT,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cn_return   FOREIGN KEY (return_id)   REFERENCES sales_returns(id) ON DELETE SET NULL,
  CONSTRAINT fk_cn_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
);`,
      },
      {
        name: "customer_payments",
        description: "Payments received from customers against sales invoices.",
        sql: `CREATE TABLE customer_payments (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_ref    VARCHAR(50) UNIQUE NOT NULL,
  customer_id    BIGINT UNSIGNED NOT NULL,
  sale_id        BIGINT UNSIGNED,
  amount         DECIMAL(15,4) NOT NULL,
  payment_method ENUM('Cash','Card','Bank Transfer','Cheque') NOT NULL,
  payment_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes          TEXT,
  created_by     BIGINT UNSIGNED,
  CONSTRAINT fk_cp_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_cp_sale     FOREIGN KEY (sale_id)     REFERENCES sales(id) ON DELETE SET NULL
);`,
      },
    ],
  },
  {
    id: "purchases",
    title: "Purchasing",
    tables: [
      {
        name: "purchase_orders",
        description: "Purchase order header.",
        sql: `CREATE TABLE purchase_orders (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_number      VARCHAR(50) UNIQUE NOT NULL,
  company_id     BIGINT UNSIGNED NOT NULL,
  warehouse_id   BIGINT UNSIGNED NOT NULL,
  supplier_id    BIGINT UNSIGNED NOT NULL,
  order_date     DATE    NOT NULL,
  expected_date  DATE,
  status         ENUM('Draft','Sent','Received','Cancelled') NOT NULL DEFAULT 'Draft',
  subtotal       DECIMAL(15,4) NOT NULL DEFAULT 0,
  tax_amount     DECIMAL(15,4) NOT NULL DEFAULT 0,
  total_amount   DECIMAL(15,4) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_by     BIGINT UNSIGNED,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_po_company   FOREIGN KEY (company_id)   REFERENCES companies(id),
  CONSTRAINT fk_po_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_po_supplier  FOREIGN KEY (supplier_id)  REFERENCES suppliers(id)
);`,
      },
      {
        name: "purchase_order_items",
        description: "Line items for a purchase order.",
        sql: `CREATE TABLE purchase_order_items (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  po_id         BIGINT UNSIGNED NOT NULL,
  item_id       BIGINT UNSIGNED NOT NULL,
  quantity      INT           NOT NULL,
  unit_cost     DECIMAL(15,4) NOT NULL,
  received_qty  INT           NOT NULL DEFAULT 0,
  line_total    DECIMAL(15,4) NOT NULL,
  CONSTRAINT fk_poi_po   FOREIGN KEY (po_id)   REFERENCES purchase_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_poi_item FOREIGN KEY (item_id) REFERENCES items(id)
);`,
      },
      {
        name: "purchases",
        description: "Purchase invoice / bill header (linked to a PO).",
        sql: `CREATE TABLE purchases (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bill_number    VARCHAR(50) UNIQUE NOT NULL,
  po_id          BIGINT UNSIGNED,
  supplier_id    BIGINT UNSIGNED NOT NULL,
  company_id     BIGINT UNSIGNED NOT NULL,
  warehouse_id   BIGINT UNSIGNED NOT NULL,
  bill_date      DATE    NOT NULL,
  due_date       DATE,
  status         ENUM('Draft','Received','Paid','Cancelled') NOT NULL DEFAULT 'Draft',
  subtotal       DECIMAL(15,4) NOT NULL DEFAULT 0,
  tax_amount     DECIMAL(15,4) NOT NULL DEFAULT 0,
  total_amount   DECIMAL(15,4) NOT NULL DEFAULT 0,
  paid_amount    DECIMAL(15,4) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_by     BIGINT UNSIGNED,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pur_po       FOREIGN KEY (po_id)        REFERENCES purchase_orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_pur_supplier FOREIGN KEY (supplier_id)  REFERENCES suppliers(id),
  CONSTRAINT fk_pur_company  FOREIGN KEY (company_id)   REFERENCES companies(id),
  CONSTRAINT fk_pur_wh       FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);`,
      },
      {
        name: "purchase_returns",
        description: "Purchase return header.",
        sql: `CREATE TABLE purchase_returns (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  return_number  VARCHAR(50) UNIQUE NOT NULL,
  purchase_id    BIGINT UNSIGNED NOT NULL,
  supplier_id    BIGINT UNSIGNED NOT NULL,
  reason         VARCHAR(500),
  total_amount   DECIMAL(15,4) NOT NULL,
  status         ENUM('Draft','Confirmed') NOT NULL DEFAULT 'Draft',
  created_by     BIGINT UNSIGNED,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pr_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id),
  CONSTRAINT fk_pr_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);`,
      },
      {
        name: "debit_notes",
        description: "Debit notes issued for purchase returns.",
        sql: `CREATE TABLE debit_notes (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  note_number  VARCHAR(50) UNIQUE NOT NULL,
  return_id    BIGINT UNSIGNED,
  supplier_id  BIGINT UNSIGNED NOT NULL,
  amount       DECIMAL(15,4) NOT NULL,
  status       ENUM('Draft','Posted') NOT NULL DEFAULT 'Draft',
  notes        TEXT,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dn_return   FOREIGN KEY (return_id)   REFERENCES purchase_returns(id) ON DELETE SET NULL,
  CONSTRAINT fk_dn_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);`,
      },
      {
        name: "supplier_payments",
        description: "Payments made to suppliers against purchase invoices.",
        sql: `CREATE TABLE supplier_payments (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  payment_ref    VARCHAR(50) UNIQUE NOT NULL,
  supplier_id    BIGINT UNSIGNED NOT NULL,
  purchase_id    BIGINT UNSIGNED,
  amount         DECIMAL(15,4) NOT NULL,
  payment_method ENUM('Cash','Bank Transfer','Cheque') NOT NULL,
  payment_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes          TEXT,
  created_by     BIGINT UNSIGNED,
  CONSTRAINT fk_sp_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  CONSTRAINT fk_sp_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE SET NULL
);`,
      },
    ],
  },
  {
    id: "accounting",
    title: "Accounting",
    tables: [
      {
        name: "coa_accounts",
        description:
          "Chart of Accounts — 4-level hierarchy. Leaf nodes (level 3) are used in journals.",
        sql: `CREATE TABLE coa_accounts (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  parent_id        BIGINT UNSIGNED COMMENT 'NULL = root level',
  code             VARCHAR(20)  NOT NULL,
  name             VARCHAR(200) NOT NULL,
  account_type     ENUM('Asset','Liability','Equity','Revenue','Expense') NOT NULL,
  level            TINYINT      NOT NULL DEFAULT 0 COMMENT '0=root, 1, 2, 3=leaf',
  is_leaf          TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Only leaf accounts used in journals',
  opening_balance  DECIMAL(15,4) NOT NULL DEFAULT 0,
  current_balance  DECIMAL(15,4) NOT NULL DEFAULT 0,
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_account_code (company_id, code),
  CONSTRAINT fk_coa_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_coa_parent  FOREIGN KEY (parent_id)  REFERENCES coa_accounts(id) ON DELETE RESTRICT
);`,
      },
      {
        name: "journal_entries",
        description:
          "Journal entry headers. Each entry must balance (DR = CR).",
        sql: `CREATE TABLE journal_entries (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entry_number   VARCHAR(50) UNIQUE NOT NULL,
  company_id     BIGINT UNSIGNED NOT NULL,
  entry_date     DATE    NOT NULL,
  description    VARCHAR(500),
  reference_type VARCHAR(100) COMMENT 'Sale, Purchase, Payment, Expense, Payroll, etc.',
  reference_id   VARCHAR(100),
  is_auto_posted TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '1 = system-generated',
  created_by     BIGINT UNSIGNED,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_je_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "journal_entry_lines",
        description: "Debit/credit lines for each journal entry.",
        sql: `CREATE TABLE journal_entry_lines (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entry_id     BIGINT UNSIGNED NOT NULL,
  account_id   BIGINT UNSIGNED NOT NULL,
  type         ENUM('Debit','Credit') NOT NULL,
  amount       DECIMAL(15,4) NOT NULL,
  description  VARCHAR(500),
  CONSTRAINT fk_jel_entry   FOREIGN KEY (entry_id)   REFERENCES journal_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_jel_account FOREIGN KEY (account_id) REFERENCES coa_accounts(id)
);`,
      },
      {
        name: "account_mapping",
        description:
          "Maps semantic account roles (Cash, Bank, A/R, etc.) to COA accounts.",
        sql: `CREATE TABLE account_mapping (
  id                     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id             BIGINT UNSIGNED UNIQUE NOT NULL,
  cash_account_id        BIGINT UNSIGNED,
  bank_account_id        BIGINT UNSIGNED,
  ar_account_id          BIGINT UNSIGNED COMMENT 'Accounts Receivable',
  ap_account_id          BIGINT UNSIGNED COMMENT 'Accounts Payable',
  inventory_account_id   BIGINT UNSIGNED,
  cogs_account_id        BIGINT UNSIGNED,
  revenue_account_id     BIGINT UNSIGNED,
  tax_payable_account_id BIGINT UNSIGNED,
  salary_expense_id      BIGINT UNSIGNED,
  salary_payable_id      BIGINT UNSIGNED,
  CONSTRAINT fk_am_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "financial_years",
        description:
          "Fiscal periods. Closed periods lock all transactions within them.",
        sql: `CREATE TABLE financial_years (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  status      ENUM('Open','Closed') NOT NULL DEFAULT 'Open',
  closed_at   DATETIME,
  closed_by   BIGINT UNSIGNED,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fy_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "expenses",
        description: "Operational expense records.",
        sql: `CREATE TABLE expenses (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id     BIGINT UNSIGNED NOT NULL,
  category_id    BIGINT UNSIGNED,
  description    VARCHAR(500) NOT NULL,
  amount         DECIMAL(15,4) NOT NULL,
  payment_method ENUM('Cash','Bank Transfer','Cheque') NOT NULL DEFAULT 'Cash',
  reference      VARCHAR(100),
  expense_date   DATE    NOT NULL,
  created_by     BIGINT UNSIGNED,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exp_company  FOREIGN KEY (company_id)  REFERENCES companies(id),
  CONSTRAINT fk_exp_category FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE SET NULL
);`,
      },
      {
        name: "expense_categories",
        description: "Expense category master.",
        sql: `CREATE TABLE expense_categories (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(200) NOT NULL,
  is_active   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ec_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
    ],
  },
  {
    id: "banking",
    title: "Banking",
    tables: [
      {
        name: "banks",
        description: "Bank master.",
        sql: `CREATE TABLE banks (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(200) NOT NULL,
  swift_code VARCHAR(50),
  is_active  TINYINT(1)  NOT NULL DEFAULT 1,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_banks_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "bank_branches",
        description: "Bank branches under each bank.",
        sql: `CREATE TABLE bank_branches (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bank_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(200) NOT NULL,
  address    TEXT,
  city       VARCHAR(100),
  is_active  TINYINT(1)  NOT NULL DEFAULT 1,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bb_bank FOREIGN KEY (bank_id) REFERENCES banks(id)
);`,
      },
      {
        name: "bank_accounts",
        description: "Bank accounts linked to COA accounts.",
        sql: `CREATE TABLE bank_accounts (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      BIGINT UNSIGNED NOT NULL,
  branch_id       BIGINT UNSIGNED NOT NULL,
  coa_account_id  BIGINT UNSIGNED NOT NULL,
  account_title   VARCHAR(200) NOT NULL,
  account_number  VARCHAR(100) UNIQUE NOT NULL,
  currency        VARCHAR(10)  NOT NULL DEFAULT 'PKR',
  opening_balance DECIMAL(15,4) NOT NULL DEFAULT 0,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ba_company FOREIGN KEY (company_id)     REFERENCES companies(id),
  CONSTRAINT fk_ba_branch  FOREIGN KEY (branch_id)      REFERENCES bank_branches(id),
  CONSTRAINT fk_ba_coa     FOREIGN KEY (coa_account_id) REFERENCES coa_accounts(id)
);`,
      },
      {
        name: "bank_transactions",
        description:
          "All bank transactions (deposits, withdrawals, transfers).",
        sql: `CREATE TABLE bank_transactions (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bank_account_id BIGINT UNSIGNED NOT NULL,
  type            ENUM('Deposit','Withdrawal','Transfer') NOT NULL,
  amount          DECIMAL(15,4) NOT NULL,
  reference       VARCHAR(100),
  description     VARCHAR(500),
  transaction_date DATE NOT NULL,
  is_reconciled   TINYINT(1)  NOT NULL DEFAULT 0,
  created_by      BIGINT UNSIGNED,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bt_account FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);`,
      },
      {
        name: "cheque_books",
        description: "Cheque books issued to bank accounts.",
        sql: `CREATE TABLE cheque_books (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bank_account_id BIGINT UNSIGNED NOT NULL,
  series_start    INT NOT NULL,
  series_end      INT NOT NULL,
  issued_date     DATE NOT NULL,
  status          ENUM('Active','Exhausted','Cancelled') NOT NULL DEFAULT 'Active',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cb_account FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id)
);`,
      },
    ],
  },
  {
    id: "hr",
    title: "HR & Payroll",
    tables: [
      {
        name: "departments",
        description: "Organisational departments.",
        sql: `CREATE TABLE departments (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(200) NOT NULL,
  is_active  TINYINT(1)  NOT NULL DEFAULT 1,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dept_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "designations",
        description: "Job titles linked to departments.",
        sql: `CREATE TABLE designations (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(200) NOT NULL,
  is_active     TINYINT(1)  NOT NULL DEFAULT 1,
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_desig_company FOREIGN KEY (company_id)    REFERENCES companies(id),
  CONSTRAINT fk_desig_dept   FOREIGN KEY (department_id) REFERENCES departments(id)
);`,
      },
      {
        name: "shifts",
        description: "Work shifts.",
        sql: `CREATE TABLE shifts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  BIGINT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL COMMENT 'Morning, Afternoon, Night',
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_active   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shifts_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "allowance_types",
        description: "Allowance type master (Housing, Travel, Medical, etc.).",
        sql: `CREATE TABLE allowance_types (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(200) NOT NULL,
  type          ENUM('Fixed','Percentage') NOT NULL DEFAULT 'Fixed',
  default_value DECIMAL(15,4) NOT NULL DEFAULT 0,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_at_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "employees",
        description: "Employee master record.",
        sql: `CREATE TABLE employees (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       BIGINT UNSIGNED NOT NULL,
  department_id    BIGINT UNSIGNED,
  designation_id   BIGINT UNSIGNED,
  shift_id         BIGINT UNSIGNED,
  user_id          BIGINT UNSIGNED COMMENT 'Linked system user if any',
  name             VARCHAR(200) NOT NULL,
  employee_code    VARCHAR(50)  UNIQUE,
  email            VARCHAR(200),
  phone            VARCHAR(50),
  national_id      VARCHAR(50),
  joining_date     DATE,
  salary_type      ENUM('Monthly','Hourly','Daily') NOT NULL DEFAULT 'Monthly',
  basic_salary     DECIMAL(15,4) NOT NULL DEFAULT 0,
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_emp_company FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_emp_dept    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_emp_desig   FOREIGN KEY (designation_id) REFERENCES designations(id) ON DELETE SET NULL,
  CONSTRAINT fk_emp_shift   FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE SET NULL
);`,
      },
      {
        name: "employee_allowances",
        description: "Allowances assigned to individual employees.",
        sql: `CREATE TABLE employee_allowances (
  id                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id        BIGINT UNSIGNED NOT NULL,
  allowance_type_id  BIGINT UNSIGNED NOT NULL,
  amount             DECIMAL(15,4) NOT NULL,
  CONSTRAINT fk_ea_employee FOREIGN KEY (employee_id)       REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_ea_type     FOREIGN KEY (allowance_type_id) REFERENCES allowance_types(id)
);`,
      },
      {
        name: "salary_slips",
        description: "Generated payroll salary slips.",
        sql: `CREATE TABLE salary_slips (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slip_number      VARCHAR(50) UNIQUE NOT NULL,
  employee_id      BIGINT UNSIGNED NOT NULL,
  period_month     TINYINT   NOT NULL COMMENT '1-12',
  period_year      SMALLINT  NOT NULL,
  basic_salary     DECIMAL(15,4) NOT NULL,
  total_allowances DECIMAL(15,4) NOT NULL DEFAULT 0,
  total_deductions DECIMAL(15,4) NOT NULL DEFAULT 0,
  net_salary       DECIMAL(15,4) NOT NULL,
  status           ENUM('Draft','Finalized') NOT NULL DEFAULT 'Draft',
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ss_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);`,
      },
      {
        name: "attendance",
        description: "Daily attendance records per employee.",
        sql: `CREATE TABLE attendance (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id  BIGINT UNSIGNED NOT NULL,
  date         DATE    NOT NULL,
  status       ENUM('Present','Absent','Half-Day','Leave') NOT NULL,
  notes        VARCHAR(500),
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance (employee_id, date),
  CONSTRAINT fk_att_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);`,
      },
      {
        name: "leave_requests",
        description: "Employee leave applications.",
        sql: `CREATE TABLE leave_requests (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id  BIGINT UNSIGNED NOT NULL,
  leave_type   VARCHAR(100) NOT NULL COMMENT 'Annual, Sick, Casual, Unpaid',
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  reason       TEXT,
  status       ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  approved_by  BIGINT UNSIGNED,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lr_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);`,
      },
    ],
  },
  {
    id: "supplychain",
    title: "Supply Chain",
    tables: [
      {
        name: "purchase_requisitions",
        description: "Internal procurement requests.",
        sql: `CREATE TABLE purchase_requisitions (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  req_number    VARCHAR(50) UNIQUE NOT NULL,
  company_id    BIGINT UNSIGNED NOT NULL,
  requested_by  BIGINT UNSIGNED NOT NULL,
  approved_by   BIGINT UNSIGNED,
  status        ENUM('Pending','Approved','Rejected','Converted') NOT NULL DEFAULT 'Pending',
  notes         TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_preq_company FOREIGN KEY (company_id) REFERENCES companies(id)
);`,
      },
      {
        name: "purchase_requisition_items",
        description: "Items requested in a purchase requisition.",
        sql: `CREATE TABLE purchase_requisition_items (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  req_id       BIGINT UNSIGNED NOT NULL,
  item_id      BIGINT UNSIGNED NOT NULL,
  quantity     INT NOT NULL,
  notes        VARCHAR(500),
  CONSTRAINT fk_pri_req  FOREIGN KEY (req_id)  REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
  CONSTRAINT fk_pri_item FOREIGN KEY (item_id) REFERENCES items(id)
);`,
      },
      {
        name: "goods_receipts",
        description: "Goods Receipt Notes (GRN) against purchase orders.",
        sql: `CREATE TABLE goods_receipts (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  grn_number    VARCHAR(50) UNIQUE NOT NULL,
  po_id         BIGINT UNSIGNED NOT NULL,
  warehouse_id  BIGINT UNSIGNED NOT NULL,
  received_date DATE    NOT NULL,
  status        ENUM('Draft','Accepted','Partially Accepted','Rejected') NOT NULL DEFAULT 'Draft',
  notes         TEXT,
  received_by   BIGINT UNSIGNED,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_grn_po        FOREIGN KEY (po_id)        REFERENCES purchase_orders(id),
  CONSTRAINT fk_grn_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);`,
      },
      {
        name: "goods_receipt_items",
        description:
          "Line items for a GRN with accepted and rejected quantities.",
        sql: `CREATE TABLE goods_receipt_items (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  grn_id         BIGINT UNSIGNED NOT NULL,
  item_id        BIGINT UNSIGNED NOT NULL,
  ordered_qty    INT NOT NULL,
  accepted_qty   INT NOT NULL DEFAULT 0,
  rejected_qty   INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_gri_grn  FOREIGN KEY (grn_id)  REFERENCES goods_receipts(id) ON DELETE CASCADE,
  CONSTRAINT fk_gri_item FOREIGN KEY (item_id) REFERENCES items(id)
);`,
      },
      {
        name: "inventory_transfers",
        description: "Stock transfers between warehouses.",
        sql: `CREATE TABLE inventory_transfers (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transfer_number      VARCHAR(50) UNIQUE NOT NULL,
  from_warehouse_id    BIGINT UNSIGNED NOT NULL,
  to_warehouse_id      BIGINT UNSIGNED NOT NULL,
  status               ENUM('Draft','In Transit','Completed','Cancelled') NOT NULL DEFAULT 'Draft',
  notes                TEXT,
  created_by           BIGINT UNSIGNED,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at         DATETIME,
  CONSTRAINT fk_it_from FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
  CONSTRAINT fk_it_to   FOREIGN KEY (to_warehouse_id)   REFERENCES warehouses(id)
);`,
      },
      {
        name: "inventory_transfer_items",
        description: "Items in an inventory transfer.",
        sql: `CREATE TABLE inventory_transfer_items (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transfer_id  BIGINT UNSIGNED NOT NULL,
  item_id      BIGINT UNSIGNED NOT NULL,
  quantity     INT NOT NULL,
  CONSTRAINT fk_iti_transfer FOREIGN KEY (transfer_id) REFERENCES inventory_transfers(id) ON DELETE CASCADE,
  CONSTRAINT fk_iti_item     FOREIGN KEY (item_id)     REFERENCES items(id)
);`,
      },
    ],
  },
  {
    id: "tickets",
    title: "Tickets & Attachments",
    tables: [
      {
        name: "tickets",
        description: "Internal IT and customer support tickets.",
        sql: `CREATE TABLE tickets (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  company_id   BIGINT UNSIGNED NOT NULL,
  type         ENUM('Internal','Customer') NOT NULL DEFAULT 'Internal',
  subject      VARCHAR(500) NOT NULL,
  description  TEXT,
  priority     ENUM('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  status       ENUM('Open','Assigned','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Open',
  assigned_to  BIGINT UNSIGNED,
  customer_id  BIGINT UNSIGNED,
  created_by   BIGINT UNSIGNED,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tick_company  FOREIGN KEY (company_id) REFERENCES companies(id),
  CONSTRAINT fk_tick_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tick_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);`,
      },
      {
        name: "attachments",
        description: "Document attachments for any entity (polymorphic).",
        sql: `CREATE TABLE attachments (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type   VARCHAR(100) NOT NULL COMMENT 'sale, purchase, employee, ticket, grn, etc.',
  entity_id     BIGINT UNSIGNED NOT NULL,
  file_name     VARCHAR(500) NOT NULL,
  file_type     VARCHAR(100) COMMENT 'MIME type',
  file_url      VARCHAR(1000) NOT NULL COMMENT 'Storage path or URL',
  doc_type      VARCHAR(100)  COMMENT 'Invoice, Contract, Receipt, PO Document, etc.',
  notes         VARCHAR(500),
  uploaded_by   BIGINT UNSIGNED,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_entity (entity_type, entity_id)
);`,
      },
    ],
  },
];

export default function DatabaseManualPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["auth"]));
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const toggleGroup = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const navigateToGroup = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleCopy = (sql: string, name: string) => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(name);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleCopyAll = () => {
    const allSQL = schemaGroups
      .flatMap((g) => g.tables.map((t) => `-- ${t.name}\n${t.sql}`))
      .join("\n\n");
    navigator.clipboard.writeText(allSQL).then(() => {
      setCopied("all");
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleDownloadSQL = () => {
    const header = `-- ============================================================\n-- BizPOS — Complete MySQL Database Schema\n-- Generated: ${new Date().toISOString()}\n-- ============================================================\n-- Run this script on MySQL 8.0+ to create the complete schema.\n-- Order matters: parent tables must exist before child tables.\n-- ============================================================\n\nSET FOREIGN_KEY_CHECKS = 0;\nCREATE DATABASE IF NOT EXISTS bizpos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE bizpos;\n\n`;
    const allSQL = schemaGroups
      .flatMap((g) => [
        `-- ----------------------------------------\n-- ${g.title}\n-- ----------------------------------------`,
        ...g.tables.map((t) => `-- ${t.name}\n-- ${t.description}\n${t.sql}`),
      ])
      .join("\n\n");
    const footer = "\n\nSET FOREIGN_KEY_CHECKS = 1;\n";
    const blob = new Blob([header + allSQL + footer], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bizpos-mysql-schema.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    const JsPDFCtor = (window as any).jspdf?.jsPDF ?? (window as any).jsPDF;
    const doc = new JsPDFCtor({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 12;
    const codeW = pageW - margin * 2;
    let y = 20;

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("BizPOS — MySQL Database Schema", margin, 19);
    y = 38;

    for (const group of schemaGroups) {
      if (y > 265) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(group.title, margin, y);
      y += 8;

      for (const table of group.tables) {
        if (y > 255) {
          doc.addPage();
          y = 15;
        }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text(table.name, margin, y);
        y += 5;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        const desc = doc.splitTextToSize(table.description, codeW);
        doc.text(desc, margin, y);
        y += desc.length * 4 + 2;

        doc.setFillColor(248, 250, 252);
        const sqlLines = doc.splitTextToSize(table.sql, codeW - 4);
        const blockH = sqlLines.length * 4.5 + 6;
        if (y + blockH > 280) {
          doc.addPage();
          y = 15;
        }
        doc.rect(margin, y, codeW, blockH, "F");
        doc.setFont("courier", "normal");
        doc.setFontSize(7);
        doc.setTextColor(20, 20, 20);
        for (const line of sqlLines as string[]) {
          doc.text(line, margin + 2, y + 4.5);
          y += 4.5;
        }
        y += 10;
      }
      y += 4;
    }

    doc.save("BizPOS-MySQL-Schema.pdf");
  };

  const filtered = search.trim()
    ? schemaGroups
        .map((g) => ({
          ...g,
          tables: g.tables.filter(
            (t) =>
              t.name.toLowerCase().includes(search.toLowerCase()) ||
              t.description.toLowerCase().includes(search.toLowerCase()) ||
              t.sql.toLowerCase().includes(search.toLowerCase()),
          ),
        }))
        .filter((g) => g.tables.length > 0)
    : schemaGroups;

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Database className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-gray-800 text-sm">DB Schema</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search tables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <nav className="p-2">
          {filtered.map((g) => (
            <button
              type="button"
              key={g.id}
              onClick={() => navigateToGroup(g.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors mb-0.5 ${
                expanded.has(g.id)
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="flex-1 truncate">{g.title}</span>
              <span className="text-gray-400 text-xs">{g.tables.length}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200 space-y-2">
          <button
            type="button"
            onClick={handleDownloadSQL}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download .sql
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleCopyAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs hover:bg-gray-50 transition-colors"
          >
            {copied === "all" ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied === "all" ? "Copied!" : "Copy All SQL"}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              MySQL Database Schema
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Complete DDL for all BizPOS tables. Run on MySQL 8.0+. Use the
              sidebar to filter by module or download the full .sql file.
            </p>
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Important:</strong> Create tables in order (top to bottom)
              due to foreign key dependencies. Run{" "}
              <code className="bg-amber-100 px-1 rounded">
                SET FOREIGN_KEY_CHECKS = 0;
              </code>{" "}
              before the full import and{" "}
              <code className="bg-amber-100 px-1 rounded">
                SET FOREIGN_KEY_CHECKS = 1;
              </code>{" "}
              after.
            </div>
          </div>

          {filtered.map((group) => (
            <div key={group.id} id={group.id} className="mb-6">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center gap-3 mb-3"
              >
                <h2 className="font-bold text-gray-800 text-base">
                  {group.title}
                </h2>
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-500">
                  {group.tables.length} tables
                </span>
                {expanded.has(group.id) ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {expanded.has(group.id) && (
                <div className="space-y-3">
                  {group.tables.map((table) => (
                    <div
                      key={table.name}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleTable(table.name)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <code className="text-blue-700 font-mono font-semibold text-sm">
                          {table.name}
                        </code>
                        <span className="text-gray-500 text-xs flex-1 truncate">
                          {table.description}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(table.sql, table.name);
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-gray-200 text-gray-600 hover:bg-gray-100"
                        >
                          {copied === table.name ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copied === table.name ? "Copied" : "Copy"}
                        </button>
                        {expandedTables.has(table.name) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      {expandedTables.has(table.name) && (
                        <div className="border-t border-gray-100">
                          <pre className="p-4 text-xs font-mono text-gray-800 bg-slate-50 overflow-x-auto whitespace-pre">
                            {table.sql}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
