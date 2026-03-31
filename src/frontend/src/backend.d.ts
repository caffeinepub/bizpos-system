import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Address {
    zip: string;
    street: string;
    country: string;
    city: string;
    state: string;
}
export interface Account {
    id: bigint;
    balance: number;
    name: string;
    transactions: Array<Transaction>;
}
export interface Contact {
    name: string;
    email: string;
    address: Address;
    phone: string;
}
export interface PosItem {
    code: string;
    name: string;
    quantity: number;
    price: number;
}
export interface Warehouse {
    name: string;
    location: string;
}
export interface Payment {
    id: bigint;
    payment_method: string;
    reference_number: string;
    payer: Contact;
    amount: number;
}
export interface Report {
    total_sales: number;
    total_accounts: number;
    name: string;
    total_inventory: number;
    total_payments: number;
    total_purchases: number;
}
export type WarehouseKey = bigint;
export interface Transaction {
    id: bigint;
    transaction_type: string;
    amount: number;
}
export interface Order {
    id: bigint;
    status: string;
    total: number;
    items: Array<PosItem>;
}
export interface Settings {
    name: string;
    system_id: bigint;
    company: Contact;
}
export interface Customer {
    name: string;
    email: string;
    address: Address;
    phone: string;
}
export interface Item {
    code: string;
    name: string;
    quantity: number;
    price: number;
    warehouse: Warehouse;
}
export interface Purchase {
    id: bigint;
    supplier: Supplier;
    item: Item;
    total_cost: number;
    quantity: number;
}
export interface Supplier {
    name: string;
    email: string;
    address: Address;
    phone: string;
}
export interface UserProfile {
    name: string;
    role: string;
    email: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBusinessData(warehouses: Array<Warehouse>, warehouses_removed: Array<Warehouse>, inventory: Array<Item>, inventory_removed: Array<Item>, customers: Array<Customer>, customers_removed: Array<Customer>, suppliers: Array<Supplier>, suppliers_removed: Array<Supplier>, purchases: Array<Purchase>, purchases_removed: Array<Purchase>, order_items: Array<Order>, order_items_removed: Array<Order>, payments: Array<Payment>, payments_removed: Array<Payment>, accounts: Array<Account>, accounts_removed: Array<Account>, reports: Array<Report>, reports_removed: Array<Report>, settings: Settings, settings_removed: Array<Settings>): Promise<void>;
    addCustomer(name: string, phone: string, email: string, addresses: Array<Address>, contacts: Array<Contact>): Promise<void>;
    addInitialWarehouse(): Promise<void>;
    addItem(code: string, name: string, price: number, quantity: number, warehouse_id: WarehouseKey): Promise<void>;
    addSupplier(name: string, phone: string, email: string, addresses: Array<Address>, contacts: Array<Contact>): Promise<void>;
    addWarehouse(id: WarehouseKey, name: string, location: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAccount(id: bigint, name: string, balance: number, transactions: Array<Transaction>): Promise<void>;
    createOrder(id: bigint, items: Array<PosItem>, total: number, status: string, order_items: Array<Order>, customer: Customer): Promise<void>;
    createPayment(id: bigint, payer: Contact, payee: Contact, amount: number, payment_method: string, reference_number: string): Promise<void>;
    createPurchase(id: bigint, item: Item, supplier: Supplier, quantity: number, total_cost: number, line_items: Array<Purchase>): Promise<void>;
    deleteAccount(id: bigint): Promise<void>;
    deleteItem(code: string): Promise<void>;
    deleteOrder(id: bigint): Promise<void>;
    deletePayment(id: bigint): Promise<void>;
    deletePurchase(id: bigint): Promise<void>;
    deleteWarehouse(id: WarehouseKey): Promise<void>;
    editAccount(id: bigint, name: string, balance: number, transactions: Array<Transaction>): Promise<void>;
    editItem(code: string, name: string, price: number, quantity: number, warehouse_id: WarehouseKey): Promise<void>;
    editOrder(id: bigint, items: Array<PosItem>, total: number, status: string): Promise<void>;
    editPayment(id: bigint, payer: Contact, amount: number, payment_method: string, reference_number: string): Promise<void>;
    editPurchase(id: bigint, item: Item, supplier: Supplier, quantity: number, total_cost: number): Promise<void>;
    editWarehouse(id: WarehouseKey, name: string, location: string): Promise<void>;
    getAccount(id: bigint): Promise<Account>;
    getAllAccounts(): Promise<Array<Account>>;
    getAllItems(): Promise<Array<Item>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllPayments(): Promise<Array<Payment>>;
    getAllPurchases(): Promise<Array<Purchase>>;
    getAllWarehouses(): Promise<Array<Warehouse>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(name: string): Promise<Customer>;
    getItem(code: string): Promise<Item>;
    getItemsByWarehouse(warehouse_id: WarehouseKey): Promise<Array<Item>>;
    getOrder(id: bigint): Promise<Order>;
    getPayment(id: bigint): Promise<Payment>;
    getPurchase(id: bigint): Promise<Purchase>;
    getSettings(): Promise<Settings>;
    getSupplier(name: string): Promise<Supplier>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWarehouseById(id: WarehouseKey): Promise<Warehouse>;
    initializeWarehouseData(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateSettings(name: string, system_id: bigint, company: Contact): Promise<void>;
}
