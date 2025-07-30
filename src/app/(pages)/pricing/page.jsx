"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Zap } from "lucide-react";

// A reusable checkmark icon component
const CheckIcon = ({ className }) => (
  <svg
    className={`h-6 w-6 ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="2"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

// Animation variants for the container to stagger children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

// Animation variants for individual cards
const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

export default function PaymentsPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "For individuals getting started.",
      features: [
        "Up to 7 quizzes per month",
        "Up to 10 questions per quiz",
        "Basic analytics",
      ],
      isPopular: false,
      buttonText: "Your Current Plan",
      buttonVariant: "outline",
    },
    {
      name: "Premium",
      price: "$10",
      description: "For professionals who need more.",
      features: [
        "Unlimited quizzes",
        "Unlimited questions per quiz",
        "Advanced analytics & reports",
        "Priority support",
        "Export results to CSV/PDF",
      ],
      isPopular: true,
      buttonText: "Upgrade to Premium",
      buttonVariant: "default",
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:py-14">
        {/* Header Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
            Pricing Plans
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Choose the plan that's right for you.
          </p>
        </motion.div>

        {/* Pricing Cards Section */}
        <motion.div
          className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-end"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {plans.map((plan) => (
            <motion.div key={plan.name} variants={cardVariants} className="h-full">
              <Card
                className={`relative flex flex-col h-full rounded-2xl shadow-lg ${
                  plan.isPopular ? "border-primary border-2" : ""
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 -translate-y-1/2 transform w-full flex justify-center">
                      <div className="bg-primary text-primary-foreground px-4 py-1.5 text-sm font-semibold tracking-wide rounded-full shadow-md">
                        Most Popular
                      </div>
                  </div>
                )}
                <CardHeader className="pt-12">
                  <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <p className="text-5xl font-bold tracking-tight">
                      {plan.price}
                      <span className="text-xl font-semibold text-muted-foreground">/mo</span>
                    </p>
                  </div>
                   <CardDescription className="mt-2">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow border-t pt-6">
                  <ul role="list" className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0">
                          <CheckIcon className={plan.isPopular ? "text-green-500" : "text-muted-foreground"} />
                        </div>
                        <p className="ml-3 text-base">{feature}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full text-lg py-6"
                    variant={plan.buttonVariant}
                    disabled={plan.name === 'Free'}
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
