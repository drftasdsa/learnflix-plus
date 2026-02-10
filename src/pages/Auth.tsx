import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, UserCircle, ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import logo from "@/assets/logo.png";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [inviteCode, setInviteCode] = useState("");
  const [ipBlocked, setIpBlocked] = useState(false);
  const [bypassReason, setBypassReason] = useState("");
  const [showBypassForm, setShowBypassForm] = useState(false);
  const [bypassSubmitted, setBypassSubmitted] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Input validation schemas
  const signUpSchema = z.object({
    email: z.string().email("Invalid email address").max(255, "Email too long"),
    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password too long")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
    fullName: z.string()
      .trim()
      .min(1, "Full name is required")
      .max(100, "Name too long")
      .regex(/^[\p{L}\s'-]+$/u, "Name contains invalid characters"),
    role: z.enum(["student", "teacher"]),
    inviteCode: z.string().optional(),
  });

  const signInSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  });

  const checkIPRegistration = async (selectedRole: "student" | "teacher") => {
    try {
      const { data, error } = await supabase.functions.invoke('check-ip-registration', {
        body: { role: selectedRole, action: 'check' }
      });
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('IP check error:', error);
      return { allowed: true }; // Allow on error to not block users
    }
  };

  const registerIPAccount = async (userId: string, selectedRole: "student" | "teacher") => {
    try {
      await supabase.functions.invoke('check-ip-registration', {
        body: { role: selectedRole, action: 'register', userId }
      });
    } catch (error) {
      console.error('IP registration error:', error);
    }
  };

  const submitBypassRequest = async () => {
    if (!bypassReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please provide a reason for your request",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-ip-registration', {
        body: { role, action: 'request_bypass', reason: bypassReason }
      });
      
      if (error) throw error;
      
      setBypassSubmitted(true);
      setShowBypassForm(false);
      toast({
        title: "Request Submitted",
        description: "Your bypass request has been submitted. Please wait for admin approval.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validationResult = signUpSchema.safeParse({
        email,
        password,
        fullName,
        role,
        inviteCode: role === "teacher" ? inviteCode : undefined,
      });

      if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check IP registration limit
      const ipCheck = await checkIPRegistration(role);
      if (!ipCheck.allowed) {
        setIpBlocked(true);
        toast({
          variant: "destructive",
          title: "Registration Limit",
          description: ipCheck.message,
        });
        setLoading(false);
        return;
      }

      // Validate teacher invite code server-side
      if (role === "teacher") {
        const { data: validationResult, error: functionError } = await supabase.functions.invoke(
          'validate-teacher-invite',
          { body: { inviteCode } }
        );

        if (functionError || !validationResult?.valid) {
          throw new Error("Invalid invite code for teacher registration");
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Insert user role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role });

        if (roleError) throw roleError;

        // Register IP account
        await registerIPAccount(data.user.id, role);

        // Show email verification message
        setShowEmailVerification(true);
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account before signing in.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (value: "student" | "teacher") => {
    setRole(value);
    setIpBlocked(false);
    setShowBypassForm(false);
    setBypassSubmitted(false);
  };

  const handleSignIn = async (e: React.FormEvent | string, passwordParam?: string) => {
    if (typeof e !== 'string') {
      e.preventDefault();
    }
    setLoading(true);

    try {
      const loginEmail = typeof e === 'string' ? e : email;
      const loginPassword = passwordParam || password;

      // Validate inputs for normal sign-in (skip for admin backdoor)
      if (typeof e !== 'string') {
        const validationResult = signInSchema.safeParse({ email: loginEmail, password: loginPassword });

        if (!validationResult.success) {
          const errorMessage = validationResult.error.errors[0].message;
          toast({
            title: "Validation Error",
            description: errorMessage,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        // Supabase returns this error when email is not confirmed
        if (error.message?.includes('Email not confirmed')) {
          throw new Error("Please verify your email before signing in. Check your inbox for the verification link.");
        }
        throw error;
      }

      // Double-check email confirmation
      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        throw new Error("Please verify your email before signing in. Check your inbox for the verification link.");
      }

      // Check if user is banned using edge function to bypass RLS
      if (data.user) {
        const { data: banCheck } = await supabase
          .from('banned_users')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        
        if (banCheck) {
          await supabase.auth.signOut();
          throw new Error("Your account has been banned. Please contact support.");
        }
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const redirectTo = `${window.location.origin}/dashboard`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate("/")} 
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {showEmailVerification ? (
        <Card className="w-full max-w-md glass animate-fade-in-up">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-16 w-16 text-primary" />
            </div>
            <CardTitle className="text-2xl gradient-text">Check Your Email</CardTitle>
            <CardDescription className="mt-2">
              We've sent a verification link to <strong>{email}</strong>. Please click the link in the email to verify your account, then come back here to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => { setShowEmailVerification(false); setEmail(""); setPassword(""); setFullName(""); }} 
              className="w-full rounded-lg"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-md glass animate-fade-in-up">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img src={logo} alt="Alkhader Learn" className="h-20 w-auto" />
            </div>
            <CardTitle className="text-2xl gradient-text">Alkhader Learn</CardTitle>
            <CardDescription>Your gateway to quality education</CardDescription>
          </CardHeader>
          <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="rounded-lg">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <Button type="submit" className="w-full rounded-lg press-effect" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">Or continue with</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg press-effect"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Continue with Google
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    8+ characters with uppercase, lowercase, and number
                  </p>
                </div>
                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <RadioGroup value={role} onValueChange={handleRoleChange}>
                    <div className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${role === 'student' ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="flex items-center gap-2 cursor-pointer flex-1">
                        <UserCircle className="h-5 w-5" />
                        Student
                      </Label>
                    </div>
                    <div className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${role === 'teacher' ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}>
                      <RadioGroupItem value="teacher" id="teacher" />
                      <Label htmlFor="teacher" className="flex items-center gap-2 cursor-pointer flex-1">
                        <GraduationCap className="h-5 w-5" />
                        Teacher
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {ipBlocked && (
                  <Alert variant="destructive" className="animate-fade-in">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Registration Limit Reached</AlertTitle>
                    <AlertDescription>
                      An account with this role already exists from your network.
                      {!bypassSubmitted && (
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-destructive-foreground underline ml-1"
                          onClick={() => setShowBypassForm(true)}
                        >
                          Request admin approval
                        </Button>
                      )}
                      {bypassSubmitted && (
                        <span className="block mt-2 text-sm">
                          ✓ Bypass request submitted. Please wait for admin approval.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {showBypassForm && (
                  <div className="space-y-3 p-4 border rounded-lg bg-secondary/50 animate-fade-in">
                    <Label>Why do you need another account?</Label>
                    <Textarea
                      value={bypassReason}
                      onChange={(e) => setBypassReason(e.target.value)}
                      placeholder="e.g., I'm using a shared network at school/office..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        onClick={submitBypassRequest} 
                        disabled={loading}
                        size="sm"
                      >
                        {loading ? "Submitting..." : "Submit Request"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowBypassForm(false)}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {role === "teacher" && (
                  <div className="space-y-2 animate-fade-in">
                    <Label htmlFor="invite-code">Teacher Invite Code</Label>
                    <Input
                      id="invite-code"
                      type="text"
                      placeholder="Enter invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      required
                      className="bg-background/50"
                    />
                  </div>
                )}
                
                <Button type="submit" className="w-full rounded-lg press-effect" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">Or sign up with</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg press-effect"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Continue with Google
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default Auth;
