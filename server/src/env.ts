// Loads environment variables from .env into process.env. Imported first,
// before any other file, so JWT_SECRET/PORT are available everywhere.

import dotenv from "dotenv";

dotenv.config();
