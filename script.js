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
