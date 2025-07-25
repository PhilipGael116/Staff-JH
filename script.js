        // Sample product data
        const products = [
            { id: 1, name: "Website Development", price: 1500.00 },
            { id: 2, name: "Mobile App Development", price: 2500.00 },
            { id: 3, name: "SEO Package", price: 500.00 },
            { id: 4, name: "Social Media Management", price: 800.00 },
            { id: 5, name: "Content Writing", price: 50.00 },
            { id: 6, name: "Graphic Design", price: 200.00 },
            { id: 7, name: "Domain Registration", price: 15.00 },
            { id: 8, name: "Hosting Service", price: 30.00 },
            { id: 9, name: "IT Consultation", price: 100.00 },
            { id: 10, name: "Software Training", price: 75.00 }
        ];

        document.addEventListener('DOMContentLoaded', function() {
            // Set current date
            const today = new Date();
            document.getElementById('invoice-date').textContent = formatDate(today);
            
            // Set due date based on payment terms
            document.getElementById('payment-terms').addEventListener('change', updateDueDate);
            updateDueDate();
            
            // Client selection
            document.getElementById('client-select').addEventListener('change', function() {
                const clientDetails = document.getElementById('client-details');
                if (this.value) {
                    clientDetails.style.display = 'block';
                    // In a real app, you would fetch client details from your database
                    document.getElementById('client-name').textContent = this.options[this.selectedIndex].text;
                    document.getElementById('client-address').textContent = '123 Client Street, Nairobi';
                    document.getElementById('client-email').textContent = 'client' + this.value + '@example.com';
                } else {
                    clientDetails.style.display = 'none';
                }
            });
            
            // Add item button
            document.getElementById('add-item-btn').addEventListener('click', addNewItem);
            
            // Initialize with one empty item
            addNewItem();
            
            // Calculate totals when inputs change
            document.getElementById('invoice-items').addEventListener('input', function(e) {
                if (e.target.classList.contains('item-quantity') || 
                    e.target.classList.contains('item-price')) {
                    updateItemTotal(e.target.closest('tr'));
                    calculateTotals();
                }
            });
            
            // Delete item button
            document.getElementById('invoice-items').addEventListener('click', function(e) {
                const deleteBtn = e.target.closest('.delete-btn');
                if (deleteBtn) {
                    const row = deleteBtn.closest('tr');
                    if (document.querySelectorAll('#invoice-items tr').length > 1) {
                        row.remove();
                        renumberItems();
                        calculateTotals();
                    } else {
                        alert('You must have at least one item in the invoice.');
                    }
                }
            });
            
            // Populate product list
            const productList = document.getElementById('product-list');
            products.forEach(product => {
                const productItem = document.createElement('div');
                productItem.className = 'product-item';
                productItem.innerHTML = `
                    <span class="product-name">${product.name}</span>
                    <span class="product-price">${window.formatCurrency ? window.formatCurrency(product.price) : ('$' + product.price.toFixed(2))}</span>
                `;
                productItem.addEventListener('click', () => {
                    addProductToInvoice(product);
                });
                productList.appendChild(productItem);
            });
            
            function formatDate(date) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}/${month}/${year}`;
            }
            
            function updateDueDate() {
                const terms = parseInt(document.getElementById('payment-terms').value);
                const invoiceDate = new Date();
                const dueDate = new Date(invoiceDate);
                dueDate.setDate(invoiceDate.getDate() + terms);
                document.getElementById('due-date').textContent = formatDate(dueDate);
            }
            
            function addNewItem() {
                const tbody = document.getElementById('invoice-items');
                const newRow = document.createElement('tr');
                const itemCount = tbody.querySelectorAll('tr').length + 1;
                
                newRow.innerHTML = `
                    <td>${itemCount}</td>
                    <td><input type="text" class="item-description" placeholder="Item description"></td>
                    <td><input type="number" class="item-quantity" value="1" min="1"></td>
                    <td><input type="number" class="item-price" placeholder="0.00" step="0.01"></td>
                    <td class="item-total">${window.formatCurrency ? window.formatCurrency(0) : '$0.00'}</td>
                    <td><button class="action-btn delete-btn"><ion-icon name="trash-outline"></ion-icon></button></td>
                `;
                
                tbody.appendChild(newRow);
                // Focus on the description field of the new row
                newRow.querySelector('.item-description').focus();
            }
            
            function addProductToInvoice(product) {
                const tbody = document.getElementById('invoice-items');
                const newRow = document.createElement('tr');
                const itemCount = tbody.querySelectorAll('tr').length + 1;
                
                newRow.innerHTML = `
                    <td>${itemCount}</td>
                    <td><input type="text" class="item-description" value="${product.name}"></td>
                    <td><input type="number" class="item-quantity" value="1" min="1"></td>
                    <td><input type="number" class="item-price" value="${product.price.toFixed(2)}" step="0.01"></td>
                    <td class="item-total">${window.formatCurrency ? window.formatCurrency(product.price) : ('$' + product.price.toFixed(2))}</td>
                    <td><button class="action-btn delete-btn"><ion-icon name="trash-outline"></ion-icon></button></td>
                `;
                
                tbody.appendChild(newRow);
                calculateTotals();
            }
            
            function updateItemTotal(row) {
                const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;
                const total = quantity * price;
                row.querySelector('.item-total').textContent = window.formatCurrency ? window.formatCurrency(total) : ('$' + total.toFixed(2));
            }
            
            function renumberItems() {
                const rows = document.querySelectorAll('#invoice-items tr');
                rows.forEach((row, index) => {
                    row.cells[0].textContent = index + 1;
                });
            }
            
            function calculateTotals() {
                let subtotal = 0;
                const itemTotals = document.querySelectorAll('.item-total');
                itemTotals.forEach(item => {
                    const value = parseFloat(item.textContent.replace(/[^\d.]/g, '')) || 0;
                    subtotal += value;
                });
                const taxRate = 0.16; // 16% tax
                const taxAmount = subtotal * taxRate;
                const grandTotal = subtotal + taxAmount;
                document.getElementById('subtotal').textContent = window.formatCurrency ? window.formatCurrency(subtotal) : ('$' + subtotal.toFixed(2));
                document.getElementById('tax-amount').textContent = window.formatCurrency ? window.formatCurrency(taxAmount) : ('$' + taxAmount.toFixed(2));
                document.getElementById('grand-total').textContent = window.formatCurrency ? window.formatCurrency(grandTotal) : ('$' + grandTotal.toFixed(2));
            }
        });

           // --- Currency logic ---
    let currency = 'USD';
    let currencySymbol = '$';
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
        currencySelect.addEventListener('change', function() {
            currency = this.value;
            currencySymbol = currency === 'USD' ? '$' : 'FCFA';
            updateAllCurrencyDisplays();
        });
    }

    function updateAllCurrencyDisplays() {
        // Update all item totals
        document.querySelectorAll('.item-total').forEach(td => {
            const value = parseFloat(td.textContent.replace(/[^\d.]/g, '')) || 0;
            if (currency === 'FCFA') {
                td.textContent = value.toFixed(2) + ' FCFA';
            } else {
                td.textContent = '$' + value.toFixed(2);
            }
        });
        // Update totals
        ['subtotal','tax-amount','discount-amount','grand-total'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const value = parseFloat(el.textContent.replace(/[^\d.]/g, '')) || 0;
                if (currency === 'FCFA') {
                    el.textContent = value.toFixed(2) + ' FCFA';
                } else {
                    el.textContent = '$' + value.toFixed(2);
                }
            }
        });
        // Update product list prices
        document.querySelectorAll('.product-price').forEach(span => {
            const value = parseFloat(span.textContent.replace(/[^\d.]/g, '')) || 0;
            if (currency === 'FCFA') {
                span.textContent = value.toFixed(2) + ' FCFA';
            } else {
                span.textContent = '$' + value.toFixed(2);
            }
        });
    }
    // Patch for script.js logic
    window.formatCurrency = function(value) {
        if (currency === 'FCFA') {
            return value.toFixed(2) + ' FCFA';
        } else {
            return '$' + value.toFixed(2);
        }
    }
    window.getCurrencySymbol = function() {
        return currencySymbol;
    }
    // Listen for DOMContentLoaded to update on load
    document.addEventListener('DOMContentLoaded', function() {
        updateAllCurrencyDisplays();
    });