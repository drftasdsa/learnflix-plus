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
import { GraduationCap, UserCircle, ArrowLeft, Mail } from "lucide-react";
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

        toast({
          title: "Account created!",
          description: "Welcome to Alkhader Learn",
        });
        navigate("/");
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

      if (error) throw error;

      // Check if user is banned
      if (data.user) {
        const { data: isBanned } = await supabase.rpc('is_user_banned', { user_id: data.user.id });
        
        if (isBanned) {
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
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="signin" className="rounded-lg">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">Sign Up</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg">Admin</TabsTrigger>
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
                  <RadioGroup value={role} onValueChange={(value: "student" | "teacher") => setRole(value)}>
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

            <TabsContent value="admin" className="space-y-4">
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const formData = new FormData(e.currentTarget);
                const username = formData.get("username") as string;
                const adminPassword = formData.get("password") as string;

                if (username === "admin" && adminPassword === "147258") {
                  try {
                    await handleSignIn("admin@learnflix.com", "147258admin147258");
                  } catch (error: any) {
                    toast({
                      variant: "destructive",
                      title: "Admin login failed",
                      description: error.message,
                    });
                  }
                } else {
                  toast({
                    variant: "destructive",
                    title: "Invalid credentials",
                    description: "Invalid username or password",
                  });
                }
                setLoading(false);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-username">Username</Label>
                  <Input
                    id="admin-username"
                    name="username"
                    type="text"
                    placeholder="admin"
                    required
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    required
                    className="bg-background/50"
                  />
                </div>
                <Button type="submit" className="w-full rounded-lg press-effect" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In as Admin"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
