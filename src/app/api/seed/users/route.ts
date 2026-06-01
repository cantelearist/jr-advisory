/* ── POST /api/seed/users — Seed 100 test users across 4 roles ── */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SEED_KEY = 'jr-seed-2026';
const DEFAULT_PASSWORD = 'JR-test-2026!';

type Role = 'admin' | 'manager' | 'contractor' | 'client';

interface SeedUser {
  email: string;
  full_name: string;
  role: Role;
  phone?: string;
}

/* ── Generate 100 realistic users ── */
function generateUsers(): SeedUser[] {
  const users: SeedUser[] = [];

  // 3 Admins (firm principals)
  const admins: Omit<SeedUser, 'role'>[] = [
    { email: 'roman@jamesroman.la', full_name: 'James Roman', phone: '(310) 555-0100' },
    { email: 'stephen@jamesroman.la', full_name: 'Stephen Roman', phone: '(310) 555-0101' },
    { email: 'victoria.chase@jamesroman.la', full_name: 'Victoria Chase', phone: '(310) 555-0102' },
  ];
  admins.forEach(u => users.push({ ...u, role: 'admin' }));

  // 8 Managers (project managers, senior staff)
  const managers: Omit<SeedUser, 'role'>[] = [
    { email: 'daniel.reeves@jamesroman.la', full_name: 'Daniel Reeves', phone: '(310) 555-0201' },
    { email: 'maria.santos@jamesroman.la', full_name: 'Maria Santos', phone: '(310) 555-0202' },
    { email: 'nathan.cole@jamesroman.la', full_name: 'Nathan Cole', phone: '(310) 555-0203' },
    { email: 'angela.park@jamesroman.la', full_name: 'Angela Park', phone: '(310) 555-0204' },
    { email: 'thomas.whitaker@jamesroman.la', full_name: 'Thomas Whitaker', phone: '(310) 555-0205' },
    { email: 'rachel.kim@jamesroman.la', full_name: 'Rachel Kim', phone: '(310) 555-0206' },
    { email: 'carlos.mendez@jamesroman.la', full_name: 'Carlos Mendez', phone: '(310) 555-0207' },
    { email: 'sarah.blackwell@jamesroman.la', full_name: 'Sarah Blackwell', phone: '(310) 555-0208' },
  ];
  managers.forEach(u => users.push({ ...u, role: 'manager' }));

  // 25 Contractors (remediation, environmental, lab techs)
  const contractors: Omit<SeedUser, 'role'>[] = [
    { email: 'j.morrison@pacificremediation.com', full_name: 'Jake Morrison' },
    { email: 'l.chen@pacificremediation.com', full_name: 'Linda Chen' },
    { email: 'r.davis@envirotest.com', full_name: 'Robert Davis' },
    { email: 'm.johnson@envirotest.com', full_name: 'Monica Johnson' },
    { email: 'k.thompson@abatepro.net', full_name: 'Kevin Thompson' },
    { email: 's.garcia@abatepro.net', full_name: 'Sandra Garcia' },
    { email: 'd.wilson@cleanairlabs.com', full_name: 'Derek Wilson' },
    { email: 'a.martinez@cleanairlabs.com', full_name: 'Amy Martinez' },
    { email: 'b.anderson@safezone.io', full_name: 'Brian Anderson' },
    { email: 'j.taylor@safezone.io', full_name: 'Jessica Taylor' },
    { email: 'c.brown@westcoastabatement.com', full_name: 'Chris Brown' },
    { email: 'n.lee@westcoastabatement.com', full_name: 'Nancy Lee' },
    { email: 'p.harris@precisionenv.com', full_name: 'Paul Harris' },
    { email: 'e.clark@precisionenv.com', full_name: 'Emily Clark' },
    { email: 'm.lewis@soilsafe.com', full_name: 'Mark Lewis' },
    { email: 'h.walker@soilsafe.com', full_name: 'Helen Walker' },
    { email: 'g.robinson@airqualitypros.com', full_name: 'Gary Robinson' },
    { email: 't.young@airqualitypros.com', full_name: 'Tina Young' },
    { email: 'f.king@hazmatcert.com', full_name: 'Frank King' },
    { email: 'w.wright@hazmatcert.com', full_name: 'Wendy Wright' },
    { email: 'a.scott@leadfreeusa.com', full_name: 'Adam Scott' },
    { email: 'j.green@leadfreeusa.com', full_name: 'Julia Green' },
    { email: 'r.baker@masonenv.com', full_name: 'Ryan Baker' },
    { email: 'k.adams@masonenv.com', full_name: 'Karen Adams' },
    { email: 'd.campbell@campbellremediation.com', full_name: 'David Campbell' },
  ];
  contractors.forEach(u => users.push({ ...u, role: 'contractor' }));

  // 64 Clients (property owners, developers, HOAs, attorneys)
  const clients: Omit<SeedUser, 'role'>[] = [
    { email: 'a.whitfield@proton.me', full_name: 'Alexandra Whitfield' },
    { email: 'j.mercer@mercerestates.com', full_name: 'Jonathan Mercer' },
    { email: 'c.park@parkfamily.net', full_name: 'Catherine Park' },
    { email: 'd.park@parkfamily.net', full_name: 'David Park' },
    { email: 'r.harrington@harringtoniii.com', full_name: 'Robert Harrington III' },
    { email: 's.nakamura@outlook.com', full_name: 'Sofia Nakamura' },
    { email: 'oliver.grant@grantdev.com', full_name: 'Oliver Grant' },
    { email: 'isabella.vaughn@vaughnlaw.com', full_name: 'Isabella Vaughn' },
    { email: 'marcus.chen@chenproperties.com', full_name: 'Marcus Chen' },
    { email: 'diana.ross@rosscapital.com', full_name: 'Diana Ross-Mitchell' },
    { email: 'william.hayes@hayesgroup.com', full_name: 'William Hayes' },
    { email: 'emma.richardson@gmail.com', full_name: 'Emma Richardson' },
    { email: 'lucas.fernandez@fernandezhoa.org', full_name: 'Lucas Fernandez' },
    { email: 'charlotte.webb@webbarch.com', full_name: 'Charlotte Webb' },
    { email: 'henry.morrison@morrisondev.com', full_name: 'Henry Morrison' },
    { email: 'amelia.blackstone@icloud.com', full_name: 'Amelia Blackstone' },
    { email: 'ethan.cross@crossholdings.com', full_name: 'Ethan Cross' },
    { email: 'olivia.sterling@sterlinglaw.com', full_name: 'Olivia Sterling' },
    { email: 'noah.kim@kimventures.com', full_name: 'Noah Kim' },
    { email: 'ava.thornton@thorntonre.com', full_name: 'Ava Thornton' },
    { email: 'liam.patel@patelinvest.com', full_name: 'Liam Patel' },
    { email: 'sophia.russo@russofamily.com', full_name: 'Sophia Russo' },
    { email: 'james.ogawa@ogawagroup.com', full_name: 'James Ogawa' },
    { email: 'mia.delacroix@proton.me', full_name: 'Mia Delacroix' },
    { email: 'benjamin.cole@coleconstruction.com', full_name: 'Benjamin Cole' },
    { email: 'harper.ellis@ellislaw.com', full_name: 'Harper Ellis' },
    { email: 'elijah.brooks@brooksdev.com', full_name: 'Elijah Brooks' },
    { email: 'evelyn.wu@wurealty.com', full_name: 'Evelyn Wu' },
    { email: 'alexander.ford@fordestates.com', full_name: 'Alexander Ford' },
    { email: 'abigail.lane@laneconsulting.com', full_name: 'Abigail Lane' },
    { email: 'michael.santos@santoshoa.org', full_name: 'Michael Santos' },
    { email: 'emily.nguyen@nguyenpartners.com', full_name: 'Emily Nguyen' },
    { email: 'daniel.meyer@meyergroup.com', full_name: 'Daniel Meyer' },
    { email: 'elizabeth.carter@carterproperties.com', full_name: 'Elizabeth Carter' },
    { email: 'matthew.reid@reidventures.com', full_name: 'Matthew Reid' },
    { email: 'grace.hoffman@hoffmanlaw.com', full_name: 'Grace Hoffman' },
    { email: 'sebastian.tran@tranholdings.com', full_name: 'Sebastian Tran' },
    { email: 'chloe.baker@bakerfamilytrust.com', full_name: 'Chloe Baker' },
    { email: 'jack.murphy@murphydev.com', full_name: 'Jack Murphy' },
    { email: 'lily.chen@chenglobal.com', full_name: 'Lily Chen' },
    { email: 'owen.price@pricecapital.com', full_name: 'Owen Price' },
    { email: 'zoe.mitchell@mitchellre.com', full_name: 'Zoe Mitchell' },
    { email: 'samuel.walker@walkerhomes.com', full_name: 'Samuel Walker' },
    { email: 'natalie.green@greenarchitects.com', full_name: 'Natalie Green' },
    { email: 'ryan.shaw@shawdevelopment.com', full_name: 'Ryan Shaw' },
    { email: 'hannah.price@pricefamily.net', full_name: 'Hannah Price' },
    { email: 'andrew.stone@stoneproperties.com', full_name: 'Andrew Stone' },
    { email: 'aria.jones@jonespartners.com', full_name: 'Aria Jones' },
    { email: 'christopher.lee@leeinvest.com', full_name: 'Christopher Lee' },
    { email: 'scarlett.adams@adamsconsulting.com', full_name: 'Scarlett Adams' },
    { email: 'david.campbell@campbellre.com', full_name: 'David Campbell Jr.' },
    { email: 'victoria.hayes@hayesfoundation.org', full_name: 'Victoria Hayes' },
    { email: 'joseph.rivera@riveragroup.com', full_name: 'Joseph Rivera' },
    { email: 'madison.cooper@cooperdev.com', full_name: 'Madison Cooper' },
    { email: 'charles.bennett@bennettlaw.com', full_name: 'Charles Bennett' },
    { email: 'luna.reyes@reyesproperties.com', full_name: 'Luna Reyes' },
    { email: 'thomas.wright@wrightholdings.com', full_name: 'Thomas Wright' },
    { email: 'penelope.morgan@morganre.com', full_name: 'Penelope Morgan' },
    { email: 'jackson.hill@hillcapital.com', full_name: 'Jackson Hill' },
    { email: 'layla.phillips@phillipshoa.org', full_name: 'Layla Phillips' },
    { email: 'aiden.campbell@campbelltrust.com', full_name: 'Aiden Campbell' },
    { email: 'riley.diaz@diazfamilyre.com', full_name: 'Riley Diaz' },
    { email: 'gabriel.foster@fosterdev.com', full_name: 'Gabriel Foster' },
    { email: 'nora.kelly@kellyrealtygroup.com', full_name: 'Nora Kelly' },
  ];
  clients.forEach(u => users.push({ ...u, role: 'client' }));

  return users;
}

export async function POST(req: NextRequest) {
  /* Block in production */
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  const key = req.nextUrl.searchParams.get('key');
  if (key !== SEED_KEY) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const sb = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const users = generateUsers();
  const results = { created: 0, updated: 0, errors: [] as string[] };

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < users.length; i += 5) {
    const batch = users.slice(i, i + 5);
    await Promise.all(
      batch.map(async (user) => {
        try {
          // Check if user exists
          const { data: existingUsers } = await sb.auth.admin.listUsers({
            page: 1,
            perPage: 1,
          });
          
          // Search by email
          const { data: searchResult } = await sb.auth.admin.listUsers();
          const existing = searchResult?.users?.find(u => u.email === user.email);

          if (existing) {
            // Update existing user
            await sb.auth.admin.updateUserById(existing.id, {
              password: DEFAULT_PASSWORD,
              user_metadata: { full_name: user.full_name, role: user.role },
            });
            await sb.from('profiles').upsert(
              {
                id: existing.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                phone: user.phone || null,
              },
              { onConflict: 'id' }
            );
            results.updated++;
          } else {
            // Create new user
            const { data, error } = await sb.auth.admin.createUser({
              email: user.email,
              password: DEFAULT_PASSWORD,
              email_confirm: true,
              user_metadata: { full_name: user.full_name, role: user.role },
            });
            if (error) throw error;

            await sb.from('profiles').upsert(
              {
                id: data.user!.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                phone: user.phone || null,
              },
              { onConflict: 'id' }
            );
            results.created++;
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          results.errors.push(`${user.email}: ${msg}`);
        }
      })
    );
  }

  return NextResponse.json({
    success: true,
    total: users.length,
    distribution: {
      admin: users.filter(u => u.role === 'admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      contractor: users.filter(u => u.role === 'contractor').length,
      client: users.filter(u => u.role === 'client').length,
    },
    ...results,
    password: DEFAULT_PASSWORD,
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'POST /api/seed/users?key=jr-seed-2026 to seed 100 test users',
    roles: ['admin (3)', 'manager (8)', 'contractor (25)', 'client (64)'],
    password: 'All users get: JR-test-2026!',
  });
}
