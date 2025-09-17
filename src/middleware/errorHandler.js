const ERROR_MAPPINGS = Object.freeze({
  ValidationError: {
    status: 400,
    code: "VALIDATION_ERROR",
    message: "Validation error",
  },
  TimeoutError: {
    status: 408,
    code: "TIMEOUT_ERROR",
    message: "The request took too long to complete",
  },
});

const getErrorResponse = (err) => {
  const mapping = ERROR_MAPPINGS[err.name];
  if (mapping) {
    return {
      statusCode: mapping.status,
      error: mapping.message,
      message: err.message,
      code: mapping.code,
    };
  }

  if (err.message?.includes("Browser")) {
    return {
      statusCode: 503,
      error: "Browser service unavailable",
      message: "Screenshot service is temporarily unavailable",
      code: "BROWSER_ERROR",
    };
  }

  if (err.message?.includes("Invalid URL")) {
    return {
      statusCode: 400,
      error: "Invalid URL",
      message: err.message,
      code: "INVALID_URL",
    };
  }

  return {
    statusCode: 500,
    error: "Internal server error",
    message: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
  };
};

const errorHandler = (err, req, res, next) => {
  console.error("Error occurred:", err);

  const { statusCode, ...errorData } = getErrorResponse(err);

  const errorResponse = {
    success: false,
    ...errorData,
  };

  if (req.id) errorResponse.requestId = req.id;
  if (process.env.NODE_ENV !== "production") errorResponse.stack = err.stack;

  res.status(statusCode).json(errorResponse);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
    code: "NOT_FOUND",
  });
};

const timeoutHandler =
  (timeout = 60000) =>
  (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: "Request timeout",
          message: `Request exceeded ${timeout}ms timeout`,
          code: "REQUEST_TIMEOUT",
        });
      }
    }, timeout);

    res.on("finish", () => clearTimeout(timer));
    next();
  };

const requestId = (req, res, next) => {
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader("X-Request-ID", req.id);
  next();
};

const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;

  console.log(`[${req.id}] ${method} ${url} - ${ip || "unknown"}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${req.id}] ${method} ${url} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

module.exports = Object.freeze({
  errorHandler,
  notFoundHandler,
  timeoutHandler,
  requestId,
  requestLogger,
});
