const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// Get all industries, which should show the company code(s) for that industry
router.get("/", async (req, res, next) => {
	try {
		const results = await db.query(
			`
            SELECT ind.code AS ind_code, ind.industry, comp.code AS comp_code 
            FROM industries AS ind
            LEFT JOIN company_industries AS comp_ind 
            ON ind.code = comp_ind.ind_code
            LEFT JOIN companies AS comp 
            ON comp_ind.comp_code = comp.code
            `
		);

		const industriesMap = {};

		results.rows.forEach((row) => {
			const { ind_code, industry, comp_code } = row;
			if (!industriesMap[ind_code]) {
				industriesMap[ind_code] = {
					code: ind_code,
					industry: industry,
					companies: [],
				};
			}
			if (comp_code) {
				industriesMap[ind_code].companies.push(comp_code);
			}
		});

		const industries = Object.values(industriesMap);

		return res.json({ industries });
	} catch (e) {
		return next(e);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const { code, industry } = req.body;
		const results = await db.query(`INSERT INTO industries (code, industry) VALUES ($1,$2) RETURNING code, industry`, [code, industry]);

		return res.status(201).json({ industry: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
