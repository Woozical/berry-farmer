import { sqlForPartialUpdate } from "../../utils/sql";
import { BadRequestError } from "../../expressError";

describe("sqlForPartialUpdate", () => {
  const data = {firstName: "John", age:40, lastName: "Doe"};
  const definitions = {firstName: "first_name", lastName: "last_name"};

  it("works", () => {
    const result = sqlForPartialUpdate(data, definitions);
    expect(result.values).toEqual(["John", 40, "Doe"]);
    expect(result.setCols).toEqual('"first_name"=$1, "age"=$2, "last_name"=$3');
  });

  it("works with no definitions", () => {
    const result = sqlForPartialUpdate(data);
    expect(result.values).toEqual(["John", 40, "Doe"]);
    expect(result.setCols).toEqual('"firstName"=$1, "age"=$2, "lastName"=$3');
  });

  it("throws 400 BadRequestError if no data in object", () => {
    const s = () => {sqlForPartialUpdate({}, definitions)}
    expect(s).toThrow(BadRequestError);
  });
});