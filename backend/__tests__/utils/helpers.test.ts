import { falsyNoZero, dateToHString, hStringToDate } from "../../utils/helpers";

describe("falsyNoZero", () => {
  it("returns true if value is falsy", () => {
    expect(falsyNoZero(null)).toEqual(true);
    expect(falsyNoZero(undefined)).toEqual(true);
    expect(falsyNoZero('')).toEqual(true);
  });
  it("returns false if 0", () => {
    expect(falsyNoZero(0)).toEqual(false);
    expect(falsyNoZero(0.0)).toEqual(false);
  })
  it("returns false if truthy", () => {
    expect(falsyNoZero('0')).toEqual(false);
    expect(falsyNoZero(1)).toEqual(false);
    expect(falsyNoZero(-1)).toEqual(false);
    expect(falsyNoZero('hello world')).toEqual(false);
  })
});

describe("dateToHString", () => {
  it("works", () => {
    expect(dateToHString(new Date("Dec 20 2020"))).toEqual("2020-12-20");
    expect(dateToHString(new Date("Aug 06 2005"))).toEqual("2005-08-06");
    expect(dateToHString(new Date("Feb 11 1999"))).toEqual("1999-02-11");
    expect(dateToHString(new Date("Sep 02 2021"))).toEqual("2021-09-02");
  });
});

describe("hStringToDate", () => {
  it("works", () => {
    const d = new Date("Dec 20 2020");
    expect(hStringToDate("2020-12-20").getTime()).toEqual(d.getTime());
  });
  it("works with leading zeroes", () => {
    const d = new Date("Jan 01 2021");
    expect(hStringToDate("2021-01-01").getTime()).toEqual(d.getTime());
  });
})