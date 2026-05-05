class ApiError extends Error {
  constructor(statusCode, message, code = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }

  if (err.name === 'GitHubApiError') {
    return res.status(err.statusCode || 502).json({
      error: err.message || 'GitHub API request failed'
    });
  }

  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

const errorResponse = (res, err) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  res.status(statusCode).json({ error: message });
};

module.exports = { ApiError, errorHandler, errorResponse };
