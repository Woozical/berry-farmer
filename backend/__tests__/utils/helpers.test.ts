import { falsyNoZero, dateToHString } from "../../utils/helpers";

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
    expect(dateToHString(new Date("Aug 06 2005"))).toEqual("2005-8-6");
    expect(dateToHString(new Date("Feb 11 1999"))).toEqual("1999-2-11");
  });
});