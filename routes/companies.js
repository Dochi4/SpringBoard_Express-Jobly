"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, isAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    let { min, max, name } = req.query;
    // Insures that min and max are Numbers
    if ((min && isNaN(min)) || (max && isNaN(max))) {
      throw new BadRequestError("Input must be a Number");
    }
    let companies;

    // If any is provided, add it to the query
    if (min || max || name) {
      companies = await Company.filterBy(min, max, name);
    } else {
      companies = await Company.findAll(); // gets all if not filters
    }

    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login
 */

router.patch(
  "/:handle",
  ensureLoggedIn,
  isAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, companyUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const company = await Company.update(req.params.handle, req.body);
      return res.json({ company });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete(
  "/:handle",
  ensureLoggedIn,
  isAdmin,
  async function (req, res, next) {
    try {
      await Company.remove(req.params.handle);
      return res.json({ deleted: req.params.handle });
    } catch (err) {
      return next(err);
    }
  }
);

router.get("/:name", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.name);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
