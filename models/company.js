"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
    );
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
       FROM companies
       WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity
       FROM jobs
       WHERE company_handle = $1
       ORDER BY id`,
      [handle]
    );

    company.jobs = jobsRes.rows;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }

  static async get(name) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE LOWER(name) = $1`,
      [name]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${name}`);

    return company;
  }

  static async get(name) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE LOWER(name) = $1`,
      [name]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${name}`);

    return company;
  }

  // Get an item By different filters
  static async filterBy(min, max, name) {
    let query = `
    SELECT 
      handle,
      name,
      description,
      num_employees AS "numEmployees",
      logo_url AS "logoUrl"
    FROM companies
    WHERE 1=1`;

    const values = [];
    // Error if min > max
    if (min !== undefined && max !== undefined && min > max) {
      // Error if min > max
      throw new BadRequestError("Minimum cannot be greater than maximum");
    }
    // Handle Min filter
    if (min !== undefined) {
      values.push(+min); // converts a number
      query += ` AND num_employees >= $${values.length} `; // becomes "AND num_employees >= $1"
    }
    // Handle Max filter
    if (max !== undefined) {
      values.push(+max); // converts a number
      query += ` AND num_employees <= $${values.length}`;
    }
    // Handle Name filter
    if (name !== undefined) {
      values.push(`${name}%`);
      query += ` AND name ILIKE $${values.length}`; // case-insensitive match
    }
    //Add ORDER by Clause
    if (name !== undefined) {
      query += `ORDER BY name`; // adds an ORDER BY name if there is a name
    } else {
      query += `ORDER BY num_employees`; // adds an ORDER BY num_employees
    }

    const companyRes = await db.query(query, values);

    const company = companyRes.rows;

    if (company.length === 0)
      throw new NotFoundError(`No company in that Filtered Range`);

    return company;
  }
}

module.exports = Company;
