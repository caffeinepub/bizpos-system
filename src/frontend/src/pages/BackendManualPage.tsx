import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Database,
  Download,
  Globe,
  Layers,
  Search,
  Server,
} from "lucide-react";
import { useState } from "react";

interface CodeBlock {
  lang: string;
  code: string;
}

interface SubSection {
  heading: string;
  body?: string;
  codeBlocks?: CodeBlock[];
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  subsections: SubSection[];
}

const sections: Section[] = [
  {
    id: "overview",
    title: "Project Overview & Architecture",
    icon: Layers,
    subsections: [
      {
        heading: "Architecture Summary",
        body: `The BizPOS backend is a RESTful API built with Spring Boot 3.x and backed by MySQL 8.x.

Frontend (React + TypeScript) communicates with the backend via REST endpoints.
The frontend remains fully functional using localStorage while the backend is being integrated — you switch data sources by updating a config flag.

Tech Stack:
• Java 17 (LTS)
• Spring Boot 3.2.x
• Spring Data JPA (Hibernate)
• Spring Security (JWT)
• MySQL 8.0+
• Lombok
• MapStruct (DTO mapping)
• Flyway (DB migrations)
• Maven (build tool)

Key Principles:
• All endpoints are scoped per-company (company_id is extracted from the JWT token).
• Role-based access control (RBAC) matches the 52 permission keys used in the frontend.
• Auto-journal-entry posting mirrors the frontend logic exactly.`,
      },
    ],
  },
  {
    id: "setup",
    title: "Project Setup",
    icon: Server,
    subsections: [
      {
        heading: "Maven pom.xml dependencies",
        codeBlocks: [
          {
            lang: "xml",
            code: `<dependencies>
  <!-- Spring Boot starters -->
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
  </dependency>

  <!-- MySQL driver -->
  <dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
  </dependency>

  <!-- JWT -->
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.5</version>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
  </dependency>

  <!-- Lombok -->
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
  </dependency>

  <!-- Flyway DB migrations -->
  <dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-mysql</artifactId>
  </dependency>
</dependencies>`,
          },
        ],
      },
      {
        heading: "application.properties",
        codeBlocks: [
          {
            lang: "properties",
            code: `spring.datasource.url=jdbc:mysql://localhost:3306/bizpos?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=bizpos_user
spring.datasource.password=YOUR_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Flyway
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

# JWT
bizpos.jwt.secret=CHANGE_THIS_TO_A_256_BIT_RANDOM_SECRET
bizpos.jwt.expiration-ms=86400000

# CORS (React dev server)
bizpos.cors.allowed-origins=http://localhost:5173

server.port=8080`,
          },
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Security & JWT Authentication",
    icon: Globe,
    subsections: [
      {
        heading: "JWT Token Structure",
        body: `Every JWT token issued by the backend contains:
• sub   — user email
• userId
• companyId  (current active company)
• isSuperUser
• permissions  (array of permission keys)

The frontend sends: Authorization: Bearer <token> on every API request.
The backend extracts companyId and permissions from the token to scope queries and enforce RBAC.`,
      },
      {
        heading: "JwtUtil.java",
        codeBlocks: [
          {
            lang: "java",
            code: `@Component
@RequiredArgsConstructor
public class JwtUtil {

    @Value("\${bizpos.jwt.secret}")
    private String secret;

    @Value("\${bizpos.jwt.expiration - ms}")
    private long expirationMs;

    public String generateToken(User user, Long companyId) {
        return Jwts.builder()
            .subject(user.getEmail())
            .claim("userId",      user.getId())
            .claim("companyId",   companyId)
            .claim("isSuperUser", user.isSuperUser())
            .claim("permissions", user.getRole().getPermissions())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
            .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)))
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}`,
          },
        ],
      },
      {
        heading: "SecurityConfig.java",
        codeBlocks: [
          {
            lang: "java",
            code: `@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}`,
          },
        ],
      },
      {
        heading: "Login Endpoint",
        codeBlocks: [
          {
            lang: "java",
            code: `// POST /api/auth/login
@PostMapping("/login")
public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
    User user = userRepo.findByEmail(req.getEmail())
        .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
    if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
        throw new BadCredentialsException("Invalid credentials");
    }
    Long companyId = req.getCompanyId(); // null for super users
    String token = jwtUtil.generateToken(user, companyId);
    return ResponseEntity.ok(new LoginResponse(token, user));
}

// POST /api/auth/select-company  (super users only)
@PostMapping("/select-company")
public ResponseEntity<LoginResponse> selectCompany(
        @AuthenticationPrincipal BizposUserDetails principal,
        @RequestBody SelectCompanyRequest req) {
    // Re-issue token with the selected companyId
    String token = jwtUtil.generateToken(principal.getUser(), req.getCompanyId());
    return ResponseEntity.ok(new LoginResponse(token, principal.getUser()));
}`,
          },
        ],
      },
    ],
  },
  {
    id: "entities",
    title: "JPA Entities (Key Examples)",
    icon: Database,
    subsections: [
      {
        heading: "Base Entity",
        codeBlocks: [
          {
            lang: "java",
            code: `@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter
public abstract class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}`,
          },
        ],
      },
      {
        heading: "Item Entity",
        codeBlocks: [
          {
            lang: "java",
            code: `@Entity
@Table(name = "items")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Item extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ItemCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private ItemBrand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private ItemUnit unit;

    @Column(nullable = false)
    private String name;

    private String sku;
    private String barcode;

    @Column(precision = 15, scale = 4)
    private BigDecimal costPrice;

    @Column(precision = 15, scale = 4)
    private BigDecimal sellingPrice;

    @Column(precision = 7, scale = 4)
    private BigDecimal taxRate;

    private Integer reorderLevel;
    private Integer currentStock;

    private Boolean isActive = true;

    @OneToMany(mappedBy = "item", cascade = CascadeType.ALL)
    private List<ItemVariant> variants;
}`,
          },
        ],
      },
      {
        heading: "Sale Entity",
        codeBlocks: [
          {
            lang: "java",
            code: `@Entity
@Table(name = "sales")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Sale extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String invoiceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id")
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cashier_id")
    private User cashier;

    private LocalDateTime saleDate;

    @Column(precision = 15, scale = 4)
    private BigDecimal subtotal;

    @Column(precision = 15, scale = 4)
    private BigDecimal discountAmount;

    @Column(precision = 15, scale = 4)
    private BigDecimal taxAmount;

    @Column(precision = 15, scale = 4)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL)
    private List<SaleItem> items;
}`,
          },
        ],
      },
    ],
  },
  {
    id: "repositories",
    title: "Repositories & Queries",
    icon: Database,
    subsections: [
      {
        heading: "ItemRepository",
        codeBlocks: [
          {
            lang: "java",
            code: `public interface ItemRepository extends JpaRepository<Item, Long> {

    // All active items for a warehouse (used by POS)
    List<Item> findByWarehouseIdAndIsActiveTrue(Long warehouseId);

    // Items below reorder level (for alerts)
    @Query("SELECT i FROM Item i WHERE i.company.id = :companyId " +
           "AND i.isActive = true AND i.currentStock <= i.reorderLevel")
    List<Item> findLowStockItems(@Param("companyId") Long companyId);

    // SKU uniqueness check
    boolean existsBySkuAndCompanyId(String sku, Long companyId);

    Page<Item> findByCompanyIdAndIsActiveTrue(
        Long companyId, Pageable pageable);
}`,
          },
        ],
      },
      {
        heading: "SaleRepository",
        codeBlocks: [
          {
            lang: "java",
            code: `public interface SaleRepository extends JpaRepository<Sale, Long> {

    @Query("SELECT s FROM Sale s WHERE s.company.id = :companyId " +
           "AND s.saleDate BETWEEN :from AND :to")
    List<Sale> findByCompanyAndDateRange(
        @Param("companyId") Long companyId,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to
    );

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s " +
           "WHERE s.company.id = :companyId AND CAST(s.saleDate AS date) = :date")
    BigDecimal sumDailySales(
        @Param("companyId") Long companyId,
        @Param("date") LocalDate date
    );
}`,
          },
        ],
      },
    ],
  },
  {
    id: "services",
    title: "Service Layer (Business Logic)",
    icon: Code2,
    subsections: [
      {
        heading: "SaleService — create() with accounting",
        codeBlocks: [
          {
            lang: "java",
            code: `@Service
@RequiredArgsConstructor
@Transactional
public class SaleService {

    private final SaleRepository saleRepo;
    private final ItemRepository itemRepo;
    private final StockMovementRepository stockMovRepo;
    private final JournalEntryService journalSvc;
    private final AccountMappingRepository accountMappingRepo;

    public Sale createSale(CreateSaleRequest req, Long companyId, Long cashierId) {
        Sale sale = buildSaleFromRequest(req, companyId, cashierId);
        sale = saleRepo.save(sale);

        // 1. Deduct stock and record movement for each item
        for (SaleItemRequest lineItem : req.getItems()) {
            Item item = itemRepo.findById(lineItem.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
            item.setCurrentStock(item.getCurrentStock() - lineItem.getQuantity());
            itemRepo.save(item);

            stockMovRepo.save(StockMovement.builder()
                .item(item)
                .warehouse(item.getWarehouse())
                .type(StockMovementType.Sale)
                .quantity(-lineItem.getQuantity())
                .referenceId(sale.getInvoiceNumber())
                .build());
        }

        // 2. Auto-post accounting journal entries
        AccountMapping mapping = accountMappingRepo.findByCompanyId(companyId)
            .orElseThrow(() -> new BusinessException("Account mapping not configured"));

        journalSvc.postSaleJournal(sale, mapping);

        return sale;
    }
}

// JournalEntryService.postSaleJournal
public void postSaleJournal(Sale sale, AccountMapping mapping) {
    JournalEntry entry = JournalEntry.builder()
        .entryNumber(generateEntryNumber())
        .company(sale.getCompany())
        .entryDate(sale.getSaleDate().toLocalDate())
        .description("Sale: " + sale.getInvoiceNumber())
        .referenceType("Sale")
        .referenceId(sale.getInvoiceNumber())
        .isAutoPosted(true)
        .build();

    List<JournalEntryLine> lines = new ArrayList<>();
    // Dr Cash / A/R
    CoacAccount drAccount = sale.getPaymentMethod() == PaymentMethod.Cash
        ? mapping.getCashAccount() : mapping.getArAccount();
    lines.add(JournalEntryLine.builder().account(drAccount)
        .type(LineType.Debit).amount(sale.getTotalAmount()).build());
    // Cr Sales Revenue
    lines.add(JournalEntryLine.builder().account(mapping.getRevenueAccount())
        .type(LineType.Credit).amount(sale.getTotalAmount().subtract(sale.getTaxAmount())).build());
    // Cr Tax Payable
    if (sale.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
        lines.add(JournalEntryLine.builder().account(mapping.getTaxPayableAccount())
            .type(LineType.Credit).amount(sale.getTaxAmount()).build());
    }
    entry.setLines(lines);
    journalEntryRepo.save(entry);
    updateAccountBalances(lines);
}`,
          },
        ],
      },
      {
        heading: "RBAC Permission Check",
        codeBlocks: [
          {
            lang: "java",
            code: `// Use @PreAuthorize on controller methods
// Register a custom permission evaluator that reads from JWT claims

@Component
public class BizposPermissionEvaluator {
    public boolean hasPermission(Authentication auth, String permissionKey) {
        BizposUserDetails user = (BizposUserDetails) auth.getPrincipal();
        return user.getPermissions().contains(permissionKey);
    }
}

// Controller usage:
@GetMapping
@PreAuthorize("@permEval.hasPermission(authentication, 'inventory')")
public ResponseEntity<Page<ItemDto>> listItems(...) { ... }

@PostMapping("/checkout")
@PreAuthorize("@permEval.hasPermission(authentication, 'pos')")
public ResponseEntity<SaleDto> checkout(...) { ... }`,
          },
        ],
      },
    ],
  },
  {
    id: "controllers",
    title: "REST Controllers & API Reference",
    icon: Globe,
    subsections: [
      {
        heading: "API Base URL & Convention",
        body: `All endpoints are under: /api/v1/

Common patterns:
  GET    /api/v1/{module}           — paginated list
  GET    /api/v1/{module}/{id}      — single record
  POST   /api/v1/{module}           — create
  PUT    /api/v1/{module}/{id}      — full update
  PATCH  /api/v1/{module}/{id}      — partial update
  DELETE /api/v1/{module}/{id}      — delete

All responses: { data, message, success, pagination? }
All list endpoints support: ?page=0&size=20&sort=createdAt,desc
All company-scoped queries automatically filter by companyId from the JWT.`,
      },
      {
        heading: "Complete API Endpoint List",
        body: `AUTH
  POST   /api/auth/login
  POST   /api/auth/refresh
  POST   /api/auth/select-company

COMPANIES
  GET    /api/v1/companies
  POST   /api/v1/companies
  PUT    /api/v1/companies/{id}
  DELETE /api/v1/companies/{id}

WAREHOUSES
  GET    /api/v1/warehouses
  POST   /api/v1/warehouses
  PUT    /api/v1/warehouses/{id}
  DELETE /api/v1/warehouses/{id}

SHOPS
  GET    /api/v1/shops
  GET    /api/v1/shops?warehouseId={id}
  POST   /api/v1/shops
  PUT    /api/v1/shops/{id}

USERS & ROLES
  GET    /api/v1/users
  POST   /api/v1/users
  PUT    /api/v1/users/{id}
  DELETE /api/v1/users/{id}
  GET    /api/v1/roles
  POST   /api/v1/roles

ITEMS
  GET    /api/v1/items?warehouseId={id}&categoryId={id}&page=0
  GET    /api/v1/items/{id}
  POST   /api/v1/items
  PUT    /api/v1/items/{id}
  DELETE /api/v1/items/{id}
  GET    /api/v1/items/low-stock

SALES / POS
  GET    /api/v1/sales?from=&to=&shopId=&customerId=
  GET    /api/v1/sales/{id}
  POST   /api/v1/sales/checkout          ← POS checkout
  GET    /api/v1/sales/{id}/receipt

PURCHASE ORDERS
  GET    /api/v1/purchase-orders
  POST   /api/v1/purchase-orders
  PUT    /api/v1/purchase-orders/{id}
  PATCH  /api/v1/purchase-orders/{id}/status

PURCHASES
  GET    /api/v1/purchases
  POST   /api/v1/purchases
  PATCH  /api/v1/purchases/{id}/status

CUSTOMERS
  GET    /api/v1/customers
  POST   /api/v1/customers
  GET    /api/v1/customers/{id}/ledger

SUPPLIERS
  GET    /api/v1/suppliers
  POST   /api/v1/suppliers
  GET    /api/v1/suppliers/{id}/ledger

CHART OF ACCOUNTS
  GET    /api/v1/accounts?companyId={id}
  POST   /api/v1/accounts
  PUT    /api/v1/accounts/{id}
  GET    /api/v1/accounts/tree           ← hierarchical tree response

JOURNAL ENTRIES
  GET    /api/v1/journal-entries?from=&to=
  POST   /api/v1/journal-entries
  GET    /api/v1/journal-entries/{id}

ACCOUNT MAPPING
  GET    /api/v1/account-mapping
  PUT    /api/v1/account-mapping

EMPLOYEES
  GET    /api/v1/employees
  POST   /api/v1/employees
  PUT    /api/v1/employees/{id}
  DELETE /api/v1/employees/{id}

SALARY SLIPS
  GET    /api/v1/salary-slips?month=&year=
  POST   /api/v1/salary-slips/process   ← run payroll for a period

ATTENDANCE
  GET    /api/v1/attendance?date=&employeeId=
  PUT    /api/v1/attendance

BANKS / ACCOUNTS
  GET    /api/v1/banks
  GET    /api/v1/bank-accounts
  POST   /api/v1/bank-transactions

REPORTS
  GET    /api/v1/reports/sales-summary?from=&to=&shopId=
  GET    /api/v1/reports/stock-by-warehouse
  GET    /api/v1/reports/trial-balance?date=
  GET    /api/v1/reports/profit-loss?from=&to=
  GET    /api/v1/reports/balance-sheet?date=
  GET    /api/v1/reports/customer-aging
  GET    /api/v1/reports/supplier-aging

AUDIT LOGS
  GET    /api/v1/logs?userId=&from=&to=&page=0`,
      },
      {
        heading: "Sample Controller — ItemController.java",
        codeBlocks: [
          {
            lang: "java",
            code: `@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    @PreAuthorize("@permEval.hasPermission(authentication, 'inventory')")
    public ResponseEntity<PagedResponse<ItemDto>> list(
            @AuthenticationPrincipal BizposUserDetails principal,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long categoryId,
            Pageable pageable) {
        Long companyId = principal.getCompanyId();
        Page<ItemDto> page = itemService.list(companyId, warehouseId, categoryId, pageable);
        return ResponseEntity.ok(PagedResponse.of(page));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@permEval.hasPermission(authentication, 'inventory')")
    public ResponseEntity<ItemDto> get(@PathVariable Long id,
            @AuthenticationPrincipal BizposUserDetails principal) {
        return ResponseEntity.ok(itemService.getById(id, principal.getCompanyId()));
    }

    @PostMapping
    @PreAuthorize("@permEval.hasPermission(authentication, 'inventory')")
    public ResponseEntity<ItemDto> create(
            @Valid @RequestBody CreateItemRequest req,
            @AuthenticationPrincipal BizposUserDetails principal) {
        ItemDto dto = itemService.create(req, principal.getCompanyId());
        return ResponseEntity.status(201).body(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@permEval.hasPermission(authentication, 'inventory')")
    public ResponseEntity<ItemDto> update(@PathVariable Long id,
            @Valid @RequestBody UpdateItemRequest req,
            @AuthenticationPrincipal BizposUserDetails principal) {
        return ResponseEntity.ok(itemService.update(id, req, principal.getCompanyId()));
    }

    @GetMapping("/low-stock")
    @PreAuthorize("@permEval.hasPermission(authentication, 'inventory')")
    public ResponseEntity<List<ItemDto>> lowStock(
            @AuthenticationPrincipal BizposUserDetails principal) {
        return ResponseEntity.ok(itemService.getLowStock(principal.getCompanyId()));
    }
}`,
          },
        ],
      },
    ],
  },
  {
    id: "migrations",
    title: "Flyway Migrations",
    icon: Database,
    subsections: [
      {
        heading: "File Structure",
        body: `src/main/resources/db/migration/
  V1__create_companies_users_roles.sql
  V2__create_warehouses_shops.sql
  V3__create_inventory_tables.sql
  V4__create_pricing_tables.sql
  V5__create_customers_suppliers.sql
  V6__create_sales_tables.sql
  V7__create_purchase_tables.sql
  V8__create_accounting_tables.sql
  V9__create_banking_tables.sql
  V10__create_hr_tables.sql
  V11__create_supply_chain_tables.sql
  V12__create_tickets_attachments.sql
  V13__seed_default_data.sql

Flyway runs these automatically in version order on startup. Each file is a standard SQL DDL script taken directly from the MySQL Schema page of this system.`,
      },
      {
        heading: "V1__create_companies_users_roles.sql (example)",
        codeBlocks: [
          {
            lang: "sql",
            code: `-- V1: Companies, Roles, Users (core auth tables)
CREATE TABLE companies (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  code        VARCHAR(50) UNIQUE NOT NULL,
  address     TEXT,
  phone       VARCHAR(50),
  email       VARCHAR(150),
  tax_number  VARCHAR(100),
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- ... (paste from the Database Schema page)`,
          },
        ],
      },
    ],
  },
  {
    id: "integration",
    title: "Frontend Integration Guide",
    icon: Code2,
    subsections: [
      {
        heading: "Step 1: Add Axios & API client",
        codeBlocks: [
          {
            lang: "bash",
            code: "npm install axios",
          },
          {
            lang: "typescript",
            code: `// src/lib/apiClient.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bizpos_jwt_token');
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bizpos_jwt_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;`,
          },
        ],
      },
      {
        heading: "Step 2: Add VITE_API_URL to .env",
        codeBlocks: [
          {
            lang: "bash",
            code: `# .env.local
VITE_API_URL=http://localhost:8080/api/v1`,
          },
        ],
      },
      {
        heading:
          "Step 3: Replace localStorage reads with API calls (example: Items)",
        body: "For each module, replace the localStorage get/set with API calls using the apiClient. Here is the pattern for the Items module. Repeat for every page.",
        codeBlocks: [
          {
            lang: "typescript",
            code: `// BEFORE (localStorage)
const items = JSON.parse(localStorage.getItem('bizpos_items') || '[]');

// AFTER (Spring Boot API)
import api from '@/lib/apiClient';
const { data } = await api.get('/items', { params: { warehouseId } });
const items = data.data.content; // paginated response`,
          },
          {
            lang: "typescript",
            code: `// BEFORE (localStorage save)
localStorage.setItem('bizpos_items', JSON.stringify([...items, newItem]));

// AFTER (API call)
const { data } = await api.post('/items', payload);
const savedItem = data.data;`,
          },
        ],
      },
      {
        heading: "Step 4: Update Auth (Login)",
        codeBlocks: [
          {
            lang: "typescript",
            code: `// In AuthContext.tsx — replace the localStorage login logic:
async function login(email: string, password: string) {
  const { data } = await axios.post(
    '\${import.meta.env.VITE_API_URL}/auth/login',
    { email, password }
  );
  localStorage.setItem('bizpos_jwt_token', data.token);
  setCurrentUser(data.user);
}

// For super user company selection:
async function selectCompany(companyId: string) {
  const { data } = await api.post('/auth/select-company', { companyId });
  localStorage.setItem('bizpos_jwt_token', data.token); // new token with companyId
  setActiveCompany(data.company);
}`,
          },
        ],
      },
      {
        heading: "Step 5: Migration Strategy (localStorage → API)",
        body: `Recommended migration approach to avoid breaking the working frontend:

1. Create a config flag:  VITE_USE_API=false  (set to true when backend is ready)
2. In each page/store, add a conditional:
   if (import.meta.env.VITE_USE_API === 'true') { /* call API */ } else { /* use localStorage */ }
3. Migrate module by module:
   a. Auth & Users  (highest priority — gates everything)
   b. Items & Inventory  (POS depends on this)
   c. Sales & POS Checkout
   d. Purchases & GRN
   e. Accounting (Journal Entries, COA)
   f. HR, Payroll, Banking (lower frequency)
4. Once all modules are on the API, remove the localStorage fallback code.
5. Test each module end-to-end before moving to the next.`,
      },
      {
        heading: "Step 6: CORS Configuration in Spring Boot",
        codeBlocks: [
          {
            lang: "java",
            code: `@Configuration
public class CorsConfig {

    @Value("\${bizpos.cors.allowed - origins}")
    private String[] allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins));
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}`,
          },
        ],
      },
    ],
  },
  {
    id: "testing",
    title: "Testing & Running the Backend",
    icon: Server,
    subsections: [
      {
        heading: "Running Locally",
        codeBlocks: [
          {
            lang: "bash",
            code: `# 1. Create MySQL database
mysql -u root -p -e "CREATE DATABASE bizpos CHARACTER SET utf8mb4;"
mysql -u root -p -e "CREATE USER 'bizpos_user'@'localhost' IDENTIFIED BY 'password';"
mysql -u root -p -e "GRANT ALL ON bizpos.* TO 'bizpos_user'@'localhost';"

# 2. Clone and build
git clone https://github.com/your-org/bizpos-backend.git
cd bizpos-backend
mvn clean package -DskipTests

# 3. Run (Flyway will create all tables automatically)
java -jar target/bizpos-backend.jar

# 4. Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@bizpos.com","password":"admin123"}'`,
          },
        ],
      },
      {
        heading: "Sample Integration Test",
        codeBlocks: [
          {
            lang: "java",
            code: `@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Transactional
class SaleControllerTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository userRepo;

    @Test
    void checkout_reducesStock() {
        String token = loginAsAdmin();
        CreateSaleRequest req = buildTestSale();

        ResponseEntity<SaleDto> response = restTemplate
            .exchange("/api/v1/sales/checkout",
                HttpMethod.POST,
                new HttpEntity<>(req, authHeader(token)),
                SaleDto.class);

        assertEquals(200, response.getStatusCodeValue());
        Item item = itemRepo.findById(req.getItems().get(0).getItemId()).get();
        // Stock must have decreased
        assertTrue(item.getCurrentStock() < INITIAL_STOCK);
    }
}`,
          },
        ],
      },
    ],
  },
];

export default function BackendManualPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["overview"]));
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      const isExpanding = !next.has(id);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (isExpanding) {
        requestAnimationFrame(() => {
          document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return next;
    });
  };

  const handleCopy = (code: string, key: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
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
    doc.text("BizPOS — Spring Boot Backend Manual", margin, 19);
    y = 38;

    for (const section of sections) {
      if (y > 265) {
        doc.addPage();
        y = 15;
      }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(section.title, margin, y);
      y += 8;

      for (const sub of section.subsections) {
        if (y > 255) {
          doc.addPage();
          y = 15;
        }
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text(sub.heading, margin, y);
        y += 5;

        if (sub.body) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(60, 60, 60);
          const lines = doc.splitTextToSize(sub.body, codeW);
          for (const line of lines as string[]) {
            if (y > 278) {
              doc.addPage();
              y = 15;
            }
            doc.text(line, margin, y);
            y += 4.5;
          }
          y += 3;
        }

        for (const block of sub.codeBlocks ?? []) {
          const codeLines = doc.splitTextToSize(block.code, codeW - 4);
          const blockH = codeLines.length * 4 + 6;
          if (y + blockH > 280) {
            doc.addPage();
            y = 15;
          }
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y, codeW, blockH, "F");
          doc.setFont("courier", "normal");
          doc.setFontSize(6.5);
          doc.setTextColor(20, 20, 20);
          for (const line of codeLines as string[]) {
            doc.text(line, margin + 2, y + 4);
            y += 4;
          }
          y += 8;
        }
      }
      y += 5;
    }
    doc.save("BizPOS-Spring-Boot-Backend-Manual.pdf");
  };

  const filtered = search.trim()
    ? sections.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.subsections.some(
            (sub) =>
              sub.heading.toLowerCase().includes(search.toLowerCase()) ||
              (sub.body || "").toLowerCase().includes(search.toLowerCase()) ||
              sub.codeBlocks?.some((b) =>
                b.code.toLowerCase().includes(search.toLowerCase()),
              ),
          ),
      )
    : sections;

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Server className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-gray-800 text-sm">Backend Manual</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search guide..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <nav className="p-2">
          {filtered.map((s) => {
            const Icon = s.icon;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors mb-0.5 ${
                  expanded.has(s.id)
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="flex-1 truncate">{s.title}</span>
                {expanded.has(s.id) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Server className="h-6 w-6 text-blue-600" />
              Spring Boot Backend Manual
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Complete guide to build, integrate, and deploy the BizPOS Spring
              Boot backend. The frontend remains fully operational with
              localStorage throughout.
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {[
                "Spring Boot 3.2",
                "Java 17",
                "MySQL 8",
                "JWT Auth",
                "Flyway",
                "JPA / Hibernate",
              ].map((badge) => (
                <span
                  key={badge}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {filtered.map((section) => {
            const Icon = section.icon;
            const isOpen = expanded.has(section.id);
            return (
              <div
                key={section.id}
                id={section.id}
                className="mb-4 bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-semibold text-gray-900 text-base flex-1">
                    {section.title}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {section.subsections.map((sub, si) => (
                      <div
                        key={`${section.id}-${sub.heading}`}
                        className="px-5 py-4"
                      >
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm">
                          {sub.heading}
                        </h3>
                        {sub.body && (
                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line mb-3">
                            {sub.body}
                          </p>
                        )}
                        {sub.codeBlocks?.map((block, bi) => {
                          const copyKey = `${section.id}-${si}-${bi}`;
                          return (
                            <div
                              key={`${section.id}-${sub.heading}-${block.lang}-${bi}`}
                              className="relative mb-3"
                            >
                              <div className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-t-lg">
                                <span className="text-xs text-slate-400 font-mono">
                                  {block.lang}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(block.code, copyKey)
                                  }
                                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                                >
                                  {copied === copyKey ? (
                                    <>
                                      <Check className="h-3 w-3 text-green-400" />{" "}
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3" /> Copy
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="bg-slate-900 text-green-300 text-xs font-mono p-4 overflow-x-auto rounded-b-lg whitespace-pre">
                                {block.code}
                              </pre>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
