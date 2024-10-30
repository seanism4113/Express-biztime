process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;
let testIndustry;
let testCompanyIndustry;

beforeEach(async () => {
	const companyResults = await db.query(`INSERT INTO companies (code, name, description) VALUES ('testComp','Test Company','Company for Testing') RETURNING *`);
	const industryResults = await db.query(`INSERT INTO industries (code, industry) VALUES ('testInd','Test Industry') RETURNING *`);
	const companyIndustryResult = await db.query(`INSERT INTO company_industries (comp_code, ind_code) VALUES ('testComp','testInd') RETURNING *`);

	testCompany = companyResults.rows[0];
	testIndustry = industryResults.rows[0];
	testCompanyIndustry = companyIndustryResult.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM company_industries`);
	await db.query(`DELETE FROM invoices`);
	await db.query(`DELETE FROM industries`);
	await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
	await db.end();
});

describe("GET /industries", () => {
	test("Get a list of all industries with associated company codes", async () => {
		const res = await request(app).get("/industries");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ industries: [{ ...testIndustry, companies: [testCompany.code] }] });
	});
});

describe("POST /industries/", () => {
	test("Create a industry", async () => {
		const res = await request(app).post(`/industries/`).send({ code: "stl", industry: "Steel Mining" });
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			industry: { code: "stl", industry: "Steel Mining" },
		});
	});
});
