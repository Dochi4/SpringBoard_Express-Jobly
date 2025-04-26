const { BadRequestError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

const dataToUpdate = {
  firstName: "Aliya",
  age: 32,
};

const jsToSql = {
  firstName: "first_name",
  lastName: "last_name",
};

describe("sqlForPartialUpdate", () => {
  test("works: No Data", () => {
    expect(() => sqlForPartialUpdate({}, jsToSql).toThrow(BadRequestError));
  });
});
test("works: Expected Output", () => {
  expect(() =>
    sqlForPartialUpdate(dataToUpdate, jsToSql).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    })
  );
});
