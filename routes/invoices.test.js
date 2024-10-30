process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async () => {
	const companyResults = await db.query(`INSERT INTO companies (code, name, description) VALUES ('testComp','Test Company','Company for Testing') RETURNING *`);
	const invoiceResults = await db.query(`INSERT INTO invoices (comp_code,amt) VALUES ('testComp', 200) RETURNING *`);

	testCompany = companyResults.rows[0];
	testInvoice = invoiceResults.rows[0];
});

afterEach(async () => {
	await db.query(`DELETE FROM invoices`);
	await db.query(`DELETE FROM companies`);
});

afterAll(async () => {
	await db.end();
});

describe("GET /invoices", () => {
	test("Get a list of all invoices", async () => {
		const res = await request(app).get("/invoices");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ invoices: [{ ...testInvoice, add_date: new Date(testInvoice.add_date).toISOString() }] });
	});
});

describe("GET /invoices/:id", () => {
	test("Get a single invoice", async () => {
		const res = await request(app).get(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toBe(200);
		const { comp_code, ...invoice } = testInvoice;
		expect(res.body).toEqual({ invoice: { ...invoice, add_date: new Date(testInvoice.add_date).toISOString(), company: testCompany } });
	});
	test("Responds with 404 for invalid id", async () => {
		const res = await request(app).get(`/invoices/0`);
		expect(res.statusCode).toBe(404);
	});
});

describe("POST /invoices/", () => {
	test("Create a invoice", async () => {
		const res = await request(app).post(`/invoices/`).send({ comp_code: testCompany.code, amt: 699 });
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			invoice: { id: expect.any(Number), comp_code: testCompany.code, amt: 699, paid: false, add_date: expect.any(String), paid_date: null },
		});
	});
});

describe("PUT /invoices/:id", () => {
	test("Test update of an invoice", async () => {
		const res = await request(app).put(`/invoices/${testInvoice.id}`).send({ amt: 500, paid: true });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice: { id: expect.any(Number), comp_code: testCompany.code, amt: 500, paid: true, add_date: expect.any(String), paid_date: expect.any(String) },
		});
	});
});

describe("DELETE /invoices/:id", () => {
	test("Delete an invoice", async () => {
		const res = await request(app).delete(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ status: "deleted" });
	});
	test("Delete an invoice that does not exist", async () => {
		const res = await request(app).delete(`/invoices/0`);
		expect(res.statusCode).toBe(404);
	});
});
