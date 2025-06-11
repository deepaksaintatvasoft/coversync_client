import { Switch, Route } from "wouter";
import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";

// Lazy loaded components
const PolicyRetention = () => (
  <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
    {React.createElement(lazy(() => import("@/pages/policy-retention")))}
  </Suspense>
);

const ApiGateway = () => (
  <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
    {React.createElement(lazy(() => import("@/pages/api")))}
  </Suspense>
);

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Policies from "@/pages/policies";
import Clients from "@/pages/clients";
import PolicySignup from "@/pages/policy-signup";
import PolicySignupSimple from "@/pages/policy-signup-simple";
import PolicySignupFixed from "@/pages/policy-signup-fixed";
import Claims from "@/pages/claims";
import NewClaim from "@/pages/new-claim";
import ClaimDetails from "@/pages/claim-details";
import BadgeTest from "@/pages/badge-test";
import UnderwriterReport from "@/pages/underwriter-report";
import Users from "@/pages/users";
import AuditLogs from "@/pages/audit";
import Settings from "@/pages/settings";
import Agents from "@/pages/agents";
import Reports from "@/pages/reports";
import EmailSettings from "@/pages/email-settings";
import SmsServices from "@/pages/sms-services";
import TestUnderwriterEmail from "@/pages/test-underwriter-email";

function Router() {
  return (
    <Switch>
      {/* Main pages */}
      <Route path="/" component={Dashboard} />
      <Route path="/policies" component={Policies} />
      <Route path="/clients" component={Clients} />
      <Route path="/policy-signup" component={PolicySignupFixed} />
      <Route path="/policy-signup-simple" component={PolicySignupSimple} />
      <Route path="/policy-signup-full" component={PolicySignup} />
      <Route path="/claims" component={Claims} />
      <Route path="/claims/new" component={NewClaim} />
      <Route path="/claims/:id" component={ClaimDetails} />
      <Route path="/agents" component={Agents} />
      <Route path="/badge-test" component={BadgeTest} />
      <Route path="/underwriter-report" component={UnderwriterReport} />
      <Route path="/reports" component={Reports} />
      <Route path="/policy-retention" component={PolicyRetention} />
      
      {/* Admin routes */}
      <Route path="/users" component={Users} />
      <Route path="/audit" component={AuditLogs} />
      <Route path="/settings" component={Settings} />
      <Route path="/email-settings" component={EmailSettings} />
      <Route path="/sms-services" component={SmsServices} />
      <Route path="/api-gateway" component={ApiGateway} />
      <Route path="/test-underwriter-email" component={TestUnderwriterEmail} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
