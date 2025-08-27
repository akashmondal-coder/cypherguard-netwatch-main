-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devices table for network device tracking
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  mac_address TEXT,
  hostname TEXT,
  device_type TEXT DEFAULT 'unknown',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_blocked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dns_logs table for DNS query tracking
CREATE TABLE public.dns_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  query_type TEXT DEFAULT 'A',
  response_code INTEGER,
  is_blocked BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_logs table for user activity tracking
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info',
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_alerts table for security incidents
CREATE TABLE public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked_domains table for domain blocking management
CREATE TABLE public.blocked_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dns_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_domains ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for devices
CREATE POLICY "Users can view their own devices" ON public.devices
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devices" ON public.devices
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices" ON public.devices
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices" ON public.devices
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for dns_logs
CREATE POLICY "Users can view their own DNS logs" ON public.dns_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DNS logs" ON public.dns_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for activity_logs
CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for security_alerts
CREATE POLICY "Users can view their own security alerts" ON public.security_alerts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security alerts" ON public.security_alerts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security alerts" ON public.security_alerts
FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for blocked_domains
CREATE POLICY "Users can view their own blocked domains" ON public.blocked_domains
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blocked domains" ON public.blocked_domains
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blocked domains" ON public.blocked_domains
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocked domains" ON public.blocked_domains
FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_ip_address ON public.devices(ip_address);
CREATE INDEX idx_dns_logs_user_id ON public.dns_logs(user_id);
CREATE INDEX idx_dns_logs_domain ON public.dns_logs(domain);
CREATE INDEX idx_dns_logs_timestamp ON public.dns_logs(timestamp);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON public.activity_logs(timestamp);
CREATE INDEX idx_security_alerts_user_id ON public.security_alerts(user_id);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX idx_blocked_domains_user_id ON public.blocked_domains(user_id);