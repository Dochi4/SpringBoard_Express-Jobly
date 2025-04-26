const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */
describe("create", function () {
  const newJob = {
    title: "new",
    salary: 20000,
    equity: 0.2,
    company_handle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);

    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 20000,
      equity: "0.2",
      company_handle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE title = $1`,
      ["new"]
    );

    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "new",
        salary: 20000,
        equity: "0.2",
        company_handle: "c1",
      },
    ]);
  });
  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findALl*/

describe("finALL", function () {
  const newJob = {
    title: "new",
    salary: 20000,
    equity: 0.2,
    company_handle: "c1",
  };
  test("works: no filter", async function () {
    let job = await Job.create(newJob);
    const result = await Job.findAll();
    expect(result).toEqual([
      {
        id: expect.any(Number),
        title: "t1",
        salary: 12343,
        equity: "0.5",
        company_handle: "c1",
      },
      {
        id: expect.any(Number),
        title: "new",
        salary: 20000,
        equity: "0.2",
        company_handle: "c1",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const result = await Job.get("t1");
    expect(result).toEqual({
      id: expect.any(Number),
      title: "t1",
      salary: 12343,
      equity: "0.5",
      company_handle: "c1",
    });
  });
  test("job title not found", async function () {
    try {
      const result = await Job.get("nope");
      fail();
    } catch (e) {
      expect(e instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "t9",
    salary: 12343,
    equity: "0.5",
  };

  test("works", async function () {
    const job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      ...updateData,
      company_handle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE id = 1`
    );

    expect(result.rows).toEqual([
      {
        id: 1,
        title: "t9",
        salary: 12343,
        equity: "0.5",
        company_handle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "t9",
      salary: null,
      equity: null,
    };

    const job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      ...updateDataSetNulls,
      company_handle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE id = 1`
    );

    expect(result.rows).toEqual([
      {
        id: 1,
        title: "t9",
        salary: null,
        equity: null,
        company_handle: "c1",
      },
    ]);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.update(99999999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const result = await db.query(`SELECT id FROM jobs WHERE id = 1`);
    expect(result.rows.length).toEqual(0);
  });
  test("not found if no job", async function () {
    try {
      await Job.remove(999999999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** Filters */

describe("filterby", function () {
  test("filter job by name", async function () {
    const res = await Job.filterby("t1", undefined, undefined);
    expect(res.length).toBe(1);
  });
  test("filter by salary", async function () {
    const res = await Job.filterby(undefined, 12340, undefined);
    expect(res).toEqual([expect.objectContaining({ title: "t1" })]);
  });
  test("filter job by equity", async function () {
    const res = await Job.filterby(undefined, undefined, true);
    expect(res.length).toBe(1);
  });
  test("Error filter job by name", async function () {
    try {
      const res = await Job.filterby("t999", undefined, undefined);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  test("Error filter fail", async function () {
    try {
      const res = await Job.filterby(undefined, undefined, undefined);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
