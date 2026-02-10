

 

    (function () {

        let lastPriceSummaryHash = "";

        let renderTimer = null;

        

        // ────────────────────────────────────────────────

        // CONFIG – change these when form labels change

        // ────────────────────────────────────────────────

        const CONFIG = {

            labels: {

                product: "Primary System Type",

                subProducts: "Water Treatment Configuration",

                addons: "Select Add-ons",

                discount: "Approved Discount Amount",

                finalPrice: "Final Price",

                deposit: "Deposit Amount Payable Today",

                balance: "Balance Amount",

                totalAmount: "Total Amount",

                // fields to save the collective amounts of taps, plumbing extras, and other extras and addons (if needed for record-keeping)

                addonsAmount: "Add Ons Amount",

                tapsAmount: "Taps Amount",

                plumbingExtrasAmount: "Plumbing Extras Amount",

                otherExtrasAmount: "Other Extras Amount"

            },

            checkboxGroups: {

                taps: {

                    label: "Mixer Tap Required",

                    name: "selected_taps"          // fallback

                },

                plumbing: {

                    label: "Plumbing Extras Required",

                    name: "selected_plumbing_extras"

                },

                otherExtras: {

                    label: "Additional Extras",

                    name: "select_other_extras"

                }

            }

        };

        // ────────────────────────────────────────────────

        // PRICES (AUD)

        // ────────────────────────────────────────────────

        const productPrices = {

            // Main products

            "Full Home POE (Point of Entry) FHF-20": 4620,

            "Full Home POE (Point of Entry) FHF-10": 4220,

            "Full Home 4 Stage UV System FHF-UV-20": 4990,

            // Sub-products – can now select multiple

            "(RO) Reverse Osmosis 5 stage FH-RO TANKLESS": 1590,

            "(UF) Ultra Filtration & Mineralised 5 Stage (Tankless & NON electric)": 979

        };

        const addonPrices = {

            // Add-ons multiselect

            "Filters - Shower Purifier": 65,

            "Shower Purifier": 215,

            "Additional Plumbing RO/UF": 141,

            "Pipe work after 2m from POE": 40,

            "Additional Plumbing": 141,

            "20mm Pressure Reduction Valve (PRV)": 196,

            "Stand Alone Posts": 88,

            "FMW 3 Way Mixer Tap - Pullout BG": 495,

            "Installation of Customer Own Sourced Tap": 65,

            "FMW 3 Way Mixer Tap - Pullout MB": 495,

            "FMW 3 Way Mixer Tap - Pullout BS": 485,

            "FMW 3 Way Mixer Tap - Standard Gold": 395,

            "FMW 3 Way Mixer Tap - Standard": 395,

            "SKU: [Matte Black-TAP-STD3-PO-MB] FMW 3 Way Mixer Tap - Pullout": 495,

            "SKU: [Brushed Gold-TAP-STD3-PO-BG] FMW 3 Way Mixer Tap - Pullout": 495,

            "SKU: [Stainless-TAP-STD3-PO-BS] FMW 3 Way Mixer Tap - Pullout": 455,

            "SKU: [Matte Black TAP-STD3-MB] FMW 3 Way Mixer Tap - Standard": 395,

            "SKU: [Brushed Gold TAP-STD3-BG] FMW 3 Way Mixer Tap - Standard": 395,

            "SKU: [Stainless TAP-STD3-BS] FMW 3 Way Mixer Tap - Standard": 355,

            // Taps (checkboxes)

            "Black 2-way tap for RO & 1-Way for UF only": 65,

            "SKU: [Stainless TAP-STD3-BS] FMW 3 Way Mixer Tap - Standard": 355,

            // Plumbing Extras (checkboxes)

            "Customer supplied separate 2 way Mixer tap": 65,

            "Drill into stone": 120,

            "Line Tracing": 330,

            // Other Extras (checkboxes)

            "ABI 3 way Mixer Tap - Brushed Gold & Matt Black": 884,

            "Powder Coating": 195

        };

        // ────────────────────────────────────────────────

        // DOM cache

        // ────────────────────────────────────────────────

        let elements = {

            productTags: null,

            subProductsTags: null,          // ← renamed for clarity (plural)

            addonTags: null,

            tapsCheckboxes: [],

            plumbingCheckboxes: [],

            otherExtrasCheckboxes: [],

            discountInput: null,

            finalInput: null,

            depositInput: null,

            balanceInput: null,

            totalAmountInput: null

        };

        // ────────────────────────────────────────────────

        // Helpers: find by label

        // ────────────────────────────────────────────────

        function findInputByLabel(labelText) {

            const labels = document.querySelectorAll('.field-label, label.label-alignment');

            for (const label of labels) {

                let text = label.textContent.trim();

                if (text === labelText || text.startsWith(labelText)) {

                    let forId = label.getAttribute('for');

                    if (forId) return document.getElementById(forId);

                    const input = label.closest('.form-field-wrapper, .form-builder--item')

                        ?.querySelector('input, textarea, .multiselect');

                    if (input) return input;

                }

            }

            return null;

        }

        function findMultiselectTagsByLabel(labelText) {

            const container = findInputByLabel(labelText)?.closest('.multiselect');

            return container?.querySelector('.multiselect__tags') || null;

        }

        function findCheckboxesByGroupLabel(groupLabel) {

            const labelEl = Array.from(document.querySelectorAll('.field-label, label.label-alignment'))

                .find(el => el.textContent.trim() === groupLabel);

            if (!labelEl) return [];

            const container = labelEl.closest('.form-field-wrapper, .form-builder--item');

            return container ? Array.from(container.querySelectorAll('input[type="checkbox"]')) : [];

        }

        // ────────────────────────────────────────────────

        // Gather all elements

        // ────────────────────────────────────────────────

        function findFormElements() {

            elements.productTags = findMultiselectTagsByLabel(CONFIG.labels.product);

            elements.subProductsTags = findMultiselectTagsByLabel(CONFIG.labels.subProducts);

            elements.addonTags = findMultiselectTagsByLabel(CONFIG.labels.addons);

            elements.tapsCheckboxes = findCheckboxesByGroupLabel(CONFIG.checkboxGroups.taps.label);

            elements.plumbingCheckboxes = findCheckboxesByGroupLabel(CONFIG.checkboxGroups.plumbing.label);

            elements.otherExtrasCheckboxes = findCheckboxesByGroupLabel(CONFIG.checkboxGroups.otherExtras.label);

            elements.discountInput = findInputByLabel(CONFIG.labels.discount);

            elements.finalInput = findInputByLabel(CONFIG.labels.finalPrice);

            elements.depositInput = findInputByLabel(CONFIG.labels.deposit);

            elements.balanceInput = findInputByLabel(CONFIG.labels.balance);

            elements.totalAmountInput = findInputByLabel(CONFIG.labels.totalAmount);

            // Optional: also find inputs for the collective amounts of taps, plumbing extras, other extras and addons if needed

            elements.addonsAmountInput = findInputByLabel(CONFIG.labels.addonsAmount);

            elements.tapsAmountInput = findInputByLabel(CONFIG.labels.tapsAmount);

            elements.plumbingExtrasAmountInput = findInputByLabel(CONFIG.labels.plumbingExtrasAmount);

            elements.otherExtrasAmountInput = findInputByLabel(CONFIG.labels.otherExtrasAmount);

            // Make calculated fields read-only

            [elements.finalInput, elements.balanceInput, elements.totalAmountInput, elements.addonsAmountInput, elements.tapsAmountInput, elements.plumbingExtrasAmountInput, elements.otherExtrasAmountInput].forEach(el => {

                if (el) el.readOnly = true;

            });

        }

        // ────────────────────────────────────────────────

        // Get selections

        // ────────────────────────────────────────────────

        function getSelectedProduct() {

            if (!elements.productTags) return '';

            const single = elements.productTags.querySelector('.multiselect__single');

            return single ? single.textContent.trim() : '';

        }

        function getSelectedSubProducts() {

            if (!elements.subProductsTags) return [];

            return Array.from(

                elements.subProductsTags.querySelectorAll('.multiselect__tag span:first-child')

            ).map(span => span.textContent.trim());

        }

        function getSelectedAddons() {

            if (!elements.addonTags) return [];

            return Array.from(

                elements.addonTags.querySelectorAll('.multiselect__tag span:first-child')

            ).map(span => span.textContent.trim());

        }

        function getCheckedValues(checkboxes) {

            return Array.from(checkboxes || [])

                .filter(cb => cb.checked)

                .map(cb => cb.value.trim());

        }

        // ────────────────────────────────────────────────

        // Safe value setter

        // ────────────────────────────────────────────────

        function setValueSafely(input, value) {

            if (!input) return;

            const str = Number(value).toFixed(2);

            const nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;

            nativeSet.call(input, '');

            input.dispatchEvent(new Event('input', { bubbles: true }));

            nativeSet.call(input, str);

            input.dispatchEvent(new Event('input', { bubbles: true }));

            input.dispatchEvent(new Event('change', { bubbles: true }));

            input.value = str;

        }

        // ────────────────────────────────────────────────

        // Render Pricing Summary 

        // ────────────────────────────────────────────────

        function renderTableSection(title, items, priceMap) {

  if (!items.length) return "";

  let total = 0;

  let rows = "";

  items.forEach(item => {

    const price = priceMap[item] || 0;

    total += price;

    rows += `

      <div style="display:flex;justify-content:space-between;padding:2px 0;">

        <span style="padding-left:12px;">• ${item}</span>

        <span>$${price.toLocaleString()}</span>

      </div>

    `;

  });

  return `

    <div style="margin-bottom:12px;">

      <div style="

        display:flex;

        justify-content:space-between;

        font-weight:600;

        background:#f1f5f9;

        padding:6px 8px;

        border-radius:4px;

      ">

        <span>${title}</span>

        <span>$${total.toLocaleString()}</span>

      </div>

      ${rows}

    </div>

  `;

}

     function renderPriceSummary(data) {

  // Prevent infinite loops

  const hash = JSON.stringify(data);

  if (hash === lastPriceSummaryHash) {

    return;

  }

  lastPriceSummaryHash = hash;

  clearTimeout(renderTimer);

  renderTimer = setTimeout(() => {

    const {

      mainProduct, mainPrice,

      subProducts, subProductsTotal,

      addons, addonsTotal,

      taps, tapsTotal,

      plumbing, plumbingTotal,

      extras, extrasTotal,

      subtotal, discount, final, deposit, balance

    } = data;

    const submitWrapper = document.querySelector(

      '.form-builder--item.form-builder--btn-submit'

    );

    if (!submitWrapper) return;

    let container = document.getElementById('price-summary-container');

    const shouldShow =

      subtotal > 0 ||

      discount > 0 ||

      deposit > 0 ||

      final > 0;

    if (!shouldShow) {

      if (container) container.remove();

      return;

    }

    // Create container once

    if (!container) {

      container = document.createElement('div');

      container.id = 'price-summary-container';

      container.style.cssText = `

        background:#ffffff;

        border:1px solid #e5e7eb;

        border-radius:8px;

        padding:18px;

        margin:0 0 24px 0;

        font-family:Inter,sans-serif;

        font-size:14.5px;

        color:#1f2933;

        box-shadow:0 1px 3px rgba(0,0,0,0.08);

      `;

      submitWrapper.parentNode.insertBefore(

        container,

        submitWrapper

      );

    }

    // ===============================

    // Build HTML

    // ===============================

    let html = `

      <div>

        <h3 style="

          margin:0 0 14px;

          font-size:1.3rem;

          color:#0f172a;

          border-bottom:2px solid #e5e7eb;

          padding-bottom:6px;

        ">

          📄 Price Summary

        </h3>

    `;

    // Main product

    if (mainPrice > 0) {

      html += `

        <div style="

          display:flex;

          justify-content:space-between;

          font-weight:700;

          font-size:15px;

          margin-bottom:14px;

        ">

          <span>Main System: ${mainProduct}</span>

          <span>$${mainPrice.toLocaleString()}</span>

        </div>

      `;

    }

    // Sections

    html += renderTableSection(

      "Sub Products",

      subProducts,

      productPrices

    );

    html += renderTableSection(

      "Add-ons",

      addons,

      addonPrices

    );

    html += renderTableSection(

      "Taps",

      taps,

      addonPrices

    );

    html += renderTableSection(

      "Plumbing",

      plumbing,

      addonPrices

    );

    html += renderTableSection(

      "Extras",

      extras,

      addonPrices

    );

    // Divider

    html += `<hr style="margin:14px 0;border-color:#e5e7eb;">`;

    // Subtotal

    html += `

      <div style="

        display:flex;

        justify-content:space-between;

        font-weight:600;

        margin-bottom:4px;

      ">

        <span>Subtotal</span>

        <span>$${subtotal.toLocaleString()}</span>

      </div>

    `;

    // Discount

    if (discount > 0) {

      html += `

        <div style="

          display:flex;

          justify-content:space-between;

          color:#dc2626;

          margin-bottom:6px;

        ">

          <span>Discount</span>

          <span>-$${discount.toLocaleString()}</span>

        </div>

      `;

    }

    // Final

    html += `

      <div style="

        display:flex;

        justify-content:space-between;

        margin:12px 0;

        font-size:1.2rem;

        font-weight:700;

        color:#047857;

      ">

        <span>Final Price</span>

        <span>$${final.toLocaleString()}</span>

      </div>

    `;

    // Deposit

    if (deposit > 0) {

      html += `

        <div style="

          display:flex;

          justify-content:space-between;

          margin-bottom:4px;

        ">

          <span>Deposit Paid</span>

          <span>$${deposit.toLocaleString()}</span>

        </div>

      `;

    }

    // Balance

    if (balance > 0) {

      html += `

        <div style="

          display:flex;

          justify-content:space-between;

          font-weight:700;

          color:#1d4ed8;

          background:#eef2ff;

          padding:6px 8px;

          border-radius:4px;

          margin-top:6px;

        ">

          <span>Balance Due</span>

          <span>$${balance.toLocaleString()}</span>

        </div>

      `;

    }

    html += `</div>`;

    container.innerHTML = html;

  }, 120); // debounce delay

}

        // ────────────────────────────────────────────────

        // Calculation + Validation

        // ────────────────────────────────────────────────

       function calculateAndValidate() {

    const mainProduct = getSelectedProduct();

    const subProducts = getSelectedSubProducts(); // array

    const addons = getSelectedAddons();

    const taps = getCheckedValues(elements.tapsCheckboxes);

    const plumbing = getCheckedValues(elements.plumbingCheckboxes);

    const extras = getCheckedValues(elements.otherExtrasCheckboxes);

    let subtotal = 0;

    // -------------------------------

    // Totals

    // -------------------------------

    const mainPrice = productPrices[mainProduct] || 0;

    const subProductsTotal = subProducts.reduce(

        (s, item) => s + (productPrices[item] || 0),

        0

    );

    const addonsTotal = addons.reduce(

        (s, item) => s + (addonPrices[item] || 0),

        0

    );

    const tapsTotal = taps.reduce(

        (s, item) => s + (addonPrices[item] || 0),

        0

    );

    const plumbingTotal = plumbing.reduce(

        (s, item) => s + (addonPrices[item] || 0),

        0

    );

    const extrasTotal = extras.reduce(

        (s, item) => s + (addonPrices[item] || 0),

        0

    );

    // -------------------------------

    // Fill individual amount fields

    // -------------------------------

    setValueSafely(elements.addonsAmountInput, addonsTotal);

    setValueSafely(elements.tapsAmountInput, tapsTotal);

    setValueSafely(elements.plumbingExtrasAmountInput, plumbingTotal);

    setValueSafely(elements.otherExtrasAmountInput, extrasTotal);

    // -------------------------------

    // Subtotal

    // -------------------------------

    subtotal =

        mainPrice +

        subProductsTotal +

        addonsTotal +

        tapsTotal +

        plumbingTotal +

        extrasTotal;

    setValueSafely(elements.totalAmountInput, subtotal);

    // -------------------------------

    // Discount

    // -------------------------------

    let discount = Number(elements.discountInput?.value) || 0;

    if (discount > subtotal) {

        discount = subtotal;

        setValueSafely(elements.discountInput, discount);

        alert("Discount cannot exceed the subtotal.");

    }

    // -------------------------------

    // Final / Deposit / Balance

    // -------------------------------

    const final = Math.max(0, subtotal - discount);

    setValueSafely(elements.finalInput, final);

    let deposit = Number(elements.depositInput?.value) || 0;

    if (deposit > final) {

        deposit = final;

        setValueSafely(elements.depositInput, deposit);

        alert("Deposit cannot exceed the Final Price.");

    }

    const balance = Math.max(0, final - deposit);

    setValueSafely(elements.balanceInput, balance);

    // -------------------------------

    // 🔥 Render Summary

    // -------------------------------

    renderPriceSummary({

        mainProduct,

        mainPrice,

        subProducts,

        subProductsTotal,

        addons,

        addonsTotal,

        taps,

        tapsTotal,

        plumbing,

        plumbingTotal,

        extras,

        extrasTotal,

        subtotal,

        discount,

        final,

        deposit,

        balance

    });

}

        // ────────────────────────────────────────────────

        // Listeners & Observers

        // ────────────────────────────────────────────────

        function attachListenersAndObservers() {

            const obsCfg = { childList: true, subtree: true, characterData: true };

            // Watch all multiselect tags

            [elements.productTags, elements.subProductsTags, elements.addonTags]

                .forEach(el => {

                    if (el) new MutationObserver(calculateAndValidate).observe(el, obsCfg);

                });

            // Watch checkboxes

            [...elements.tapsCheckboxes, ...elements.plumbingCheckboxes, ...elements.otherExtrasCheckboxes]

                .forEach(cb => {

                    cb.removeEventListener('change', calculateAndValidate);

                    cb.addEventListener('change', calculateAndValidate);

                });

            // Watch manual inputs

            [elements.discountInput, elements.depositInput].forEach(input => {

                if (input) {

                    input.removeEventListener('input', calculateAndValidate);

                    input.addEventListener('input', calculateAndValidate);

                }

            });

            calculateAndValidate(); // initial run

        }

        // ────────────────────────────────────────────────

        // Form mutation observer (handles GHL re-renders)

        // ────────────────────────────────────────────────

        const container = document.querySelector('#_builder-form') || document.body;

        new MutationObserver(() => {

            findFormElements();

            attachListenersAndObservers();

        }).observe(container, { childList: true, subtree: true });

        // Initial setup

        findFormElements();

        attachListenersAndObservers();

        console.log("GHL Price Calculator – Sub Product now multi-select");

    })();


