import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DNSLogging from "./pages/DNSLogging";
import DeviceDiscovery from "./pages/DeviceDiscovery";
import RealTimeMonitoring from "./pages/RealTimeMonitoring";
import AutomatedBlocking from "./pages/AutomatedBlocking";
import SmartAlerts from "./pages/SmartAlerts";
import RemoteControl from "./pages/RemoteControl";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dns-logging" element={<DNSLogging />} />
        <Route path="/device-discovery" element={<DeviceDiscovery />} />
        <Route path="/real-time-monitoring" element={<RealTimeMonitoring />} />
        <Route path="/automated-blocking" element={<AutomatedBlocking />} />
        <Route path="/smart-alerts" element={<SmartAlerts />} />
        <Route path="/remote-control" element={<RemoteControl />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
