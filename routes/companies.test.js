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
	const invoiceResults = await db.query(`INSERT INTO invoices (comp_code,amt) VALUES ('testComp', 200) RETURNING *`);
	const industryResults = await db.query(`INSERT INTO industries (code, industry) VALUES ('testInd','Test Industry') RETURNING *`);
	const companyIndustryResult = await db.query(`INSERT INTO company_industries (comp_code, ind_code) VALUES ('testComp','testInd') RETURNING *`);

	testCompany = companyResults.rows[0];
	testInvoice = invoiceResults.rows[0];
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

describe("GET /companies", () => {
	test("Get a list of all companies", async () => {
		const res = await request(app).get("/companies");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ companies: [testCompany] });
	});
});

describe("GET /companies/:code", () => {
	test("Get a single company", async () => {
		const res = await request(app).get(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);

		const expectedCompany = {
			code: testCompany.code,
			name: testCompany.name,
			description: testCompany.description,
			industries: [testIndustry.industry],
			invoices: expect.any(Array),
		};

		expect(res.body).toEqual({ company: expectedCompany });
	});
	test("Responds with 404 for invalid id", async () => {
		const res = await request(app).get(`/companies/incorrect`);
		expect(res.statusCode).toBe(404);
	});
});

describe("POST /companies/", () => {
	test("Create a company", async () => {
		const res = await request(app).post(`/companies/`).send({ name: "New Comp LLc:", description: "Test Description" });
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			company: { code: "newcompllc", name: "New Comp LLc:", description: "Test Description" },
		});
	});
});

describe("PUT /companies/:code", () => {
	test("Test update of a company", async () => {
		const res = await request(app).put(`/companies/${testCompany.code}`).send({ name: "Updated Corp.", description: "Updated!" });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			company: { code: testCompany.code, name: "Updated Corp.", description: "Updated!" },
		});
	});
});

describe("DELETE /companies/:code", () => {
	test("Delete a company", async () => {
		const res = await request(app).delete(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ status: "deleted" });
	});
	test("Delete a company that does not exist", async () => {
		const res = await request(app).delete(`/companies/incorrect`);
		expect(res.statusCode).toBe(404);
	});
});

describe("POST /companies/:code/industries", () => {
	test("Associate an industry with a company", async () => {
		await db.query(`INSERT INTO industries (code,industry) VALUES ('fin', 'finance') RETURNING *`);
		const res = await request(app).post(`/companies/${testCompany.code}/industries`).send({ ind_code: "fin" });
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({ comp_code: testCompany.code, ind_code: "fin" });
	});
});
