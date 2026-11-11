<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Documentation - Menanti Backend</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
    <style>
        body { font-family: 'Inter', sans-serif; }
        code, pre { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-neutral-950 text-neutral-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
    <div class="flex h-screen overflow-hidden">
        <!-- Sidebar Navigation -->
        <aside class="w-72 bg-neutral-900/80 backdrop-blur border-r border-neutral-800/80 flex flex-col hidden lg:flex shrink-0">
            <div class="p-6 border-b border-neutral-800/80">
                <span class="text-xs font-semibold tracking-wider text-amber-500 uppercase">Menanti API</span>
                <h1 class="text-base font-bold text-white mt-1">Backend Documentation</h1>
                <p class="text-xs text-neutral-400 mt-0.5">Laravel 12 / PHP 8.3+</p>
            </div>
            <nav class="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
                <div>
                    <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Overview</p>
                    <ul class="space-y-1">
                        <li><a href="#overview" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Introduction & Standards</a></li>
                        <li><a href="#errors" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Error Handling</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Staff Auth</p>
                    <ul class="space-y-1">
                        <li><a href="#staff-login" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">POST /login</a></li>
                        <li><a href="#staff-logout" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">POST /logout</a></li>
                        <li><a href="#staff-me" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">GET /me</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Customer Public API</p>
                    <ul class="space-y-1">
                        <li><a href="#public-menu" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Menu & Search</a></li>
                        <li><a href="#public-cart" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Cart Management</a></li>
                        <li><a href="#public-checkout" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Checkout & Preview</a></li>
                        <li><a href="#public-orders" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Orders & Retry Payment</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Payment Webhook</p>
                    <ul class="space-y-1">
                        <li><a href="#webhook-midtrans" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">POST /webhooks/payment/midtrans</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">KDS & Barista</p>
                    <ul class="space-y-1">
                        <li><a href="#kds-orders" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Queue & Status Transitions</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Admin Dashboard</p>
                    <ul class="space-y-1">
                        <li><a href="#admin-categories" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Categories</a></li>
                        <li><a href="#admin-products" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Products & Variants</a></li>
                        <li><a href="#admin-tables" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Tables & QR Tokens</a></li>
                        <li><a href="#admin-settings" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Store Settings</a></li>
                        <li><a href="#admin-delivery" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Delivery Zones</a></li>
                        <li><a href="#admin-reports" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Sales Reports</a></li>
                    </ul>
                </div>
                <div>
                    <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Real-Time (Reverb)</p>
                    <ul class="space-y-1">
                        <li><a href="#realtime" class="block px-3 py-1.5 rounded-md hover:bg-neutral-800/60 text-neutral-300 hover:text-white transition-colors">Channels & Events</a></li>
                    </ul>
                </div>
            </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 space-y-16 max-w-5xl mx-auto">
            <!-- Header Section -->
            <section id="overview" class="space-y-4 border-b border-neutral-800 pb-10">
                <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-300">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    API v1.0 Active
                </div>
                <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-white">Menanti Backend API Specification</h1>
                <p class="text-neutral-400 text-base leading-relaxed">
                    This document outlines the API endpoints, data formats, authentication rules, and event channels for the Menanti coffee shop backend. All monetary amounts are handled as integer IDR (Rupiah) with zero floating-point arithmetic. Timezone operates strictly in <code class="text-amber-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">Asia/Jakarta</code>.
                </p>
            </section>

            <!-- Error Format -->
            <section id="errors" class="space-y-6">
                <div>
                    <h2 class="text-xl font-semibold text-white">Standard Error Format</h2>
                    <p class="text-neutral-400 text-sm mt-1">All error responses adhere to a consistent JSON structure.</p>
                </div>
                <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-4">
                    <pre class="bg-neutral-950 p-4 rounded-md text-emerald-400 text-xs overflow-x-auto border border-neutral-800"><code>{
  "message": "The given data was invalid.",
  "code": "VALIDATION_FAILED",
  "errors": {
    "customer_phone": ["The customer phone field is required."]
  }
}</code></pre>
                    <div class="flex flex-wrap gap-2 pt-2">
                        <span class="bg-neutral-950 text-neutral-300 text-xs px-2.5 py-1 rounded border border-neutral-800 font-mono">VALIDATION_FAILED</span>
                        <span class="bg-neutral-950 text-neutral-300 text-xs px-2.5 py-1 rounded border border-neutral-800 font-mono">PRODUCT_UNAVAILABLE</span>
                        <span class="bg-neutral-950 text-neutral-300 text-xs px-2.5 py-1 rounded border border-neutral-800 font-mono">STORE_CLOSED</span>
                        <span class="bg-neutral-950 text-neutral-300 text-xs px-2.5 py-1 rounded border border-neutral-800 font-mono">INVALID_TRANSITION</span>
                        <span class="bg-neutral-950 text-neutral-300 text-xs px-2.5 py-1 rounded border border-neutral-800 font-mono">PAYMENT_GATEWAY_ERROR</span>
                    </div>
                </div>
            </section>

            <!-- Staff Authentication -->
            <section id="staff-login" class="space-y-6">
                <div class="border-b border-neutral-800 pb-4">
                    <h2 class="text-2xl font-semibold text-white">Staff Authentication</h2>
                    <p class="text-neutral-400 text-sm mt-1">Session-based authentication for admin and barista roles.</p>
                </div>

                <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">POST</span>
                        <code class="text-base font-mono text-white">/login</code>
                    </div>
                    <p class="text-neutral-300 text-sm">Authenticates staff credentials. Inactive staff accounts (<code class="text-amber-400">is_active = false</code>) are rejected.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Request Body</p>
                            <pre class="bg-neutral-950 p-3 rounded-md text-amber-300 text-xs overflow-x-auto border border-neutral-800"><code>{
  "email": "admin@menanti.test",
  "password": "password12345"
}</code></pre>
                        </div>
                        <div>
                            <p class="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">Response (200 OK)</p>
                            <pre class="bg-neutral-950 p-3 rounded-md text-emerald-400 text-xs overflow-x-auto border border-neutral-800"><code>{
  "data": {
    "id": 1,
    "name": "Admin Menanti",
    "email": "admin@menanti.test",
    "role": "admin"
  }
}</code></pre>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div id="staff-logout" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">POST</span>
                            <code class="font-mono text-white text-sm">/logout</code>
                        </div>
                        <p class="text-neutral-300 text-sm">Destroys the staff session and clears CSRF state.</p>
                    </div>
                    <div id="staff-me" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">GET</span>
                            <code class="font-mono text-white text-sm">/me</code>
                        </div>
                        <p class="text-neutral-300 text-sm">Retrieves the profile of the currently authenticated staff user.</p>
                    </div>
                </div>
            </section>

            <!-- Customer Public API -->
            <section id="public-menu" class="space-y-6">
                <div class="border-b border-neutral-800 pb-4">
                    <h2 class="text-2xl font-semibold text-white">Customer Public API</h2>
                    <p class="text-neutral-400 text-sm mt-1">Stateless customer flow managed via <code class="text-amber-400">cart_token</code> cookie.</p>
                </div>

                <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">GET</span>
                        <code class="text-base font-mono text-white">/api/public/menu</code>
                    </div>
                    <p class="text-neutral-300 text-sm">Retrieves active categories, products, variants, and add-ons.</p>
                </div>

                <div id="public-cart" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">GET</span>
                        <code class="text-base font-mono text-white">/api/public/cart</code>
                    </div>
                    <p class="text-neutral-300 text-sm">Inspects the current cart state, items, and server-calculated totals.</p>
                </div>

                <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">POST</span>
                        <code class="text-base font-mono text-white">/api/public/cart/items</code>
                    </div>
                    <p class="text-neutral-300 text-sm">Adds an item with variants and add-ons to the cart.</p>
                    <pre class="bg-neutral-950 p-3 rounded-md text-amber-300 text-xs overflow-x-auto border border-neutral-800"><code>{
  "product_id": 1,
  "variant_ids": [1],
  "addon_ids": [3, 4],
  "qty": 2,
  "note": "Less ice"
}</code></pre>
                </div>

                <div id="public-checkout" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">POST</span>
                        <code class="text-base font-mono text-white">/api/public/checkout</code>
                    </div>
                    <p class="text-neutral-300 text-sm">Creates a <code class="text-amber-400">PENDING_PAYMENT</code> order and initiates a Midtrans Snap payment token.</p>
                    <pre class="bg-neutral-950 p-3 rounded-md text-amber-300 text-xs overflow-x-auto border border-neutral-800"><code>{
  "customer_name": "Budi Santoso",
  "customer_phone": "081234567890",
  "mode": "takeaway",
  "pickup_note": "Pick up at 3 PM"
}</code></pre>
                </div>

                <div id="public-orders" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">GET</span>
                        <code class="text-base font-mono text-white">/api/public/orders/{public_token}</code>
                    </div>
                    <p class="text-neutral-300 text-sm">Retrieves masked order status and payment details using the public token.</p>
                </div>
            </section>

            <!-- Webhook -->
            <section id="webhook-midtrans" class="space-y-6">
                <div class="border-b border-neutral-800 pb-4">
                    <h2 class="text-2xl font-semibold text-white">Payment Webhook</h2>
                </div>
                <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">POST</span>
                        <code class="text-base font-mono text-white">/webhooks/payment/midtrans</code>
                    </div>
                    <p class="text-neutral-300 text-sm">Receives gateway notifications, verified via SHA512 signature hash and strict transaction idempotency.</p>
                </div>
            </section>

            <!-- KDS -->
            <section id="kds-orders" class="space-y-6">
                <div class="border-b border-neutral-800 pb-4">
                    <h2 class="text-2xl font-semibold text-white">Kitchen Display System (KDS)</h2>
                    <p class="text-neutral-400 text-sm mt-1">Requires authenticated staff with <code class="text-amber-400">barista</code> or <code class="text-amber-400">admin</code> role.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">GET</span>
                            <code class="font-mono text-white text-sm">/kds/orders?status=PAID,PREPARING</code>
                        </div>
                        <p class="text-neutral-300 text-sm">Lists active kitchen orders filtered by status.</p>
                    </div>
                    <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">POST</span>
                            <code class="font-mono text-white text-sm">/kds/orders/{id}/start</code>
                        </div>
                        <p class="text-neutral-300 text-sm">Transitions order status from <code class="text-amber-400">PAID</code> to <code class="text-amber-400">PREPARING</code>.</p>
                    </div>
                    <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">POST</span>
                            <code class="font-mono text-white text-sm">/kds/orders/{id}/ready</code>
                        </div>
                        <p class="text-neutral-300 text-sm">Transitions order status from <code class="text-amber-400">PREPARING</code> to <code class="text-amber-400">READY</code>.</p>
                    </div>
                    <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">POST</span>
                            <code class="font-mono text-white text-sm">/kds/orders/{id}/complete</code>
                        </div>
                        <p class="text-neutral-300 text-sm">Marks order as completed (<code class="text-amber-400">COMPLETED</code>).</p>
                    </div>
                </div>
            </section>

            <!-- Admin Endpoints -->
            <section id="admin-categories" class="space-y-6">
                <div class="border-b border-neutral-800 pb-4">
                    <h2 class="text-2xl font-semibold text-white">Admin Management Endpoints</h2>
                    <p class="text-neutral-400 text-sm mt-1">Requires authenticated staff with <code class="text-amber-400">admin</code> role.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-2">
                        <h3 class="font-semibold text-white">Categories</h3>
                        <p class="text-neutral-400 text-xs font-mono">GET/POST /admin/categories</p>
                        <p class="text-neutral-400 text-xs font-mono">PUT/DELETE /admin/categories/{id}</p>
                    </div>
                    <div id="admin-products" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-2">
                        <h3 class="font-semibold text-white">Products & Variants</h3>
                        <p class="text-neutral-400 text-xs font-mono">GET/POST/PUT/DELETE /admin/products</p>
                        <p class="text-neutral-400 text-xs font-mono">PATCH /admin/products/{id}/sold-out</p>
                    </div>
                    <div id="admin-tables" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-2">
                        <h3 class="font-semibold text-white">Tables & QR Tokens</h3>
                        <p class="text-neutral-400 text-xs font-mono">GET/POST/PUT/DELETE /admin/tables</p>
                        <p class="text-neutral-400 text-xs font-mono">POST /admin/tables/{id}/regenerate-token</p>
                    </div>
                    <div id="admin-settings" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-2">
                        <h3 class="font-semibold text-white">Store Settings</h3>
                        <p class="text-neutral-400 text-xs font-mono">GET /admin/store-settings</p>
                        <p class="text-neutral-400 text-xs font-mono">PUT /admin/store-settings</p>
                    </div>
                    <div id="admin-delivery" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-2">
                        <h3 class="font-semibold text-white">Delivery Zones</h3>
                        <p class="text-neutral-400 text-xs font-mono">GET/POST/PUT/DELETE /admin/delivery-zones</p>
                    </div>
                    <div id="admin-reports" class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-2">
                        <h3 class="font-semibold text-white">Sales Reports</h3>
                        <p class="text-neutral-400 text-xs font-mono">GET /admin/reports/summary</p>
                        <p class="text-neutral-400 text-xs">Filtered by <code class="text-amber-400">paid_at</code> (Asia/Jakarta), cached with short TTL.</p>
                    </div>
                </div>
            </section>

            <!-- Real-Time -->
            <section id="realtime" class="space-y-6">
                <div class="border-b border-neutral-800 pb-4">
                    <h2 class="text-2xl font-semibold text-white">Real-Time Broadcasting (Laravel Reverb)</h2>
                    <p class="text-neutral-400 text-sm mt-1">Events dispatched after database transaction commit (<code class="text-amber-400">ShouldDispatchAfterCommit</code>).</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">PUBLIC</span>
                            <code class="font-mono text-white text-sm">order.{public_token}</code>
                        </div>
                        <p class="text-neutral-300 text-sm">Customer tracking channel without sensitive personal data.</p>
                    </div>
                    <div class="bg-neutral-900 rounded-lg border border-neutral-800 p-6 space-y-3">
                        <div class="flex items-center gap-3">
                            <span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono text-xs font-semibold px-2.5 py-1 rounded">PRIVATE</span>
                            <code class="font-mono text-white text-sm">kds.store.{store_id}</code>
                        </div>
                        <p class="text-neutral-300 text-sm">Kitchen display channel for active staff.</p>
                    </div>
                </div>
            </section>
        </main>
    </div>
</body>
</html>
