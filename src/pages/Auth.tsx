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
import { GraduationCap, UserCircle } from "lucide-react";

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
          description: "Welcome to LearnFlix Plus",
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">LearnFlix Plus</CardTitle>
          <CardDescription>Your gateway to quality education</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
            
            <TabsContent value="signin">
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
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                </div>
                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <RadioGroup value={role} onValueChange={(value: "student" | "teacher") => setRole(value)}>
                    <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 cursor-pointer">
                      <RadioGroupItem value="student" id="student" />
                      <Label htmlFor="student" className="flex items-center gap-2 cursor-pointer flex-1">
                        <UserCircle className="h-5 w-5" />
                        Student
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 cursor-pointer">
                      <RadioGroupItem value="teacher" id="teacher" />
                      <Label htmlFor="teacher" className="flex items-center gap-2 cursor-pointer flex-1">
                        <GraduationCap className="h-5 w-5" />
                        Teacher
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                
                {role === "teacher" && (
                  <div className="space-y-2">
                    <Label htmlFor="invite-code">Teacher Invite Code</Label>
                    <Input
                      id="invite-code"
                      type="text"
                      placeholder="Enter invite code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
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
                <div>
                  <Label htmlFor="admin-username">Username</Label>
                  <Input
                    id="admin-username"
                    name="username"
                    type="text"
                    placeholder="admin"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password">Password</Label>
                  <Input
                    id="admin-password"
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
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