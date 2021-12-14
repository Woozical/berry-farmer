import { falsyNoZero } from "../../utils/helpers";

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