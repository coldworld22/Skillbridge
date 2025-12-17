const ORIGINAL_INTL = global.Intl;

describe("currency utils fallbacks", () => {
  let warnSpy;

  afterEach(() => {
    if (warnSpy) {
      warnSpy.mockRestore();
      warnSpy = undefined;
    }
    global.Intl = ORIGINAL_INTL;
    jest.resetModules();
  });

  test("formatCurrency uses manual formatter when Intl is missing", () => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    global.Intl = undefined;
    jest.resetModules();

    const { formatCurrency } = require("../../utils/currency");

    expect(formatCurrency(42, { currency: "eur" })).toBe("EUR 42.00");
    expect(warnSpy).toHaveBeenCalled();
  });

  test("invalid currency falls back without throwing", () => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const numberFormatMock = jest.fn().mockImplementation((locale, options) => {
      if (options?.currency !== "USD") {
        throw new RangeError("Invalid currency code");
      }
      return {
        format: (value) => `$${Number(value).toFixed(2)}`,
      };
    });
    global.Intl = { NumberFormat: numberFormatMock };
    jest.resetModules();

    const { formatCurrency, getCurrencyFormatter } = require("../../utils/currency");

    expect(formatCurrency(12.34, { currency: "bad", locale: "xx-YY" })).toBe("$12.34");
    const formatter = getCurrencyFormatter({ currency: "bad", locale: "xx-YY" });
    expect(formatter.format(9.5)).toBe("$9.50");
    expect(numberFormatMock).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });
});
