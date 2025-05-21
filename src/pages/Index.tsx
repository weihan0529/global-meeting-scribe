
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const Index = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate("/dashboard");
    }, 1000);
  };

  const handleSocialSignIn = (provider: string) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: `${provider} sign-in successful!`,
        description: "You have successfully signed in.",
      });
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-white">
      <Header showLanguageToggle={false} />
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/b89c5324-4f8c-41b5-8773-d90385700b53.png" 
                alt="Unisono Logo" 
                className="h-16 w-16" 
              />
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">Unisono</h1>
            <p className="text-muted-foreground">
              AI-powered multilingual meeting assistant
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <form onSubmit={handleSignIn}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="password">Password</Label>
                      <a
                        href="#"
                        className="text-sm text-primary hover:text-primary-dark"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </div>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-2 text-xs text-muted-foreground">
                      OR CONTINUE WITH
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSocialSignIn("Google")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialSignIn("Microsoft")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Microsoft
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <div className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a
                  href="#"
                  className="text-primary hover:text-primary-dark font-medium"
                >
                  Sign up
                </a>
              </div>
            </CardFooter>
          </Card>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-foreground">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
