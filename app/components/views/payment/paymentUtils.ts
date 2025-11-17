// components/Payment/paymentUtils.ts

export const onlyDigits = (v = '') => v.replace(/\D/g, '');

export const formatCardNumber = (v = '') =>
    onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ').trim();

export const detectBrand = (num = '') => {
    const n = onlyDigits(num);
    if (/^4\d{0,}$/.test(n)) return 'visa';
    if (/^(5[1-5]\d{0,}|2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)\d{0,})$/.test(n))
        return 'mastercard';
    return 'generic';
};

export const formatExpiry = (v = '') => {
    const d = onlyDigits(v).slice(0, 4);
    if (d.length <= 2) return d;
    return d.slice(0, 2) + '/' + d.slice(2);
};

export const isValidLuhn = (num: string) => {
    const arr = onlyDigits(num)
        .split('')
        .reverse()
        .map((n) => parseInt(n, 10));

    if (arr.length < 12) return false;

    const sum = arr.reduce((acc, n, i) => {
        if (i % 2 === 1) {
            let dbl = n * 2;
            if (dbl > 9) dbl -= 9;
            return acc + dbl;
        }
        return acc + n;
    }, 0);

    return sum % 10 === 0;
};
