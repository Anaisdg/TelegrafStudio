import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TelegrafConfigProvider } from "@/hooks/TelegrafContext";
import TelegrafConfigurator from "@/pages/TelegrafConfigurator";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={TelegrafConfigurator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TelegrafConfigProvider>
        <Router />
        <Toaster />
      </TelegrafConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
