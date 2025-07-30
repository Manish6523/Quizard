"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Share2,
  BarChart3,
  Quote,
  ArrowRightCircle,
} from "lucide-react";
import Link from "next/link";

// Main Page Component
export default function HomePage() {
  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-40">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={featureVariants}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div className="text-center md:text-left">
              <motion.h1
                variants={featureVariants}
                className="text-4xl md:text-6xl font-extrabold tracking-tighter"
              >
                Craft Perfect Quizzes with the Power of AI
              </motion.h1>
              <motion.p
                variants={featureVariants}
                className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0"
              >
                Stop spending hours on assessments. With Quizard, generate,
                customize, and deploy engaging quizzes in minutes, not days.
              </motion.p>
              <motion.div
                variants={featureVariants}
                className="mt-8 flex flex-col sm:flex-row justify-center md:justify-start gap-4"
              >
                <Link href="/dashboard/quizzes/new">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Start Creating Now <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  See a Demo
                </Button>
              </motion.div>
            </div>
            <motion.div
              variants={featureVariants}
              className="relative w-full h-80 bg-card rounded-xl border p-4 shadow-lg"
            >
              <div className="absolute top-4 left-4 flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="mt-8 p-4 bg-secondary rounded-md">
                <p className="text-sm font-mono text-muted-foreground">
                  // Your AI Prompt...
                </p>
                <p className="text-sm font-mono mt-2">
                  Create a 10-question quiz about the solar system for 5th
                  graders.
                </p>
              </div>
              <Sparkles className="absolute bottom-6 right-6 w-12 h-12 text-primary/30" />
            </motion.div>
          </motion.div>
        </section>

        {/* Feature Showcase Section */}
        <section id="features" className="py-20 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold">
                A toolkit built for impact
              </h2>
              <p className="mt-4 text-muted-foreground">
                Quizard is more than just a quiz maker. It's an all-in-one
                platform to enhance your teaching workflow and student
                engagement.
              </p>
            </div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={featureVariants}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16"
            >
              {[
                {
                  icon: Sparkles,
                  title: "Instant AI Generation",
                  desc: "Turn any topic or document into a ready-to-use quiz instantly.",
                },
                {
                  icon: Share2,
                  title: "One-Click Sharing",
                  desc: "Distribute your quizzes with a single, secure link. No logins required for students.",
                },
                {
                  icon: BarChart3,
                  title: "Insightful Analytics",
                  desc: "Go beyond scores with detailed reports on question and student performance.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  variants={featureVariants}
                  className="p-6 bg-card rounded-xl border"
                >
                  <feature.icon className="w-10 h-10 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4 text-center">
            <Quote className="w-16 h-16 text-primary/20 mx-auto" />
            <blockquote className="mt-6 max-w-4xl mx-auto text-2xl md:text-3xl font-medium">
              "Quizard has fundamentally changed how I prepare for my classes.
              What used to take a whole evening now takes less than ten minutes.
              The analytics are a game-changer."
            </blockquote>
            <div className="mt-8">
              <p className="font-semibold">
                Sarah L., High School Science Teacher
              </p>
              <p className="text-muted-foreground">New York, USA</p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="bg-primary text-primary-foreground rounded-2xl p-7 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Revolutionize Your Assessments?
              </h2>
              <p className="mt-4 max-w-xl mx-auto">
                Join thousands of educators who are saving time and creating
                more effective learning experiences.
              </p>
              <button className="mt-8 flex flex-wrap items-center cursor-pointer gap-2 justify-center mx-auto bg-secondary text-primary p-3 px-6 rounded-lg hover:bg-secondary/80 transition-colors">
                Sign Up and Create Your First Quiz
                <ArrowRightCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
