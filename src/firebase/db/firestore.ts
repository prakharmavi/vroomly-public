// Re-export the db instance from the main firebase config
// This prevents duplicate Firebase initialization
import { db } from "../firebase";

export default db;