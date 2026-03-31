import Array "mo:core/Array";
import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Blob "mo:core/Blob";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Debug "mo:core/Debug";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Char "mo:core/Char";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Blob storage
  include MixinStorage();

  type Decimal = Float;

  // Contacts and Addresses
  module Contacts {
    public type Address = {
      street : Text;
      city : Text;
      state : Text;
      zip : Text;
      country : Text;
    };

    public type Contact = {
      name : Text;
      phone : Text;
      email : Text;
      address : Address;
    };
  };
  type Address = Contacts.Address;
  type Contact = Contacts.Contact;

  // Warehouse and Inventory Management
  module Warehouse {
    public type WarehouseKey = Nat;
    public type Warehouse = {
      name : Text;
      location : Text;
    };

    public type Item = {
      code : Text;
      name : Text;
      price : Float;
      quantity : Float;
      warehouse : Warehouse;
    };

    public func compare(w1 : Warehouse, w2 : Warehouse) : { #less; #equal; #greater } {
      Text.compare(w1.name, w2.name);
    };

    public func compareItem(i1 : Item, i2 : Item) : { #less; #equal; #greater } {
      Text.compare(i1.name, i2.name);
    };

    public func createWarehouse(name : Text, location : Text) : Warehouse {
      { name; location };
    };
  };
  type Warehouse = Warehouse.Warehouse;
  type WarehouseKey = Warehouse.WarehouseKey;

  // POS System and Order Management
  module POS {
    public func createItem(code : Text, name : Text, price : Float, quantity : Float, warehouse : Warehouse) : Warehouse.Item {
      { code; name; price; quantity; warehouse };
    };

    public type PosItem = {
      code : Text;
      name : Text;
      price : Float;
      quantity : Float;
    };

    public type Order = {
      id : Nat;
      items : [PosItem];
      total : Float;
      status : Text;
    };

    public type Customer = Contact;

    public func createOrder(
      id : Nat,
      items : [PosItem],
      total : Float,
      status : Text
    ) : Order {
      { id; items; total; status };
    };

    public func addItem(items : [Warehouse.Item], item : Warehouse.Item) : [Warehouse.Item] {
      items.concat([item]);
    };

    public func createCustomer(name : Text, phone : Text, email : Text, address : Address) : Customer {
      { name; phone; email; address };
    };
  };
  type Item = Warehouse.Item;
  type Customer = POS.Customer;
  type Order = POS.Order;
  type PosItem = POS.PosItem;

  // Supplier and Purchase Management
  module Supplier {
    public func createSupplier(name : Text, phone : Text, email : Text, address : Address) : Contact {
      { name; phone; email; address };
    };

    public type Supplier = Contact;

    public type Purchase = {
      id : Nat;
      item : Item;
      supplier : Supplier;
      quantity : Float;
      total_cost : Float;
    };

    public func createPurchase(id : Nat, item : Item, supplier : Supplier, quantity : Float, total_cost : Float) : Purchase {
      { id; item; supplier; quantity; total_cost };
    };
  };
  type Supplier = Supplier.Supplier;
  type Purchase = Supplier.Purchase;

  // Payment and Accounting
  module PaymentSystem {
    public type Payment = {
      id : Nat;
      payer : Contact;
      amount : Float;
      payment_method : Text;
      reference_number : Text;
    };

    public type Account = {
      id : Nat;
      name : Text;
      balance : Float;
      transactions : [Transaction];
    };

    public type Transaction = {
      id : Nat;
      amount : Float;
      transaction_type : Text;
    };

    public func createPayment(id : Nat, payer : Contact, amount : Float, payment_method : Text, reference_number : Text) : Payment {
      { id; payer; amount; payment_method; reference_number };
    };

    public func createAccount(id : Nat, name : Text, balance : Float, transactions : [Transaction]) : Account {
      { id; name; balance; transactions };
    };

    public func createTransaction(id : Nat, amount : Float, transaction_type : Text) : Transaction {
      { id; amount; transaction_type };
    };
  };
  type Payment = PaymentSystem.Payment;
  type Account = PaymentSystem.Account;
  type Transaction = PaymentSystem.Transaction;

  // Reports and Statistics
  module Reports {
    public type Report = {
      name : Text;
      total_sales : Float;
      total_purchases : Float;
      total_inventory : Float;
      total_payments : Float;
      total_accounts : Float;
    };

    public func createReport(
      name : Text,
      total_sales : Float,
      total_purchases : Float,
      total_inventory : Float,
      total_payments : Float,
      total_accounts : Float,
    ) : Report {
      {
        name;
        total_sales;
        total_purchases;
        total_inventory;
        total_payments;
        total_accounts;
      };
    };
  };
  type Report = Reports.Report;

  // Settings and Configurations
  module Settings {
    public type Settings = {
      name : Text;
      system_id : Nat;
      company : Contact;
    };

    public func createSettings(name : Text, system_id : Nat, company : Contact) : Settings {
      {
        name;
        system_id;
        company;
      };
    };
  };
  type Settings = Settings.Settings;

  // User Profile
  public type UserProfile = {
    name : Text;
    email : Text;
    role : Text;
  };

  // Data structures
  let warehouseData = Map.empty<WarehouseKey, Warehouse>();
  let itemData = Map.empty<Text, Item>();
  let customerData = Map.empty<Text, Customer>();
  let supplierData = Map.empty<Text, Supplier>();
  let orderData = Map.empty<Nat, Order>();
  let purchaseData = Map.empty<Nat, Purchase>();
  let paymentData = Map.empty<Nat, Payment>();
  let accountData = Map.empty<Nat, Account>();
  let reportData = Map.empty<Text, Report>();
  var currentSettings : Settings = { name = ""; system_id = 0; company = { name = ""; phone = ""; email = ""; address = { street = ""; city = ""; state = ""; zip = ""; country = "" } } };
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or admin can view all");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Warehouse Management - Admin Only
  public shared ({ caller }) func initializeWarehouseData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can initialize warehouse data");
    };
    let existingWarehouse = warehouseData.get(0);
    switch (existingWarehouse) {
      case (null) {
        let mainWarehouse = { name = "Main Warehouse"; location = "Nairobi" };
        warehouseData.add(0, mainWarehouse);
      };
      case (?_) { Debug.print("Warehouse data already initialized. Skipping initialization.") };
    };
  };

  public shared ({ caller }) func addInitialWarehouse() : async () { () };

  public shared ({ caller }) func addWarehouse(id : WarehouseKey, name : Text, location : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add warehouses");
    };
    let warehouse = Warehouse.createWarehouse(name, location);
    warehouseData.add(id, warehouse);
  };

  public shared ({ caller }) func editWarehouse(id : WarehouseKey, name : Text, location : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can edit warehouses");
    };
    let warehouse = Warehouse.createWarehouse(name, location);
    warehouseData.add(id, warehouse);
  };

  public query ({ caller }) func getAllWarehouses() : async [Warehouse] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view warehouses");
    };
    warehouseData.values().toArray().sort();
  };

  public query ({ caller }) func getWarehouseById(id : WarehouseKey) : async Warehouse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view warehouses");
    };
    switch (warehouseData.get(id)) {
      case (null) { Runtime.trap("Warehouse not found") };
      case (?warehouse) { warehouse };
    };
  };

  public shared ({ caller }) func deleteWarehouse(id : WarehouseKey) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete warehouses");
    };
    switch (warehouseData.get(id)) {
      case (null) { Runtime.trap("Warehouse already deleted") };
      case (_) { () };
    };
  };

  // Inventory Management - User Level
  public shared ({ caller }) func addItem(
    code : Text,
    name : Text,
    price : Float,
    quantity : Float,
    warehouse_id : WarehouseKey,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add items");
    };
    let warehouse = switch (warehouseData.get(warehouse_id)) {
      case (null) { Runtime.trap("Warehouse not found") };
      case (?w) { w };
    };
    let item = POS.createItem(code, name, price, quantity, warehouse);
    itemData.add(code, item);
  };

  public query ({ caller }) func getAllItems() : async [Item] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view items");
    };
    itemData.values().toArray();
  };

  public query ({ caller }) func getItemsByWarehouse(warehouse_id : WarehouseKey) : async [Item] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view items");
    };

    itemData.values().toArray().filter(
      func(item) {
        switch (warehouseData.get(warehouse_id)) {
          case (?targetWarehouse) { item.warehouse.name == targetWarehouse.name };
          case (null) { false };
        };
      }
    );
  };

  public query ({ caller }) func getItem(code : Text) : async Item {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view items");
    };
    switch (itemData.get(code)) {
      case (null) { Runtime.trap("Item not found") };
      case (?item) { item };
    };
  };

  public shared ({ caller }) func editItem(code : Text, name : Text, price : Float, quantity : Float, warehouse_id : WarehouseKey) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit items");
    };
    let warehouse = switch (warehouseData.get(warehouse_id)) {
      case (null) { Runtime.trap("Warehouse not found") };
      case (?w) { w };
    };
    let item = POS.createItem(code, name, price, quantity, warehouse);
    itemData.add(code, item);
  };

  public shared ({ caller }) func deleteItem(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete items");
    };
    switch (itemData.get(code)) {
      case (null) { Runtime.trap("Item already deleted") };
      case (_) { () };
    };
  };

  // Customer Management - User Level
  public shared ({ caller }) func addCustomer(name : Text, phone : Text, email : Text, addresses : [Address], contacts : [Contact]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add customers");
    };
    if (name.size() == 0 or phone.size() == 0 or email.size() == 0) {
      Runtime.trap("Customer name, phone, and email cannot be empty.");
    };
    let customer = POS.createCustomer(name, phone, email, addresses[0]);
    customerData.add(name, customer);
  };

  public query ({ caller }) func getCustomer(name : Text) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    switch (customerData.get(name)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer };
    };
  };

  // Supplier Management - User Level
  public shared ({ caller }) func addSupplier(name : Text, phone : Text, email : Text, addresses : [Address], contacts : [Contact]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add suppliers");
    };
    if (name.size() == 0 or phone.size() == 0 or email.size() == 0) {
      Runtime.trap("Supplier name, phone, and email cannot be empty.");
    };
    supplierData.add(name, contacts[0]);
  };

  public query ({ caller }) func getSupplier(name : Text) : async Supplier {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view suppliers");
    };
    switch (supplierData.get(name)) {
      case (null) { Runtime.trap("Supplier not found") };
      case (?supplier) { supplier };
    };
  };

  // Purchase Management - User Level
  public shared ({ caller }) func createPurchase(id : Nat, item : Item, supplier : Supplier, quantity : Float, total_cost : Float, line_items : [Purchase]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create purchases");
    };
    purchaseData.add(id, { id; item; supplier; quantity; total_cost });
  };

  // Order Management - User Level
  public shared ({ caller }) func createOrder(id : Nat, items : [PosItem], total : Float, status : Text, order_items : [Order], customer : Customer) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };
    orderData.add(id, { id; items; total; status });
  };

  public query ({ caller }) func getOrder(id : Nat) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    switch (orderData.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { order };
    };
  };

  public query ({ caller }) func getPurchase(id : Nat) : async Purchase {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view purchases");
    };
    switch (purchaseData.get(id)) {
      case (null) { Runtime.trap("Purchase not found") };
      case (?purchase) { purchase };
    };
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orderData.values().toArray();
  };

  public query ({ caller }) func getAllPurchases() : async [Purchase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view purchases");
    };
    purchaseData.values().toArray();
  };

  public shared ({ caller }) func editOrder(id : Nat, items : [PosItem], total : Float, status : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit orders");
    };
    orderData.add(id, { id; items; total; status });
  };

  public shared ({ caller }) func editPurchase(id : Nat, item : Item, supplier : Supplier, quantity : Float, total_cost : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit purchases");
    };
    purchaseData.add(id, { id; item; supplier; quantity; total_cost });
  };

  public shared ({ caller }) func deleteOrder(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete orders");
    };
    switch (orderData.get(id)) {
      case (null) { Runtime.trap("Order already deleted") };
      case (_) { () };
    };
  };

  public shared ({ caller }) func deletePurchase(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete purchases");
    };
    switch (purchaseData.get(id)) {
      case (null) { Runtime.trap("Purchase already deleted") };
      case (_) { () };
    };
  };

  // Payment Management - User Level
  public shared ({ caller }) func createPayment(id : Nat, payer : Contact, payee : Contact, amount : Float, payment_method : Text, reference_number : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create payments");
    };
    if (payer.name.size() == 0 or amount <= 0.0 or payment_method.size() == 0) {
      Runtime.trap("Invalid payment details.");
    };

    paymentData.add(id, { id; payer; amount; payment_method; reference_number });
  };

  // Account Management - Admin Only (Chart of Accounts)
  public shared ({ caller }) func createAccount(id : Nat, name : Text, balance : Float, transactions : [Transaction]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create accounts");
    };
    if (name.size() == 0 or balance < 0.0) {
      Runtime.trap("Invalid account details.");
    };
    accountData.add(id, { id; name; balance; transactions });
  };

  public shared ({ caller }) func editPayment(id : Nat, payer : Contact, amount : Float, payment_method : Text, reference_number : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit payments");
    };
    paymentData.add(id, { id; payer; amount; payment_method; reference_number });
  };

  public shared ({ caller }) func editAccount(id : Nat, name : Text, balance : Float, transactions : [Transaction]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can edit accounts");
    };
    accountData.add(id, { id; name; balance; transactions });
  };

  public query ({ caller }) func getPayment(id : Nat) : async Payment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    switch (paymentData.get(id)) {
      case (null) { Runtime.trap("Payment not found") };
      case (?payment) { payment };
    };
  };

  public query ({ caller }) func getAccount(id : Nat) : async Account {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view accounts");
    };
    switch (accountData.get(id)) {
      case (null) { Runtime.trap("Account not found") };
      case (?account) { account };
    };
  };

  public query ({ caller }) func getAllPayments() : async [Payment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view payments");
    };
    paymentData.values().toArray();
  };

  public query ({ caller }) func getAllAccounts() : async [Account] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view accounts");
    };
    accountData.values().toArray();
  };

  public shared ({ caller }) func deletePayment(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete payments");
    };
    switch (paymentData.get(id)) {
      case (null) { Runtime.trap("Payment already deleted") };
      case (_) { () };
    };
  };

  public shared ({ caller }) func deleteAccount(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete accounts");
    };
    switch (accountData.get(id)) {
      case (null) { Runtime.trap("Account already deleted") };
      case (_) { () };
    };
  };

  // Settings Management - Admin Only
  public shared ({ caller }) func updateSettings(name : Text, system_id : Nat, company : Contact) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update settings");
    };
    currentSettings := { name; system_id; company };
  };

  public query ({ caller }) func getSettings() : async Settings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view settings");
    };
    currentSettings;
  };

  // Bulk Data Operations - Admin Only
  public shared ({ caller }) func addBusinessData(
    warehouses : [Warehouse],
    warehouses_removed : [Warehouse],
    inventory : [Item],
    inventory_removed : [Item],
    customers : [Customer],
    customers_removed : [Customer],
    suppliers : [Supplier],
    suppliers_removed : [Supplier],
    purchases : [Purchase],
    purchases_removed : [Purchase],
    order_items : [Order],
    order_items_removed : [Order],
    payments : [Payment],
    payments_removed : [Payment],
    accounts : [Account],
    accounts_removed : [Account],
    reports : [Report],
    reports_removed : [Report],
    settings : Settings,
    settings_removed : [Settings],
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform bulk data operations");
    };

    for (warehouse in warehouses.values()) {
      let newId = warehouseData.size();
      warehouseData.add(newId, warehouse);
    };

    for (item in inventory.values()) {
      itemData.add(item.code, item);
    };

    for (customer in customers.values()) {
      customerData.add(customer.name, customer);
    };

    for (supplier in suppliers.values()) {
      supplierData.add(supplier.name, supplier);
    };

    for (purchase in purchases.values()) {
      purchaseData.add(purchase.id, purchase);
    };

    for (order in order_items.values()) {
      orderData.add(order.id, order);
    };

    for (payment in payments.values()) {
      paymentData.add(payment.id, payment);
    };

    for (account in accounts.values()) {
      accountData.add(account.id, account);
    };

    for (report in reports.values()) {
      reportData.add(report.name, report);
    };

    currentSettings := settings;
  };
};
