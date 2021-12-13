import jwt from "jsonwebtoken";
import { createToken } from "../../utils/token";
import { SECRET_KEY } from "../../config";

describe("createToken", function () {
  test("works: not admin", function () {
    const token = createToken({ username: "test", funds: 0 });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      funds: 0,
    });
  });
});