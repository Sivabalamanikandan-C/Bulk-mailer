import cors from "cors";

const DEFAULT_ALLOWED_ORIGINS = [
  "https://bulkmailerfrontend.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
];

const normalizeOrigin = (origin) =>
  String(origin ?? "")
    .trim()
    .replace(/\/+$/, "");

const expandOrigin = (origin) => {
  const normalized = normalizeOrigin(origin);

  if (!normalized) {
    return [];
  }

  if (/^https?:\/\//i.test(normalized)) {
    return [normalized];
  }

  return [`https://${normalized}`, `http://${normalized}`];
};

const getConfiguredOrigins = () =>
  [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS,
    process.env.CORS_ALLOWED_ORIGINS,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .flatMap(expandOrigin);

const getAllowedOrigins = () =>
  new Set(
    [...DEFAULT_ALLOWED_ORIGINS, ...getConfiguredOrigins()]
      .map(normalizeOrigin)
      .filter(Boolean)
  );

export default function createCorsMiddleware() {
  const allowedOrigins = getAllowedOrigins();

  return cors({
    origin(origin, callback) {
      const normalizedOrigin = normalizeOrigin(origin);

      if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24 hours
  });
}
