// utils/currency.js
export const formatPrice = (price) => {
  return `PKR ${Math.round(price).toLocaleString("en-PK")}`;
};
