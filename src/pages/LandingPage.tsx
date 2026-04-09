import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { GraduationCap, Globe, Users, BookOpen } from "lucide-react";
import Logo from "@/components/Logo";
import FeaturedScholarships from "@/components/scholarships/FeaturedScholarships";
import LetterVerification from "@/components/LetterVerification";
export default function LandingPage() {
  return <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild className="bg-gradient-primary hover:shadow-glow">
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }} className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent-gold bg-clip-text text-transparent">
              NAMA Uni-Scholarship
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Empowering global learners to connect with leading universities and scholarships across Asia, Africa, and
              Europe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gradient-primary hover:shadow-glow">
                <Link to="/register">Start Your Journey</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Already have an account?</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2
        }} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Uni-Scholarship?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our platform connects ambitious students with verified universities and scholarships through intelligent
              matching and a streamlined application process.
            </p>
          </motion.div>

          <div className="dashboard-grid">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.3
          }}>
              <Card className="university-card">
                <CardHeader>
                  <Globe className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>End-to-End Guidance</CardTitle>
                  <CardDescription>
                    From application to approval, track your progress, receive updates, and download your official
                    reference letter — all in one seamless platform.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.4
          }}>
              <Card className="university-card">
                <CardHeader>
                  <GraduationCap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Smart Matching</CardTitle>
                  <CardDescription>
                    Our intelligent system connects you to universities and scholarships that fit your study goals,
                    qualifications, and financial needs.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.5
          }}>
              <Card className="university-card">
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Verified Opportunities</CardTitle>
                  <CardDescription>
                    Every listed university and scholarship is reviewed and approved through NAMA Foundation’s trusted
                    network. Ensuring authenticity and reliability.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Scholarships Section */}
      <FeaturedScholarships />

      {/* Verification Section */}
      <LetterVerification />

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <Logo size={32} />
          <div className="mt-4 space-y-2">
            <div>
              
            </div>
            <p>© 2025 NAMA Foundation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>;
}