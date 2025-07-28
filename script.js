 document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const toggleFormBtn = document.getElementById('toggle-form-btn');
            const invoiceFormContainer = document.getElementById('invoice-form-container');
            const addItemBtn = document.getElementById('add-item-btn');
            const createInvoiceBtn = document.getElementById('create-invoice-btn');
            const saveDraftBtn = document.getElementById('save-draft-btn');
            const cancelInvoiceBtn = document.getElementById('cancel-invoice-btn');
            const invoiceItems = document.getElementById('invoice-items');
            const invoiceList = document.getElementById('invoice-list');
            const printContainer = document.getElementById('print-container');
            
            // Add product to invoice functionality
            document.querySelector('.products-grid').addEventListener('click', function(e) {
                const addButton = e.target.closest('.add-product-btn');
                if (addButton) {
                    const productCard = addButton.closest('.product-card');
                    const productName = productCard.dataset.name;
                    const currency = document.getElementById('currency').value;
                    let productPrice;
                    
                    if (currency === 'USD') {
                        productPrice = parseFloat(productCard.dataset.priceUsd || 0);
                    } else {
                        productPrice = parseFloat(productCard.dataset.price || productCard.dataset.priceXaf || 0);
                    }
                    // Find first empty row or create new one
                    let targetRow;
                    const existingRows = invoiceItems.querySelectorAll('tr');
                    
                    // Look for first empty row
                    for (let row of existingRows) {
                        const description = row.querySelector('.item-description').value.trim();
                        const price = parseFloat(row.querySelector('.item-price').value) || 0;
                        if (!description && price === 0) {
                            targetRow = row;
                            break;
                        }
                    }
                    
                    // If no empty row found, create new one
                    if (!targetRow) {
                        targetRow = document.createElement('tr');
                        targetRow.innerHTML = `
                            <td><input type="text" class="form-control item-description" value=""></td>
                            <td><input type="number" class="form-control item-quantity" value="1" min="1"></td>
                            <td><input type="number" class="form-control item-price" value="0" step="0.01"></td>
                            <td class="item-total">0.00</td>
                            <td><button class="action-btn delete-btn"><i class="fas fa-trash"></i></button></td>
                        `;
                        invoiceItems.appendChild(targetRow);
                    }
                    
                    // Fill in the product details
                    targetRow.querySelector('.item-description').value = productName;
                    targetRow.querySelector('.item-price').value = productPrice;
                    
                    // Add event listeners to target row
                    addItemEventListeners(targetRow);
                    calculateTotals();
                }
            });

            // Sample data for demonstration
            let invoices = JSON.parse(localStorage.getItem('invoices')) || [];
            
            // Initialize form with today's date
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('invoice-date').value = today;
            
            // Set due date to 15 days from today
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 15);
            document.getElementById('due-date').value = dueDate.toISOString().split('T')[0];
            
            // Update product prices based on currency
            function updateProductPrices(currency) {
                const products = document.querySelectorAll('.product-card');
                products.forEach(product => {
                    // Get the original price values
                    const xafPrice = product.dataset.price || "150000"; // Default to prevent NaN
                    const usdPrice = product.dataset.priceUsd || "250";  // Default to prevent NaN
                    const priceDisplay = product.querySelector('.product-price');
                    
                    if (currency === 'USD') {
                        // Switch to USD
                        product.dataset.currentPrice = usdPrice;
                        priceDisplay.textContent = `$${parseFloat(usdPrice).toFixed(2)}`;
                    } else {
                        // Switch to XAF
                        product.dataset.currentPrice = xafPrice;
                        priceDisplay.textContent = `${parseInt(xafPrice).toLocaleString()} XAF`;
                    }
                });
                
                // Update any existing invoice items
                const invoiceRows = document.querySelectorAll('#invoice-items tr');
                invoiceRows.forEach(row => {
                    const priceInput = row.querySelector('.item-price');
                    if (priceInput) {
                        calculateTotals();
                    }
                });
            }

            // Listen for currency changes
            document.getElementById('currency').addEventListener('change', function() {
                updateProductPrices(this.value);
            });
            
            // Initialize with default currency
            updateProductPrices(document.getElementById('currency').value);
            
            // Toggle invoice form visibility
            toggleFormBtn.addEventListener('click', function() {
                invoiceFormContainer.style.display = invoiceFormContainer.style.display === 'none' ? 'block' : 'none';
                toggleFormBtn.innerHTML = invoiceFormContainer.style.display === 'none' ? 
                    '<i class="fas fa-plus"></i> New Invoice' : 
                    '<i class="fas fa-minus"></i> Hide Form';
            });
            
            // Add new item row
            addItemBtn.addEventListener('click', function() {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td><input type="text" class="form-control item-description" placeholder="Item description"></td>
                    <td><input type="number" class="form-control item-quantity" value="1" min="1"></td>
                    <td><input type="number" class="form-control item-price" placeholder="0.00" step="0.01"></td>
                    <td class="item-total">0.00</td>
                    <td><button class="action-btn delete-btn"><i class="fas fa-trash"></i></button></td>
                `;
                invoiceItems.appendChild(newRow);
                
                // Add event listeners to new inputs
                addItemEventListeners(newRow);
            });
            
            // Delete item row
            invoiceItems.addEventListener('click', function(e) {
                if (e.target.closest('.delete-btn')) {
                    const row = e.target.closest('tr');
                    if (invoiceItems.querySelectorAll('tr').length > 1) {
                        row.remove();
                        calculateTotals();
                    } else {
                        alert('An invoice must have at least one item.');
                    }
                }
            });
            
            // Calculate totals when inputs change
            function addItemEventListeners(row) {
                const quantityInput = row.querySelector('.item-quantity');
                const priceInput = row.querySelector('.item-price');
                
                quantityInput.addEventListener('input', calculateTotals);
                priceInput.addEventListener('input', calculateTotals);
            }
            
            // Add event listeners to initial row
            addItemEventListeners(invoiceItems.querySelector('tr'));
            
            // Discount input event
            document.getElementById('discount').addEventListener('input', calculateTotals);
            
            // Calculate invoice totals
            function calculateTotals() {
                let subtotal = 0;
                const rows = invoiceItems.querySelectorAll('tr');
                
                rows.forEach(row => {
                    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                    const price = parseFloat(row.querySelector('.item-price').value) || 0;
                    const total = quantity * price;
                    row.querySelector('.item-total').textContent = total.toFixed(2);
                    subtotal += total;
                });
                
                const taxRate = 0.16; // 16% tax
                const taxAmount = subtotal * taxRate;
                const discount = parseFloat(document.getElementById('discount').value) || 0;
                const grandTotal = subtotal + taxAmount - discount;
                
                document.getElementById('subtotal').textContent = subtotal.toFixed(2);
                document.getElementById('tax-amount').textContent = taxAmount.toFixed(2);
                document.getElementById('grand-total').textContent = grandTotal.toFixed(2);
            }
            
            // Create new invoice
            createInvoiceBtn.addEventListener('click', function() {
                const customerName = document.getElementById('customer-name').value.trim();
                const customerEmail = document.getElementById('customer-email').value.trim();
                const customerPhone = document.getElementById('customer-phone').value.trim();
                const customerAddress = document.getElementById('customer-address').value.trim();
                const invoiceDate = document.getElementById('invoice-date').value;
                const dueDate = document.getElementById('due-date').value;
                const currency = document.getElementById('currency').value;
                const notes = document.getElementById('invoice-notes').value.trim();
                
                if (!customerName) {
                    alert('Please enter customer name');
                    return;
                }
                
                // Collect invoice items
                const items = [];
                const rows = invoiceItems.querySelectorAll('tr');
                let hasEmptyItems = false;
                
                rows.forEach(row => {
                    const description = row.querySelector('.item-description').value.trim();
                    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                    const price = parseFloat(row.querySelector('.item-price').value) || 0;
                    
                    if (!description) {
                        hasEmptyItems = true;
                        row.querySelector('.item-description').focus();
                    }
                    
                    items.push({
                        description,
                        quantity,
                        price,
                        total: quantity * price
                    });
                });
                
                if (hasEmptyItems) {
                    alert('Please fill in all item descriptions');
                    return;
                }
                
                // Calculate totals
                const subtotal = items.reduce((sum, item) => sum + item.total, 0);
                const taxRate = 0.16;
                const taxAmount = subtotal * taxRate;
                const discount = parseFloat(document.getElementById('discount').value) || 0;
                const grandTotal = subtotal + taxAmount - discount;
                
                // Create invoice object with products
                const invoice = {
                    id: generateInvoiceId(),
                    customer: {
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone,
                        address: customerAddress
                    },
                    date: invoiceDate,
                    dueDate: dueDate,
                    currency: currency,
                    items: items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.total
                    })),
                    subtotal: subtotal,
                    tax: taxAmount,
                    discount: discount,
                    total: grandTotal,
                    notes: notes,
                    status: 'pending',
                    statusHistory: [{
                        status: 'pending',
                        date: new Date().toISOString(),
                        note: 'Invoice created'
                    }],
                    payments: [],
                    paymentStatus: {
                        totalPaid: 0,
                        remaining: grandTotal,
                        lastPaymentDate: null
                    },
                    createdAt: new Date().toISOString(),
                    template: 'default'
                };
                
                // Log to console (as requested)
                console.log('New invoice created:', invoice);
                
                // Add to invoices array
                invoices.unshift(invoice);
                localStorage.setItem('invoices', JSON.stringify(invoices));
                
                // Update UI
                renderInvoiceList();
                
                // Reset form
                resetInvoiceForm();
                
                // Show success message
                alert('Invoice created successfully!');
            });
            
            // Save as draft
            saveDraftBtn.addEventListener('click', function() {
                const customerName = document.getElementById('customer-name').value.trim();
                const customerEmail = document.getElementById('customer-email').value.trim();
                const customerPhone = document.getElementById('customer-phone').value.trim();
                const customerAddress = document.getElementById('customer-address').value.trim();
                const invoiceDate = document.getElementById('invoice-date').value;
                const dueDate = document.getElementById('due-date').value;
                const currency = document.getElementById('currency').value;
                const notes = document.getElementById('invoice-notes').value.trim();
                
                // Collect invoice items
                const items = [];
                const rows = invoiceItems.querySelectorAll('tr');
                
                rows.forEach(row => {
                    const description = row.querySelector('.item-description').value.trim();
                    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                    const price = parseFloat(row.querySelector('.item-price').value) || 0;
                    
                    // Include even empty items in draft
                    items.push({
                        description,
                        quantity,
                        price,
                        total: quantity * price
                    });
                });
                
                // Calculate totals
                const subtotal = items.reduce((sum, item) => sum + item.total, 0);
                const taxRate = 0.16;
                const taxAmount = subtotal * taxRate;
                const discount = parseFloat(document.getElementById('discount').value) || 0;
                const grandTotal = subtotal + taxAmount - discount;
                
                // Create draft invoice object
                const draft = {
                    id: generateInvoiceId(),
                    customer: {
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone,
                        address: customerAddress
                    },
                    date: invoiceDate,
                    dueDate: dueDate,
                    currency: currency,
                    items: items,
                    subtotal: subtotal,
                    tax: taxAmount,
                    discount: discount,
                    total: grandTotal,
                    notes: notes,
                    status: 'draft',
                    createdAt: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                
                // Get existing drafts from localStorage
                let drafts = JSON.parse(localStorage.getItem('invoice_drafts') || '[]');
                drafts.unshift(draft);
                localStorage.setItem('invoice_drafts', JSON.stringify(drafts));
                
                // Show success message
                alert('Draft saved successfully!');
                
                // Update UI to show drafts
                renderDraftList();
            });
            
            // Function to render draft list in the invoice list section
            function renderDraftList() {
                const drafts = JSON.parse(localStorage.getItem('invoice_drafts') || '[]');
                const draftsSection = document.createElement('div');
                draftsSection.className = 'drafts-section';
                
                if (drafts.length > 0) {
                    drafts.forEach(draft => {
                        const draftElement = document.createElement('div');
                        draftElement.className = 'invoice-item draft';
                        draftElement.innerHTML = `
                            <div class="invoice-header">
                                <span class="invoice-id">${draft.id}</span>
                                <span class="badge draft-badge">Draft</span>
                            </div>
                            <div class="invoice-body">
                                <div class="customer-info">
                                    <span class="customer-name">${draft.customer.name || 'No Customer Name'}</span>
                                    <span class="customer-email">${draft.customer.email || 'No Email'}</span>
                                </div>
                                <div class="invoice-amount">
                                    ${draft.currency} ${draft.total.toFixed(2)}
                                </div>
                                <div class="invoice-date">
                                    Last Modified: ${new Date(draft.lastModified).toLocaleDateString()}
                                </div>
                            </div>
                            <div class="invoice-actions">
                                <button class="btn btn-primary btn-sm edit-draft" data-id="${draft.id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger btn-sm delete-draft" data-id="${draft.id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        `;
                        draftsSection.appendChild(draftElement);
                    });
                }
                
                // Insert drafts section at the beginning of invoice list
                const existingDraftsSection = document.querySelector('.drafts-section');
                if (existingDraftsSection) {
                    existingDraftsSection.remove();
                }
                invoiceList.insertBefore(draftsSection, invoiceList.firstChild);
                
                // Add event listeners for draft actions
                document.querySelectorAll('.edit-draft').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const draftId = this.dataset.id;
                        const drafts = JSON.parse(localStorage.getItem('invoice_drafts') || '[]');
                        const draft = drafts.find(d => d.id === draftId);
                        
                        if (draft) {
                            // Fill form with draft data
                            document.getElementById('customer-name').value = draft.customer.name || '';
                            document.getElementById('customer-email').value = draft.customer.email || '';
                            document.getElementById('customer-phone').value = draft.customer.phone || '';
                            document.getElementById('customer-address').value = draft.customer.address || '';
                            document.getElementById('invoice-date').value = draft.date;
                            document.getElementById('due-date').value = draft.dueDate;
                            document.getElementById('currency').value = draft.currency;
                            document.getElementById('invoice-notes').value = draft.notes || '';
                            document.getElementById('discount').value = draft.discount || '0.00';
                            
                            // Clear existing items
                            invoiceItems.innerHTML = '';
                            
                            // Add draft items
                            draft.items.forEach(item => {
                                const newRow = document.createElement('tr');
                                newRow.innerHTML = `
                                    <td><input type="text" class="form-control item-description" value="${item.description || ''}"></td>
                                    <td><input type="number" class="form-control item-quantity" value="${item.quantity}" min="1"></td>
                                    <td><input type="number" class="form-control item-price" value="${item.price}" step="0.01"></td>
                                    <td class="item-total">${item.total.toFixed(2)}</td>
                                    <td><button class="action-btn delete-btn"><i class="fas fa-trash"></i></button></td>
                                `;
                                invoiceItems.appendChild(newRow);
                                addItemEventListeners(newRow);
                            });
                            
                            // Show the form
                            invoiceFormContainer.style.display = 'block';
                            toggleFormBtn.innerHTML = '<i class="fas fa-minus"></i> Hide Form';
                            
                            // Calculate totals
                            calculateTotals();
                            
                            // Remove the draft from storage
                            const updatedDrafts = drafts.filter(d => d.id !== draftId);
                            localStorage.setItem('invoice_drafts', JSON.stringify(updatedDrafts));
                            
                            // Update UI
                            renderDraftList();
                        }
                    });
                });
                
                document.querySelectorAll('.delete-draft').forEach(btn => {
                    btn.addEventListener('click', function() {
                        if (confirm('Are you sure you want to delete this draft?')) {
                            const draftId = this.dataset.id;
                            const drafts = JSON.parse(localStorage.getItem('invoice_drafts') || '[]');
                            const updatedDrafts = drafts.filter(d => d.id !== draftId);
                            localStorage.setItem('invoice_drafts', JSON.stringify(updatedDrafts));
                            renderDraftList();
                        }
                    });
                });
            }
            
            // Call renderDraftList on page load
            renderDraftList();
            
            // Cancel invoice
            cancelInvoiceBtn.addEventListener('click', resetInvoiceForm);
            
            // Generate invoice ID
            function generateInvoiceId() {
                const prefix = 'JHINV';
                const date = new Date();
                const year = date.getFullYear().toString().slice(-2);
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const randomNum = Math.floor(100 + Math.random() * 900);
                return `${prefix}-${year}${month}${day}-${randomNum}`;
            }
            
            // Reset invoice form
            function resetInvoiceForm() {
                document.getElementById('customer-name').value = '';
                document.getElementById('customer-email').value = '';
                document.getElementById('customer-phone').value = '';
                document.getElementById('customer-address').value = '';
                document.getElementById('invoice-notes').value = '';
                document.getElementById('discount').value = '0.00';
                
                // Reset items to one empty row
                invoiceItems.innerHTML = `
                    <tr>
                        <td><input type="text" class="form-control item-description" placeholder="Item description"></td>
                        <td><input type="number" class="form-control item-quantity" value="1" min="1"></td>
                        <td><input type="number" class="form-control item-price" placeholder="0.00" step="0.01"></td>
                        <td class="item-total">0.00</td>
                        <td><button class="action-btn delete-btn"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `;
                
                // Reset totals
                calculateTotals();
                
                // Add event listeners to new row
                addItemEventListeners(invoiceItems.querySelector('tr'));
                
                // Hide form if visible
                invoiceFormContainer.style.display = 'none';
                toggleFormBtn.innerHTML = '<i class="fas fa-plus"></i> New Invoice';
            }
            
            // Render invoice list
            function renderInvoiceList() {
                // Calculate status counts and totals
                const stats = {
                    pending: { count: 0, value: 0 },
                    paid: { count: 0, value: 0 },
                    overdue: { count: 0, value: 0 },
                    partial: { count: 0, value: 0 },
                    totalOutstanding: 0,
                    totalPaid: 0,
                    totalValue: 0,
                    paymentTimes: []
                };

                invoices.forEach(invoice => {
                    // Update invoice status
                    const currentStatus = StatusManager.updateInvoiceStatus(invoice);
                    if (!stats[currentStatus]) stats[currentStatus] = { count: 0, value: 0 };
                    stats[currentStatus].count++;
                    
                    // Calculate remaining amount for this invoice
                    const remainingAmount = invoice.paymentStatus ? invoice.paymentStatus.remaining : invoice.total;
                    stats[currentStatus].value += remainingAmount;

                    // Calculate financial stats
                    if (invoice.paymentStatus) {
                        // Only add to total outstanding if not fully paid
                        if (invoice.status !== 'paid') {
                            stats.totalOutstanding += invoice.paymentStatus.remaining || 0;
                        }
                        stats.totalPaid += invoice.paymentStatus.totalPaid || 0;
                        stats.totalValue += invoice.total;

                        // Calculate payment time if paid
                        if (invoice.status === 'paid' && invoice.paymentStatus.lastPaymentDate) {
                            const createDate = new Date(invoice.createdAt);
                            const paymentDate = new Date(invoice.paymentStatus.lastPaymentDate);
                            const daysToPay = Math.round((paymentDate - createDate) / (1000 * 60 * 60 * 24));
                            stats.paymentTimes.push(daysToPay);
                        }
                    }
                });

                // Update status counts, values, and progress bars
                const totalInvoices = invoices.length || 1; // Prevent division by zero
                ['pending', 'paid', 'overdue', 'partial'].forEach(status => {
                    const statusStats = stats[status] || { count: 0, value: 0 };
                    const percentage = (statusStats.count / totalInvoices) * 100;
                    
                    // Update count
                    document.getElementById(`${status}-count`).textContent = statusStats.count;
                    
                    // Update value
                    document.getElementById(`${status}-value`).textContent = 
                        formatCurrency(statusStats.value, invoices[0]?.currency || 'USD');
                    
                    // Update progress bar
                    document.getElementById(`${status}-progress`).style.width = `${percentage}%`;
                    
                    // Add hover effect to row
                    const row = document.getElementById(`${status}-progress`).closest('tr');
                    if (statusStats.count > 0) {
                        row.addEventListener('mouseover', () => row.style.backgroundColor = '#f8f9fa');
                        row.addEventListener('mouseout', () => row.style.backgroundColor = '');
                    }
                });

                // Update summary stats
                const collectionRate = stats.totalValue ? ((stats.totalPaid / stats.totalValue) * 100).toFixed(1) : 0;
                const avgPaymentTime = stats.paymentTimes.length ? 
                    Math.round(stats.paymentTimes.reduce((a, b) => a + b, 0) / stats.paymentTimes.length) : 0;

                document.getElementById('total-outstanding').textContent = formatCurrency(stats.totalOutstanding, 'USD');
                document.getElementById('collection-rate').textContent = `${collectionRate}%`;
                document.getElementById('avg-payment-time').textContent = `${avgPaymentTime} days`;

                if (invoices.length === 0) {
                    invoiceList.innerHTML = `
                        <div class="no-invoices" style="text-align: center; padding: 30px; color: var(--dark-gray);">
                            <i class="fas fa-file-invoice" style="font-size: 50px; margin-bottom: 15px; opacity: 0.5;"></i>
                            <p>No invoices created yet. Create your first invoice above.</p>
                        </div>
                    `;
                    return;
                }
                
                invoiceList.innerHTML = '';
                
                invoices.forEach(invoice => {
                    const invoiceElement = document.createElement('div');
                    invoiceElement.className = 'invoice-item';
                    invoiceElement.innerHTML = `
                        <div class="invoice-info">
                            <div class="invoice-number">
                                ${invoice.id} ${StatusManager.getStatusBadge(invoice.status)}
                            </div>
                            <div class="invoice-client">${invoice.customer.name}</div>
                            <div class="invoice-date">Date: ${formatDate(invoice.date)} | Due: ${formatDate(invoice.dueDate)}</div>
                            ${invoice.paymentStatus ? `
                            <div class="payment-info" style="font-size: 0.9em; color: #666;">
                                Paid: ${formatCurrency(invoice.paymentStatus.totalPaid, invoice.currency)} | 
                                Remaining: ${formatCurrency(invoice.paymentStatus.remaining, invoice.currency)}
                            </div>` : ''}
                        </div>
                        <div class="invoice-amount">${formatCurrency(invoice.total, invoice.currency)}</div>
                        <div class="invoice-actions">
                            <button class="btn btn-secondary btn-sm view-invoice" data-id="${invoice.id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn btn-primary btn-sm print-invoice" data-id="${invoice.id}">
                                <i class="fas fa-print"></i> Print
                            </button>
                            <button class="btn btn-danger btn-sm delete-invoice" data-id="${invoice.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    invoiceList.appendChild(invoiceElement);
                });
                
                // Add event listeners to invoice actions
                document.querySelectorAll('.view-invoice').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const invoiceId = this.getAttribute('data-id');
                        viewInvoice(invoiceId);
                    });
                });
                
                document.querySelectorAll('.print-invoice').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const invoiceId = this.getAttribute('data-id');
                        printInvoice(invoiceId);
                    });
                });
                
                document.querySelectorAll('.delete-invoice').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const invoiceId = this.getAttribute('data-id');
                        deleteInvoice(invoiceId);
                    });
                });

                document.querySelectorAll('.record-payment').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const invoiceId = this.getAttribute('data-id');
                        recordPayment(invoiceId);
                    });
                });
            }
            
            // View invoice details
            function viewInvoice(invoiceId) {
                const invoice = invoices.find(inv => inv.id === invoiceId);
                if (!invoice) return;
                
                // Create a modal-like view for the invoice details
                const viewContainer = document.createElement('div');
                viewContainer.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                `;
                
                const viewContent = document.createElement('div');
                viewContent.style.cssText = `
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    width: 80%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                `;
                
                // Close button
                const closeBtn = document.createElement('button');
                closeBtn.innerHTML = '<i class="fas fa-times"></i>';
                closeBtn.className = 'btn btn-danger';
                closeBtn.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 5px 10px;
                `;
                closeBtn.onclick = () => viewContainer.remove();
                
                // Build the invoice content
                viewContent.innerHTML = `
                    <div style="margin-right: 30px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                            <div>
                                <h1 style="color: var(--primary-color); margin-bottom: 5px;">JONGO-HUB</h1>
                                <p>Biaka Street, Buea, Cameroon</p>
                                <p>Email: invoices@jongohub.com</p>
                                <p>Phone: +237 672668139</p>
                            </div>
                            <div style="text-align: right;">
                                <h2 style="color: var(--primary-color); margin-bottom: 10px;">INVOICE</h2>
                                <p><strong>Invoice ID:</strong> ${invoice.id}</p>
                                <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                                <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 30px;">
                            <h3 style="border-bottom: 2px solid var(--accent-color); padding-bottom: 5px; margin-bottom: 10px;">Bill To</h3>
                            <p><strong>${invoice.customer.name}</strong></p>
                            ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ''}
                            ${invoice.customer.email ? `<p>${invoice.customer.email}</p>` : ''}
                            ${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ''}
                        </div>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                            <thead>
                                <tr style="background-color: var(--primary-color); color: white;">
                                    <th style="padding: 10px; text-align: left;">Description</th>
                                    <th style="padding: 10px; text-align: right; width: 80px;">Qty</th>
                                    <th style="padding: 10px; text-align: right; width: 100px;">Unit Price</th>
                                    <th style="padding: 10px; text-align: right; width: 100px;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.filter(item => item.description.trim() !== '').map(item => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${getCurrencySymbol(invoice.currency)}${item.price.toFixed(2)}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${getCurrencySymbol(invoice.currency)}${item.total.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div style="display: flex; justify-content: flex-end;">
                            <div style="width: 300px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span>Subtotal:</span>
                                    <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span>Tax (16%):</span>
                                    <span>${formatCurrency(invoice.tax, invoice.currency)}</span>
                                </div>
                                ${invoice.discount > 0 ? `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span>Discount:</span>
                                    <span>-${formatCurrency(invoice.discount, invoice.currency)}</span>
                                </div>
                                ` : ''}
                                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; padding-top: 10px; border-top: 2px solid var(--primary-color);">
                                    <span>Total:</span>
                                    <span>${formatCurrency(invoice.total, invoice.currency)}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${invoice.notes ? `
                        <div style="margin-top: 30px;">
                            <h3 style="border-bottom: 2px solid var(--accent-color); padding-bottom: 5px; margin-bottom: 10px;">Notes</h3>
                            <p>${invoice.notes}</p>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                viewContent.appendChild(closeBtn);
                viewContainer.appendChild(viewContent);
                document.body.appendChild(viewContainer);
                
                // Click outside to close
                viewContainer.addEventListener('click', function(e) {
                    if (e.target === viewContainer) {
                        viewContainer.remove();
                    }
                });
            }
            
            // Print invoice
            function printInvoice(invoiceId) {
                const invoice = invoices.find(inv => inv.id === invoiceId);
                if (!invoice) return;
                
                // Make print container visible
                printContainer.style.display = 'block';
                
                // Prepare print content
                printContainer.innerHTML = `
                    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                            <div>
                                <h1 style="color: var(--primary-color); margin-bottom: 5px;">JONGO-HUB</h1>
                                <p>Biaka Street, Buea, Cameroon</p>
                                <p>Email: invoices@jongohub.com</p>
                                <p>Phone: +237 672668139</p>
                            </div>
                            <div style="text-align: right;">
                                <h2 style="color: var(--primary-color); margin-bottom: 10px;">INVOICE</h2>
                                <p><strong>Invoice ID:</strong> ${invoice.id}</p>
                                <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
                                <p><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; margin-bottom: 30px;">
                            <div style="flex: 1; padding-right: 20px;">
                                <h3 style="border-bottom: 2px solid var(--accent-color); padding-bottom: 5px; margin-bottom: 10px;">Bill To</h3>
                                <p><strong>${invoice.customer.name}</strong></p>
                                ${invoice.customer.address ? `<p>${invoice.customer.address}</p>` : ''}
                                ${invoice.customer.email ? `<p>${invoice.customer.email}</p>` : ''}
                                ${invoice.customer.phone ? `<p>${invoice.customer.phone}</p>` : ''}
                            </div>
                        </div>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                            <thead>
                                <tr style="background-color: var(--primary-color); color: white;">
                                    <th style="padding: 10px; text-align: left;">Description</th>
                                    <th style="padding: 10px; text-align: right; width: 80px;">Qty</th>
                                    <th style="padding: 10px; text-align: right; width: 100px;">Unit Price</th>
                                    <th style="padding: 10px; text-align: right; width: 100px;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.filter(item => item.description.trim() !== '').map(item => `
                                    <tr>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${getCurrencySymbol(invoice.currency)}${item.price.toFixed(2)}</td>
                                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${getCurrencySymbol(invoice.currency)}${item.total.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div style="display: flex; justify-content: flex-end;">
                            <div style="width: 300px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span>Subtotal:</span>
                                    <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span>Tax (16%):</span>
                                    <span>${formatCurrency(invoice.tax, invoice.currency)}</span>
                                </div>
                                ${invoice.discount > 0 ? `
                                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                    <span>Discount:</span>
                                    <span>-${formatCurrency(invoice.discount, invoice.currency)}</span>
                                </div>
                                ` : ''}
                                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; padding-top: 10px; border-top: 2px solid var(--primary-color); margin-bottom: 30px;">
                                    <span>Total:</span>
                                    <span>${formatCurrency(invoice.total, invoice.currency)}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${invoice.notes ? `
                        <div style="margin-top: 30px;">
                            <h3 style="border-bottom: 2px solid var(--accent-color); padding-bottom: 5px; margin-bottom: 10px;">Notes</h3>
                            <p>${invoice.notes}</p>
                        </div>
                        ` : ''}
                        
                        <div style="margin-top: 50px; text-align: center; color: var(--dark-gray); font-size: 14px;">
                            <p>Thank you for your business!</p>
                            <p class="print-only">Printed on ${formatDate(new Date().toISOString())}</p>
                        </div>
                    </div>
                `;
                
                // Trigger print
                window.print();
                
                // Hide print container after printing
                setTimeout(() => {
                    printContainer.style.display = 'none';
                }, 100);
            }
            
            // Record payment
            function recordPayment(invoiceId) {
                const invoice = invoices.find(inv => inv.id === invoiceId);
                if (!invoice) return;

                // Create payment modal
                const modalContainer = document.createElement('div');
                modalContainer.className = 'payment-modal';
                
                modalContainer.innerHTML = `
                    <div class="payment-modal-content">
                        <h3>Record Payment</h3>
                        <div class="payment-form">
                            <div class="form-group">
                                <label>Amount Due:</label>
                                <div>${formatCurrency(invoice.paymentStatus.remaining || invoice.total, invoice.currency)}</div>
                            </div>
                            <div class="form-group">
                                <label>Payment Amount:</label>
                                <input type="number" id="payment-amount" class="form-control" 
                                    value="${invoice.paymentStatus.remaining || invoice.total}" 
                                    max="${invoice.paymentStatus.remaining || invoice.total}"
                                    step="0.01">
                            </div>
                            <div class="form-group">
                                <label>Payment Method:</label>
                                <select id="payment-method" class="form-control">
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="Mobile Money">Mobile Money</option>
                                    <option value="Credit Card">Credit Card</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Payment Date:</label>
                                <input type="date" id="payment-date" class="form-control" 
                                    value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Notes:</label>
                                <textarea id="payment-notes" class="form-control" rows="2"></textarea>
                            </div>
                            <div class="payment-actions">
                                <button class="btn btn-secondary" onclick="this.closest('.payment-modal').remove()">Cancel</button>
                                <button class="btn btn-success" id="save-payment">Save Payment</button>
                            </div>
                        </div>
                    </div>
                `;

                invoice.payments.push(payment);
                invoice.paymentStatus.totalPaid += paymentAmount;
                invoice.paymentStatus.remaining = Math.max(0, invoice.total - invoice.paymentStatus.totalPaid);
                invoice.paymentStatus.lastPaymentDate = payment.date;

                if (invoice.paymentStatus.remaining === 0) {
                    invoice.status = 'paid';
                    invoice.statusHistory.push({
                        status: 'paid',
                        date: new Date().toISOString(),
                        note: 'Full payment received'
                    });
                }

                localStorage.setItem('invoices', JSON.stringify(invoices));
                renderInvoiceList();
            }

            // Delete invoice
            function deleteInvoice(invoiceId) {
                if (confirm('Are you sure you want to delete this invoice?')) {
                    invoices = invoices.filter(inv => inv.id !== invoiceId);
                    localStorage.setItem('invoices', JSON.stringify(invoices));
                    renderInvoiceList();
                }
            }
            
            // Helper function to format date
            function formatDate(dateString) {
                const date = new Date(dateString);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }
            
            // Helper function to format currency
            function formatCurrency(amount, currency) {
                if (currency === 'USD') {
                    return `$${parseFloat(amount).toFixed(2)}`;
                } else {
                    return `FCFA ${parseFloat(amount).toFixed(2)}`;
                }
            }

            // Helper function to get currency symbol (for backwards compatibility)
            function getCurrencySymbol(currency) {
                return currency === 'USD' ? '$' : 'FCFA ';
            }
            
            // Status Manager Object
            const StatusManager = {
                statuses: {
                    pending: { label: 'Pending', color: '#ffa500', icon: 'fa-clock' },
                    paid: { label: 'Paid', color: '#28a745', icon: 'fa-check-circle' },
                    partial: { label: 'Partial', color: '#17a2b8', icon: 'fa-percentage' },
                    overdue: { label: 'Overdue', color: '#dc3545', icon: 'fa-exclamation-circle' },
                    draft: { label: 'Draft', color: '#6c757d', icon: 'fa-file' },
                    cancelled: { label: 'Cancelled', color: '#6c757d', icon: 'fa-ban' },
                    void: { label: 'Void', color: '#343a40', icon: 'fa-times-circle' },
                    refunded: { label: 'Refunded', color: '#fd7e14', icon: 'fa-undo' }
                },
                
                // Calculate days until due or overdue
                getDueDays: function(invoice) {
                    const today = new Date();
                    const dueDate = new Date(invoice.dueDate);
                    const diffTime = dueDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays;
                },
                
                // Get payment progress percentage
                getPaymentProgress: function(invoice) {
                    if (!invoice.paymentStatus) return 0;
                    return ((invoice.total - invoice.paymentStatus.remaining) / invoice.total) * 100;
                },

                updateInvoiceStatus: function(invoice) {
                    const today = new Date();
                    const dueDate = new Date(invoice.dueDate);
                    
                    if (invoice.status === 'draft') return 'draft';
                    if (invoice.status === 'cancelled') return 'cancelled';
                    if (invoice.paymentStatus?.remaining === 0) return 'paid';
                    if (invoice.paymentStatus?.totalPaid > 0) return 'partial';
                    if (today > dueDate) return 'overdue';
                    return 'pending';
                },

                getStatusBadge: function(status) {
                    const statusInfo = this.statuses[status] || this.statuses.pending;
                    return `<span class="badge" style="background-color: ${statusInfo.color}; color: white; padding: 3px 8px; border-radius: 4px;">
                        ${statusInfo.label}
                    </span>`;
                },

                addStatusHistory: function(invoice, newStatus, note = '') {
                    if (!invoice.statusHistory) invoice.statusHistory = [];
                    invoice.statusHistory.push({
                        status: newStatus,
                        date: new Date().toISOString(),
                        note: note || `Status changed to ${this.statuses[newStatus].label}`
                    });
                },

                // Get enhanced status badge with icon and tooltip
                getEnhancedStatusBadge: function(invoice) {
                    const status = invoice.status;
                    const statusInfo = this.statuses[status] || this.statuses.pending;
                    const dueDays = this.getDueDays(invoice);
                    const progress = this.getPaymentProgress(invoice);
                    
                    let tooltip = `Status: ${statusInfo.label}\\n`;
                    if (status === 'pending' || status === 'partial') {
                        tooltip += `Due in: ${Math.abs(dueDays)} days\\n`;
                    }
                    if (status === 'overdue') {
                        tooltip += `Overdue by: ${Math.abs(dueDays)} days\\n`;
                    }
                    if (status === 'partial') {
                        tooltip += `Payment Progress: ${progress.toFixed(1)}%`;
                    }

                    const gradientStart = this.adjustColor(statusInfo.color, 20);
                    const gradientEnd = this.adjustColor(statusInfo.color, -20);

                    return `
                        <div class="status-badge" style="
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            font-family: 'Segoe UI', Arial, sans-serif;
                            margin: 4px 0;"
                            title="${tooltip}">
                            <div style="
                                background: linear-gradient(135deg, ${gradientStart}, ${gradientEnd});
                                border-radius: 6px;
                                padding: 6px 12px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                transition: all 0.3s ease;">
                                <i class="fas ${statusInfo.icon}" style="color: white; font-size: 14px;"></i>
                                <span style="color: white; font-weight: 500; font-size: 14px;">${statusInfo.label}</span>
                            </div>
                            ${status === 'partial' ? `
                            <div style="
                                width: 80px;
                                height: 6px;
                                background: #f0f0f0;
                                border-radius: 3px;
                                overflow: hidden;
                                box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
                                <div style="
                                    width: ${progress}%;
                                    height: 100%;
                                    background: linear-gradient(to right, ${gradientStart}, ${gradientEnd});
                                    border-radius: 3px;
                                    transition: width 0.3s ease;">
                                </div>
                            </div>
                            <span style="
                                font-size: 12px;
                                color: #666;
                                font-weight: 500;">
                                ${progress.toFixed(1)}%
                            </span>
                            ` : ''}
                            ${status === 'pending' || status === 'overdue' ? `
                            <span style="
                                font-size: 12px;
                                color: ${status === 'overdue' ? '#dc3545' : '#666'};
                                font-weight: 500;">
                                ${status === 'overdue' ? `${Math.abs(dueDays)}d overdue` : `${dueDays}d left`}
                            </span>
                            ` : ''}
                        </div>
                    `;
                },

                // Helper function to adjust color brightness
                adjustColor: function(hex, percent) {
                    hex = hex.replace('#', '');
                    let r = parseInt(hex.substring(0, 2), 16);
                    let g = parseInt(hex.substring(2, 4), 16);
                    let b = parseInt(hex.substring(4, 6), 16);

                    r = Math.round(r * (100 + percent) / 100);
                    g = Math.round(g * (100 + percent) / 100);
                    b = Math.round(b * (100 + percent) / 100);

                    r = (r < 255) ? r : 255;
                    g = (g < 255) ? g : 255;
                    b = (b < 255) ? b : 255;

                    const rr = ((r.toString(16).length === 1) ? '0' + r.toString(16) : r.toString(16));
                    const gg = ((g.toString(16).length === 1) ? '0' + g.toString(16) : g.toString(16));
                    const bb = ((b.toString(16).length === 1) ? '0' + b.toString(16) : b.toString(16));

                    return '#' + rr + gg + bb;
                },

                // Check if invoice needs attention
                needsAttention: function(invoice) {
                    const dueDays = this.getDueDays(invoice);
                    return (
                        invoice.status === 'pending' && dueDays <= 3 || // Due soon
                        invoice.status === 'overdue' || // Overdue
                        (invoice.status === 'partial' && dueDays <= 0) // Partial payment and due/overdue
                    );
                },

                // Get summary of invoice status for notifications
                getStatusSummary: function(invoice) {
                    if (!invoice) return null;
                    
                    const dueDays = this.getDueDays(invoice);
                    const progress = this.getPaymentProgress(invoice);
                    
                    let summary = {
                        needsAttention: this.needsAttention(invoice),
                        message: '',
                        actionNeeded: ''
                    };

                    switch (invoice.status) {
                        case 'pending':
                            summary.message = dueDays > 0 
                                ? `Due in ${dueDays} days` 
                                : `Overdue by ${Math.abs(dueDays)} days`;
                            summary.actionNeeded = 'Payment collection needed';
                            break;
                        case 'partial':
                            summary.message = `${progress.toFixed(1)}% paid`;
                            summary.actionNeeded = 'Follow up on remaining payment';
                            break;
                        case 'overdue':
                            summary.message = `Overdue by ${Math.abs(dueDays)} days`;
                            summary.actionNeeded = 'Urgent payment collection needed';
                            break;
                        case 'draft':
                            summary.message = 'Draft invoice';
                            summary.actionNeeded = 'Complete and send invoice';
                            break;
                        default:
                            summary.message = `Status: ${invoice.status}`;
                            summary.actionNeeded = '';
                    }
                    
                    return summary;
                },

                // Bulk status update for all invoices
                bulkStatusUpdate: function() {
                    let updates = {
                        changed: 0,
                        overdue: 0,
                        needsAttention: 0,
                        summary: []
                    };

                    invoices = invoices.map(invoice => {
                        const oldStatus = invoice.status;
                        const newStatus = this.updateInvoiceStatus(invoice);
                        
                        if (newStatus !== oldStatus) {
                            invoice.status = newStatus;
                            this.addStatusHistory(invoice, newStatus);
                            updates.changed++;
                            
                            updates.summary.push({
                                invoiceId: invoice.id,
                                customer: invoice.customer.name,
                                oldStatus,
                                newStatus,
                                needsAttention: this.needsAttention(invoice)
                            });
                        }

                        if (newStatus === 'overdue') updates.overdue++;
                        if (this.needsAttention(invoice)) updates.needsAttention++;
                        
                        return invoice;
                    });

                    return updates;
                }
            };

            // Initialize the page with status management
            renderInvoiceList();

            // Update statuses periodically (every hour)
            setInterval(() => {
                try {
                    let needsUpdate = false;
                    if (!Array.isArray(invoices)) {
                        console.error('Invoices is not an array:', invoices);
                        invoices = [];
                        return;
                    }

                    invoices = invoices.map(invoice => {
                        if (!invoice || typeof invoice !== 'object') {
                            console.error('Invalid invoice object:', invoice);
                            return invoice;
                        }

                        const newStatus = StatusManager.updateInvoiceStatus(invoice);
                        if (newStatus !== invoice.status) {
                            needsUpdate = true;
                            invoice.status = newStatus;
                            StatusManager.addStatusHistory(invoice, newStatus, 'Auto-updated status');
                        }
                        return invoice;
                    });

                    if (needsUpdate) {
                        localStorage.setItem('invoices', JSON.stringify(invoices));
                        renderInvoiceList();
                        console.log('Status updates applied:', new Date().toISOString());
                    }
                } catch (error) {
                    console.error('Error updating statuses:', error);
                }
            }, 3600000); // Check every hour

            // Initial status check
            setTimeout(() => {
                const updates = StatusManager.bulkStatusUpdate();
                if (updates.changed > 0) {
                    console.log('Initial status updates:', updates);
                    localStorage.setItem('invoices', JSON.stringify(invoices));
                    renderInvoiceList();
                }
            }, 1000); // Check once after page load
        });

document.addEventListener('DOMContentLoaded', function() {
    const productCards = document.querySelectorAll('.product-card');
    const cartContainer = document.querySelector('.cart-items');
    const currencySelect = document.getElementById('currencySelect');

    // Add click event listeners to all product cards
    productCards.forEach(card => {
        const addButton = card.querySelector('.add-product-btn');
        addButton.addEventListener('click', () => addToCart(card));
    });

    // Currency select change handler
    currencySelect.addEventListener('change', () => {
        updateAllPrices();
        updateSubtotal();
    });

    function addToCart(productCard) {
        const productName = productCard.getAttribute('data-name');
        const existingItem = findCartItem(productName);

        if (existingItem) {
            const quantityInput = existingItem.querySelector('.quantity-input');
            quantityInput.value = parseInt(quantityInput.value) + 1;
        } else {
            const cartItem = createCartItem(productCard);
            cartContainer.appendChild(cartItem);
        }
        updateSubtotal();
    }

    function createCartItem(productCard) {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.setAttribute('data-name', productCard.getAttribute('data-name'));
        cartItem.setAttribute('data-price', productCard.getAttribute('data-price'));
        cartItem.setAttribute('data-price-usd', productCard.getAttribute('data-price-usd'));

        cartItem.innerHTML = `
            <div class="item-name">${productCard.getAttribute('data-name')}</div>
            <div class="item-price"></div>
            <div class="item-quantity">
                <input type="number" class="quantity-input" value="1" min="1">
            </div>
            <div class="item-remove">
                <button class="btn btn-danger btn-sm remove-item-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const quantityInput = cartItem.querySelector('.quantity-input');
        const removeButton = cartItem.querySelector('.remove-item-btn');

        quantityInput.addEventListener('change', () => {
            if (parseInt(quantityInput.value) < 1) {
                quantityInput.value = 1;
            }
            updateSubtotal();
        });

        removeButton.addEventListener('click', () => {
            cartItem.remove();
            updateSubtotal();
        });

        updateItemPrice(cartItem);
        return cartItem;
    }

    function findCartItem(productName) {
        return Array.from(document.querySelectorAll('.cart-item')).find(
            item => item.getAttribute('data-name') === productName
        );
    }

    function updateAllPrices() {
        document.querySelectorAll('.cart-item').forEach(updateItemPrice);
    }

    function updateItemPrice(item) {
        const selectedCurrency = currencySelect.value;
        const priceDisplay = item.querySelector('.item-price');
        let price;
        
        if (selectedCurrency === 'USD') {
            price = parseFloat(item.getAttribute('data-price-usd'));
            priceDisplay.textContent = `USD ${price.toLocaleString()}`;
        } else {
            price = parseFloat(item.getAttribute('data-price'));
            priceDisplay.textContent = `${price.toLocaleString()} XAF`;
        }
    }

    function updateSubtotal() {
        let subtotal = 0;
        const cartItems = document.querySelectorAll('.cart-item');
        const selectedCurrency = currencySelect.value;

        cartItems.forEach(item => {
            let price;
            if (selectedCurrency === 'USD') {
                price = parseFloat(item.getAttribute('data-price-usd'));
            } else {
                price = parseFloat(item.getAttribute('data-price'));
            }
            const quantity = parseInt(item.querySelector('.quantity-input').value);
            subtotal += price * quantity;
        });

        let currencySymbol = selectedCurrency === 'USD' ? 'USD' : 'XAF';
        document.getElementById('subtotal').textContent = `${currencySymbol} ${subtotal.toLocaleString()}`;
    }
});
