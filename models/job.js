const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { update } = require("./company");

// Related functions for jobs

class Job {
  /* Create a job ( from data ), update db, return new job data

data should be {title,salary,equity,company_handle}

Returns {id,title,salaray,equity,company_handle}

Throw BadRequest Error if company already in database 
*/

  static async create({ title, salary, equity, company_handle }) {
    // Trim and normalize inputs (e.g., lowercase)
    title = title.trim().toLowerCase();
    company_handle = company_handle.trim().toLowerCase();

    const duplicateCheck = await db.query(
      `SELECT title, company_handle
     FROM jobs
     WHERE title = $1 AND company_handle = $2`,
      [title, company_handle]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(
        `Duplicate Job: ${title} from ${company_handle}`
      );
    }

    const result = await db.query(
      `INSERT INTO jobs
     (title, salary, equity, company_handle)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];
    return job;
  }

  /** Find all Jobs.
   *
   * Returns {id,title,salaray,equity,company_handle}
   * */
  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle
              FROM jobs
              ORDER BY id`
    );
    return jobsRes.rows;
  }

  /** Given a job title, return data about job.
   *
   * Returns jobs is [{ id, title, salary, equity, companyHandle }]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(title) {
    const jobsRes = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE title = $1`,
      [title]
    );

    const job = jobsRes.rows[0];
    if (!job) throw new NotFoundError(`No job: ${title}`);
    return job;
  }
  /** Update job data with `data`.
   *
   * This is a partrial update its fine if the data dosen't contain all the fuields only the ones intened for change
   *
   * Data can include : { title, salary, equity}
   *
   * Return : { id, title, salary, equity, companyHandle }
   *
   * Throws NotFound Error if not found
   */
  static async update(id, data) {
    if (Object.keys(data).length === 0) {
      throw new BadRequestError("No data provided");
    }
    const { setCols, values } = sqlForPartialUpdate(data, {
      title: "title",
      salary: "salary",
      equity: "equity",
    });

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
    UPDATE jobs
    SET ${setCols}
    WHERE id = ${idVarIdx}
    RETURNING id, title, salary, equity, company_handle
  `;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with the id: ${id}`);

    return job;
  }
  /** Delete given Job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/
  static async remove(id) {
    const result = await db.query(
      `DELETE
       FROM jobs
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with the id: ${id}`);
  }

  // Get an item By different filters

  static async filterby(title, minSalary, hasEquity) {
    let query = `
    SELECT 
      id,
      title, 
      salary, 
      equity, 
      company_handle
    FROM jobs
    WHERE 1=1`;

    const values = [];

    // Handle Title filter
    if (title !== undefined) {
      values.push(`%${title}%`);
      query += ` AND title ILIKE $${values.length}`;
    }

    // Handle minSalary filter
    if (minSalary !== undefined) {
      values.push(+minSalary);
      query += ` AND salary >= $${values.length}`;
    }

    // Handle hasEquity filter
    if (hasEquity === true) {
      query += ` AND equity::float > 0`;
    }
    // throw error if all paramaters is undefined
    if (
      title === undefined &&
      minSalary === undefined &&
      hasEquity === undefined
    ) {
      throw new NotFoundError(`No filters provided`);
    }

    const res = await db.query(query, values);
    const job = res.rows;

    if (job.length === 0)
      throw new NotFoundError(`No company in that Filtered Range`);
    return job;
  }
}
module.exports = Job;
