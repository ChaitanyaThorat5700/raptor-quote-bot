import pool from "../config/db.js";

/**
 * Create lead and link to quote
 */
export async function createLeadFromQuote(data) {
  const { publicCode, name, phone, email, address } = data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Verify quote exists
    const quoteRes = await client.query(
      "SELECT id FROM quotes WHERE public_code = $1",
      [publicCode]
    );

    if (quoteRes.rows.length === 0) {
      throw new Error("QUOTE_NOT_FOUND");
    }

    const quoteId = quoteRes.rows[0].id;

    // 2️⃣ Insert lead
    const leadInsert = await client.query(
      `
      INSERT INTO leads (name, phone, email, address)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [name, phone, email || null, address || null]
    );

    const leadId = leadInsert.rows[0].id;

    // 3️⃣ Link lead to quote
    await client.query(
      "UPDATE quotes SET lead_id = $1 WHERE id = $2",
      [leadId, quoteId]
    );

    await client.query("COMMIT");

    return { leadId };

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}