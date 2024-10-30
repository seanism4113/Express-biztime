/** BizTime express application. */

const express = require("express");
const ExpressError = require("./expressError");
const app = express();

app.use(express.json());

const companyRoutes = require("./routes/companies");
app.use("/companies", companyRoutes);

const invoiceRoutes = require("./routes/invoices");
app.use("/invoices", invoiceRoutes);

const industriesRoutes = require("./routes/industries");
app.use("/industries", industriesRoutes);

// Middleware 404 handler
app.use((req, res, next) => {
	return next(new ExpressError("Not found", 404));
});

// Middleware error handler
app.use((err, req, res, next) => {
	return res.status(err.status || 500).json({
		error: {
			message: err.message,
			status: err.status || 500,
		},
	});
});

module.exports = app;
