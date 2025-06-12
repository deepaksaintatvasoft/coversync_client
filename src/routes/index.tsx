import { Switch, Route } from "wouter";
import React, { lazy, Suspense } from "react";

// Lazy loaded components
const PolicyRetention = () => (
  <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
    {React.createElement(lazy(() => import("@/features/data/pages/policy-retention")))}
  </Suspense>
);

const ApiGateway = () => (
  <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>}>
    {React.createElement(lazy(() => import("@/features/data/pages/api")))}
  </Suspense>
);

import NotFound from "@/features/data/pages/not-found";
import Dashboard from "@/features/data/pages/dashboard";
import Policies from "@/features/data/pages/policies";
import Clients from "@/features/data/pages/clients";
import PolicySignup from "@/features/data/pages/policy-signup";
import PolicySignupSimple from "@/features/data/pages/policy-signup-simple";
import PolicySignupFixed from "@/features/data/pages/policy-signup-fixed";
import Claims from "@/features/data/pages/claims";
import NewClaim from "@/features/data/pages/new-claim";
import ClaimDetails from "@/features/data/pages/claim-details";
import BadgeTest from "@/features/data/pages/badge-test";
import UnderwriterReport from "@/features/data/pages/underwriter-report";
import Users from "@/features/data/pages/users";
import AuditLogs from "@/features/data/pages/audit";
import Settings from "@/features/data/pages/settings";
import Agents from "@/features/data/pages/agents";
import Reports from "@/features/data/pages/reports";
import EmailSettings from "@/features/data/pages/email-settings";
import SmsServices from "@/features/data/pages/sms-services";
import TestUnderwriterEmail from "@/features/data/pages/test-underwriter-email";

export function AppRouter() {
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