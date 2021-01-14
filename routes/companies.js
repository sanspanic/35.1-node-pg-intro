const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM companies`);
    return res.json({ companies: results.rows });
  } catch (e) {
    return next(e);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const company = await db.query(`SELECT * FROM companies WHERE code=$1`, [
      code,
    ]);
    if (company.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    //add invoices

    const invoices = await db.query(
      `SELECT * FROM invoices WHERE comp_code=$1`,
      [code]
    );

    company.rows[0].invoices = invoices.rows;

    //add industries

    const industries = await db.query(
      `SELECT industries.name 
      FROM industries_companies 
      LEFT JOIN industries 
      ON industries.id = industries_companies.id 
      WHERE code=$1`,
      [code]
    );

    const indArr = [];
    industries.rows.map((ind) => indArr.push(ind.name));

    company.rows[0].industries = indArr;

    return res.json({ company: company.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [code, name, description]
    );
    return res.status(201).json({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.put("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const results = await db.query(
      "UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description",
      [name, description, code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }
    return res.send({ company: results.rows[0] });
  } catch (e) {
    return next(e);
  }
});

router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      `DELETE FROM companies WHERE code=$1 RETURNING *`,
      [code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(
        `Can't find and delete company with code of ${code}`,
        404
      );
    }
    return res.send({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
