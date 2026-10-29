// node --experimental-strip-types src/lib/phone.check.mjs
import assert from "node:assert/strict";
import { PHONE_COUNTRIES, isValidPhone, parsePhone, toPhoneValue, groupPhone } from "./phone.ts";

const by = (iso) => PHONE_COUNTRIES.find((c) => c.iso === iso);

// Colombia por defecto y datos viejos sin "+"
assert.deepEqual(parsePhone("3001234567"), { country: by("CO"), national: "3001234567" });
assert.equal(parsePhone("+57 300 123 4567").national, "3001234567");
assert.equal(parsePhone("573001234567").national, "3001234567");
assert.equal(toPhoneValue(by("CO"), "300 123 4567"), "+573001234567");
assert.equal(toPhoneValue(by("CO"), ""), "");

// Indicativo más largo gana (+593 Ecuador, no +59…) y +1 respeta la preferencia
assert.equal(parsePhone("+593991234567").country.iso, "EC");
assert.equal(parsePhone("+34612345678").country.iso, "ES");
assert.equal(parsePhone("+12125551234").country.iso, "US");
assert.equal(parsePhone("+17875551234", by("PR")).country.iso, "PR");

// Largo por país
assert.ok(isValidPhone("+573001234567"));
assert.ok(!isValidPhone("+57300123456"));
assert.ok(isValidPhone("+34612345678"));
assert.ok(!isValidPhone("+3461234567"));
assert.ok(isValidPhone("+5491123456789")); // Argentina, 11
assert.ok(!isValidPhone(""));
assert.equal(toPhoneValue(by("ES"), "6123456789999"), "+34612345678"); // recorta al máximo

assert.equal(groupPhone("3001234567"), "300 123 4567");
assert.equal(groupPhone("612345678"), "612 345 678");
console.log("phone check ok");
