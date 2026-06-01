import { NextRequest, NextResponse } from "next/server";
import { ensureUsersTable, getDb } from "@/lib/db";
import type { UserRole } from "@/lib/data-model";

const SEED_KEY = process.env.SEED_KEY ?? "jr-seed-2026";

type SeedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

const SEED_USERS: SeedUser[] = [
  { id: "usr_admin_01",    name: "System Admin", email: "admin@jamesroman.la",   role: "admin"   },
  { id: "usr_adv_stephen", name: "Stephen",      email: "stephen@jamesroman.la", role: "advisor" },
  { id: "usr_adv_roman",   name: "Roman",        email: "roman@jamesroman.la",   role: "advisor" },
  { id: "usr_client_demo", name: "Demo Client",  email: "demo@client.test",      role: "client"  },
];

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (key !== SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureUsersTable();
    const sql = getDb();

    const users = await Promise.all(
      SEED_USERS.map((u) =>
        sql`
          INSERT INTO users (id, name, email, role)
          VALUES (${u.id}, ${u.name}, ${u.email}, ${u.role})
          ON CONFLICT (id) DO UPDATE
            SET name  = EXCLUDED.name,
                email = EXCLUDED.email,
                role  = EXCLUDED.role
          RETURNING id, name, email, role, created_at
        `.then((rows) => rows[0])
      )
    );

    return NextResponse.json({ ok: true, seeded: users.length, users }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
