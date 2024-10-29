// Routes for companies in biztime

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// Get all companies and fields from the companies table in the database.
// Returns list of companies, like {companies: [{code, name}, ...]}
router.get("/", async (req, res, next) => {
	try {
		const results = await db.query(`SELECT code,name,description FROM companies`);
		return res.json({ companies: results.rows });
	} catch (e) {
		return next(e);
	}
});

// Get one company and fields from the companies table in the database
// Return obj of company: {company: {code, name, description}}
router.get("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const companyResults = await db.query(`SELECT code,name,description FROM companies WHERE code=$1`, [code]);
		if (companyResults.rows.length === 0) {
			throw new ExpressError(`Could not find company with code ${code} `, 404);
		}
		const invoiceResults = await db.query(`SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE comp_code=$1`, [code]);

		return res.json({ company: { ...companyResults.rows[0], invoices: invoiceResults.rows } });
	} catch (e) {
		return next(e);
	}
});

// Add a new company to the database
// Adds a company. Needs to be given JSON like: {code, name, description} Returns obj of new company:  {company: {code, name, description}}
router.post("/", async (req, res, next) => {
	try {
		const { code, name, description } = req.body;
		const results = await db.query(`INSERT INTO companies (code,name,description) VALUES ($1,$2,$3) RETURNING code,name,description`, [code, name, description]);
		return res.status(201).json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// Edit exisiting company in the database
// Needs to be given JSON like: {name, description} Returns update company object: {company: {code, name, description}}
router.put("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const { name, description } = req.body;
		const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code,name,description`, [name, description, code]);
		if (results.rows.length === 0) {
			throw new ExpressError(`Company code ${code} could not be found`, 404);
		}
		return res.json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

// Deletes a company from the database. Returns {status: "deleted"}
router.delete("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING code`, [code]);
		if (results.rows.length === 0) {
			throw new ExpressError(`Company code ${code} could not be found`, 404);
		}
		return res.json({ status: "deleted" });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
