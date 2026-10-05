import { Route, Switch, useLocation } from "wouter";
import { Provider } from "./components/provider";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import { ProtectedRoute } from "./components/protected-route";
import { AppShell } from "./components/shell/app-shell";
import LandingPage from "./pages/index";
import SignInPage from "./pages/sign-in";
import SignUpPage from "./pages/sign-up";
import NotFoundPage from "./pages/not-found";
import DashboardPage from "./pages/app/dashboard";
import ClientsPage from "./pages/app/clients";
import ClientDetailPage from "./pages/app/client-detail";
import PipelinePage from "./pages/app/pipeline";
import ProjectsPage from "./pages/app/projects";
import ProjectDetailPage from "./pages/app/project-detail";
import TasksPage from "./pages/app/tasks";
import InvoicesPage from "./pages/app/invoices";
import InvoiceDetailPage from "./pages/app/invoice-detail";
import MeetingsPage from "./pages/app/meetings";
import FilesPage from "./pages/app/files";
import ReportsPage from "./pages/app/reports";
import TeamPage from "./pages/app/team";
import SettingsPage from "./pages/app/settings";
import HelpPage from "./pages/app/help";

/** Protected workspace: one persistent shell, routes swap inside it. */
function AppArea() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Switch>
          <Route path="/app" component={DashboardPage} />
          <Route path="/app/clients" component={ClientsPage} />
          <Route path="/app/clients/:id" component={ClientDetailPage} />
          <Route path="/app/pipeline" component={PipelinePage} />
          <Route path="/app/projects" component={ProjectsPage} />
          <Route path="/app/projects/:id" component={ProjectDetailPage} />
          <Route path="/app/tasks" component={TasksPage} />
          <Route path="/app/invoices" component={InvoicesPage} />
          <Route path="/app/invoices/:id" component={InvoiceDetailPage} />
          <Route path="/app/meetings" component={MeetingsPage} />
          <Route path="/app/files" component={FilesPage} />
          <Route path="/app/reports" component={ReportsPage} />
          <Route path="/app/team" component={TeamPage} />
          <Route path="/app/settings" component={SettingsPage} />
          <Route path="/app/help" component={HelpPage} />
          <Route component={NotFoundPage} />
        </Switch>
      </AppShell>
    </ProtectedRoute>
  );
}

function Routes() {
  const [location] = useLocation();
  const inApp = location === "/app" || location.startsWith("/app/");
  if (inApp) return <AppArea />;
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in" component={SignInPage} />
      <Route path="/sign-up" component={SignUpPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    <Provider>
      <Routes />
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
