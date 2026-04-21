/**
 *  @class
 *  @function ShippingEstimator
 */
if (!customElements.get('shipping-estimator')) {
  class ShippingEstimator extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.setupCountries();
      this.submitButton = this.querySelector('[type="button"]');
      this.submitButton.addEventListener('click', this.estimateShipping.bind(this));
      this.results = this.querySelector('.shipping-estimator--results');
    }
    async estimateShipping() {
      const zip = this.querySelector('.shipping-estimator-zip').value,
        country = this.querySelector('.shipping-estimator-country').value,
        province = this.querySelector('.shipping-estimator-province').value;

      this.submitButton.classList.add('loading');
      const response = await fetch(
        `${window.theme.routes.cart_url}/prepare_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`,
        {
          method: 'POST'
        }
      );
      if (response.ok) {
        const shippingRates = await this.getShippingRates(zip, country, province);
        this.formatShippingRates(shippingRates);
      } else {
        const jsonError = await response.json();
        this.formatError(jsonError);
      }
      this.submitButton.classList.remove('loading');
    }
    async getShippingRates(zip, country, province) {
      const response = await fetch(
        `${window.theme.routes.cart_url}/async_shipping_rates.json?shipping_address[zip]=${zip}&shipping_address[country]=${country}&shipping_address[province]=${province}`
      );
      const responseText = await response.text();
      if (responseText === 'null') {
        return this.getShippingRates(zip, country, province);
      } else {
        return JSON.parse(responseText).shipping_rates;
      }
    }
    formatShippingRates(shippingRates) {
      const format = window.theme.settings.money_with_currency_format || "${{amount}}";
      let answer;
      if (shippingRates.length === 0) {
        answer = window.theme.strings.shippingEstimatorNoResults;
      } else if (shippingRates.length === 1) {
        answer = window.theme.strings.shippingEstimatorOneResult;
      } else {
        answer = window.theme.strings.shippingEstimatorMultipleResults;
      }
      this.results.textContent = '';
      const p = document.createElement('p');
      p.textContent = answer;
      this.results.appendChild(p);
      if (shippingRates.length > 0) {
        const ul = document.createElement('ul');
        shippingRates.forEach((shippingRate) => {
          const li = document.createElement('li');
          li.textContent = `${shippingRate.presentment_name}: ${formatMoney(parseFloat(shippingRate.price) * 100, format)}`;
          ul.appendChild(li);
        });
        this.results.appendChild(ul);
      }
    }
    formatError(errors) {
      this.results.textContent = '';
      const p = document.createElement('p');
      p.textContent = window.theme.strings.shippingEstimatorError;
      this.results.appendChild(p);
      const ul = document.createElement('ul');
      Object.keys(errors).forEach((errorKey) => {
        const li = document.createElement('li');
        li.textContent = `${errorKey} ${errors[errorKey]}`;
        ul.appendChild(li);
      });
      this.results.appendChild(ul);
    }
    setupCountries() {

      if (Shopify && Shopify.CountryProvinceSelector) {
        let formId = this.dataset.formId;
        new Shopify.CountryProvinceSelector(`shipping-estimator-country-${formId}`, `shipping-estimator-province-${formId}`, {
          hideElement: `shipping-estimator-province-wrapper-${formId}`
        });
      }
    }
  }
  customElements.define('shipping-estimator', ShippingEstimator);
}
