import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { auth } from "./auth";
import { account } from "./routes/account";
import { clients } from "./routes/clients";
import { dashboard } from "./routes/dashboard";
import { files } from "./routes/files";
import { invoices } from "./routes/invoices";
import { leads } from "./routes/leads";
import { meetings } from "./routes/meetings";
import { notifications } from "./routes/notifications";
import { ping } from "./routes/ping";
import { projects } from "./routes/projects";
import { reports } from "./routes/reports";
import { search } from "./routes/search";
import { tasks } from "./routes/tasks";
import { team } from "./routes/team";
import { upload } from "./routes/upload";

export const router = {
  ping,
  account,
  clients,
  leads,
  projects,
  tasks,
  invoices,
  meetings,
  files,
  upload,
  dashboard,
  reports,
  team,
  notifications,
  search,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

// Better Auth handles its own HTTP surface (email/password sessions).
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export default app;
