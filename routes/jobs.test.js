"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */
describe("POST/jobs", function () {
  const newJob = {
    title: "new21",
    salary: 20000,
    equity: 0.2,
    company_handle: "c2",
  };

  test("POST works", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new21",
        salary: 20000,
        equity: "0.2",
        company_handle: "c2",
      },
    });
  });

  test("Not an admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 10,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "not-a-salary",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */
describe("GET/jobs", function () {
  test("GET works", async function () {
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      jobs: [
        {
          id: 1,
          title: "new",
          salary: 20000,
          equity: "0.2",
          company_handle: "c1",
        },
        {
          id: 2,
          title: "new2",
          salary: 2,
          equity: "0",
          company_handle: "c2",
        },
        {
          id: 3,
          title: "new3",
          salary: 500,
          equity: "1",
          company_handle: "c1",
        },
      ],
    });
  });
});

/************************************** GET /jobs/:title */

describe("GET /jobs/:title", function () {
  test("GET job title works ", async function () {
    const resp = await request(app).get(`/jobs/new`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "new",
        salary: 20000,
        equity: "0.2",
        company_handle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */
describe("PATCH /jobs/:id", function () {
  test("PATCH job works", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "newUpdate",
        salary: 20,
        equity: 0.31,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: 1,
        title: "newUpdate",
        salary: 20,
        equity: "0.31",
        company_handle: "c1",
      },
    });
  });

  test("Not an admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "Failed",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).patch(`/jobs/1`).send({
      title: "t4",
    });
    expect(resp.statusCode).toEqual(401);
  });
  test("not found on no such Job", async function () {
    const resp = await request(app)
      .patch(`/jobs/9999999`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid field", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        fakeField: "not-valid",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data type", async function () {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        salary: "not-a-number",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("DELETE jobs works", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "1" });
  });

  test("Not an admin", async function () {
    const resp = await request(app)
      .delete(`/jobs/1`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such jobs", async function () {
    const resp = await request(app)
      .delete(`/jobs/999999`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
