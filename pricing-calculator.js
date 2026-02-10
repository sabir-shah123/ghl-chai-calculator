/* ===============================
   GHL Price Calculator
   External Safe Script
================================ */

(function () {

    var TAX_RATE = 0.10;

    /* ================= CONFIG ================= */

    var CONFIG = {
        labels: {
            product: "Primary System Type",
            subProducts: "Water Treatment Configuration",
            addons: "Select Add-ons",
            discount: "Approved Discount Amount",
            finalPrice: "Final Price",
            deposit: "Deposit Amount Payable Today",
            balance: "Balance Amount",
            totalAmount: "Total Amount",

            addonsAmount: "Add Ons Amount",
            tapsAmount: "Taps Amount",
            plumbingExtrasAmount: "Plumbing Extras Amount",
            otherExtrasAmount: "Other Extras Amount"
        },

        checkboxGroups: {
            taps: "Mixer Tap Required",
            plumbing: "Plumbing Extras Required",
            extras: "Additional Extras"
        }
    };

    /* ================= PRICES ================= */

    var productPrices = {

        "Full Home POE (Point of Entry) FHF-20": 4620,
        "Full Home POE (Point of Entry) FHF-10": 4220,
        "Full Home 4 Stage UV System FHF-UV-20": 4990,

        "(RO) Reverse Osmosis 5 stage FH-RO TANKLESS": 1590,
        "(UF) Ultra Filtration & Mineralised 5 Stage (Tankless & NON electric)": 979
    };

    var addonPrices = {

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

        "Customer supplied separate 2 way Mixer tap": 65,
        "Drill into stone": 120,
        "Line Tracing": 330,

        "ABI 3 way Mixer Tap - Brushed Gold & Matt Black": 884,
        "Powder Coating": 195
    };

    /* ================= CACHE ================= */

    var el = {};

    /* ================= HELPERS ================= */

    function findByLabel(label) {

        var labels = document.querySelectorAll(".field-label, label.label-alignment");

        for (var i = 0; i < labels.length; i++) {

            var txt = labels[i].textContent.trim();

            if (txt.indexOf(label) === 0) {

                var id = labels[i].getAttribute("for");

                if (id) return document.getElementById(id);

                var wrap = labels[i].closest(".form-builder--item");

                if (wrap) return wrap.querySelector("input, textarea");

            }
        }

        return null;
    }

    function findTags(label) {

        var input = findByLabel(label);

        if (!input) return null;

        var wrap = input.closest(".multiselect");

        if (!wrap) return null;

        return wrap.querySelector(".multiselect__tags");
    }

    function findCheckboxes(label) {

        var labels = document.querySelectorAll(".field-label, label.label-alignment");

        for (var i = 0; i < labels.length; i++) {

            if (labels[i].textContent.trim() === label) {

                var wrap = labels[i].closest(".form-builder--item");

                if (!wrap) return [];

                return wrap.querySelectorAll("input[type=checkbox]");
            }
        }

        return [];
    }

    function safeSet(input, val) {

        if (!input) return;

        input.value = Number(val).toFixed(2);

        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function sum(arr, map) {

        var t = 0;

        for (var i = 0; i < arr.length; i++) {
            t += map[arr[i]] || 0;
        }

        return t;
    }

    /* ================= MAP FIELDS ================= */

    function mapFields() {

        el.product = findTags(CONFIG.labels.product);
        el.sub = findTags(CONFIG.labels.subProducts);
        el.addons = findTags(CONFIG.labels.addons);

        el.taps = findCheckboxes(CONFIG.checkboxGroups.taps);
        el.plumbing = findCheckboxes(CONFIG.checkboxGroups.plumbing);
        el.extras = findCheckboxes(CONFIG.checkboxGroups.extras);

        el.discount = findByLabel(CONFIG.labels.discount);
        el.final = findByLabel(CONFIG.labels.finalPrice);
        el.deposit = findByLabel(CONFIG.labels.deposit);
        el.balance = findByLabel(CONFIG.labels.balance);
        el.total = findByLabel(CONFIG.labels.totalAmount);

        el.addonsTotal = findByLabel(CONFIG.labels.addonsAmount);
        el.tapsTotal = findByLabel(CONFIG.labels.tapsAmount);
        el.plumbTotal = findByLabel(CONFIG.labels.plumbingExtrasAmount);
        el.extraTotal = findByLabel(CONFIG.labels.otherExtrasAmount);

        var ro = [
            el.final,
            el.balance,
            el.total,
            el.addonsTotal,
            el.tapsTotal,
            el.plumbTotal,
            el.extraTotal
        ];

        for (var i = 0; i < ro.length; i++) {
            if (ro[i]) ro[i].readOnly = true;
        }
    }

    /* ================= GET VALUES ================= */

    function getSingle(tags) {

        if (!tags) return "";

        var s = tags.querySelector(".multiselect__single");

        return s ? s.textContent.trim() : "";
    }

    function getMulti(tags) {

        if (!tags) return [];

        var spans = tags.querySelectorAll(".multiselect__tag span:first-child");

        var arr = [];

        for (var i = 0; i < spans.length; i++) {
            arr.push(spans[i].textContent.trim());
        }

        return arr;
    }

    function getChecked(list) {

        var arr = [];

        for (var i = 0; i < list.length; i++) {

            if (list[i].checked) arr.push(list[i].value.trim());
        }

        return arr;
    }

    /* ================= SUMMARY UI ================= */

    function render(data) {

        var submit = document.querySelector(".form-builder--btn-submit");

        if (!submit) return;

        var box = document.getElementById("price-summary-container");

        if (!box) {

            box = document.createElement("div");

            box.id = "price-summary-container";

            submit.parentNode.insertBefore(box, submit);
        }

        var html = "";

        html += "<h3>📄 Price Summary</h3>";

        if (data.mainPrice > 0) {
            html += "<div><b>Main:</b> " +
                data.mainProduct +
                " — $" +
                data.mainPrice.toLocaleString() +
                "</div>";
        }

        function section(title, items) {

            if (!items.length) return "";

            var total = sum(items, addonPrices);

            var s = "<div class='price-section'>";

            s += "<div class='price-section-header'>" +
                title +
                " $" +
                total.toLocaleString() +
                "</div>";

            for (var i = 0; i < items.length; i++) {

                var p = addonPrices[items[i]] || 0;

                s += "<div class='price-row'>" +
                    "<span>• " + items[i] + "</span>" +
                    "<span>$" + p.toLocaleString() + "</span>" +
                    "</div>";
            }

            s += "</div>";

            return s;
        }

        html += section("Add-ons", data.addons);
        html += section("Taps", data.taps);
        html += section("Plumbing", data.plumbing);
        html += section("Extras", data.extras);

        html += "<hr>";

        html += "<div class='price-total-row'><span>Subtotal</span><span>$" +
            data.subtotal.toFixed(2) +
            "</span></div>";

        if (data.discount > 0) {

            html += "<div class='price-total-row price-discount'><span>Discount</span><span>-$" +
                data.discount.toFixed(2) +
                "</span></div>";
        }

        html += "<div class='price-final'><span>Final</span><span>$" +
            data.final.toFixed(2) +
            "</span></div>";

        if (data.deposit > 0) {

            html += "<div class='price-total-row'><span>Deposit</span><span>$" +
                data.deposit.toFixed(2) +
                "</span></div>";
        }

        if (data.balance > 0) {

            html += "<div class='price-balance'><span>Balance Due</span><span>$" +
                data.balance.toFixed(2) +
                "</span></div>";
        }

        box.innerHTML = html;
    }

    /* ================= CALC ================= */

    function calculate() {

        var main = getSingle(el.product);

        var subs = getMulti(el.sub);
        var addons = getMulti(el.addons);

        var taps = getChecked(el.taps);
        var plumbing = getChecked(el.plumbing);
        var extras = getChecked(el.extras);

        var mainPrice = productPrices[main] || 0;

        var subTotal = sum(subs, productPrices);
        var addonTotal = sum(addons, addonPrices);
        var tapsTotal = sum(taps, addonPrices);
        var plumbTotal = sum(plumbing, addonPrices);
        var extraTotal = sum(extras, addonPrices);

        var subtotal =
            mainPrice +
            subTotal +
            addonTotal +
            tapsTotal +
            plumbTotal +
            extraTotal;

        safeSet(el.total, subtotal);

        safeSet(el.addonsTotal, addonTotal);
        safeSet(el.tapsTotal, tapsTotal);
        safeSet(el.plumbTotal, plumbTotal);
        safeSet(el.extraTotal, extraTotal);

        var discount = Number(el.discount && el.discount.value) || 0;

        if (discount > subtotal) discount = subtotal;

        var after = subtotal - discount;

        var tax = after * TAX_RATE;

        var final = after + tax;

        safeSet(el.final, final);

        var deposit = Number(el.deposit && el.deposit.value) || 0;

        if (deposit > final) deposit = final;

        var balance = final - deposit;

        safeSet(el.balance, balance);

        render({
            mainProduct: main,
            mainPrice: mainPrice,

            addons: addons,
            taps: taps,
            plumbing: plumbing,
            extras: extras,

            subtotal: subtotal,
            discount: discount,
            final: final,
            deposit: deposit,
            balance: balance
        });
    }

    /* ================= WATCH ================= */

    function attach() {

        var obs = new MutationObserver(calculate);

        if (el.product) obs.observe(el.product, { childList: true, subtree: true });
        if (el.sub) obs.observe(el.sub, { childList: true, subtree: true });
        if (el.addons) obs.observe(el.addons, { childList: true, subtree: true });

        var list = []
            .concat(Array.from(el.taps || []))
            .concat(Array.from(el.plumbing || []))
            .concat(Array.from(el.extras || []));

        for (var i = 0; i < list.length; i++) {
            list[i].addEventListener("change", calculate);
        }

        if (el.discount)
            el.discount.addEventListener("input", calculate);

        if (el.deposit)
            el.deposit.addEventListener("input", calculate);

        calculate();
    }

    /* ================= INIT ================= */

    function init() {

        mapFields();

        attach();
    }

    var root = document.querySelector("#_builder-form") || document.body;

    new MutationObserver(init).observe(root, {
        childList: true,
        subtree: true
    });

    init();

    console.log("GHL Calculator Loaded");

})();
