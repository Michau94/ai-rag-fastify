// plugins/supabase.ts

import fp from "fastify-plugin";
import { createClient } from "@supabase/supabase-js";

export default fp(async (fastify) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  fastify.decorate("supabase", supabase);
});
