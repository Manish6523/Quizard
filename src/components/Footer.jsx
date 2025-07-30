'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
const pathname = usePathname();
// Check if the current path is the dashboard
const isDashboard = pathname.startsWith('/dashboard/quizzes');
// If on the dashboard, do not render the footer
if (isDashboard) {
    return null;
}

    return (
        <footer className="border-t bg-background">
            <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 py-12 px-4">
                {/* Product Column */}
                <div>
                    <h3 className="font-semibold mb-4 text-foreground">Product</h3>
                    <nav className="flex flex-col gap-3">
                        <Link href="#features" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Features</Link>
                        <Link href="#pricing" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Pricing</Link>
                        <Link href="#testimonials" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Testimonials</Link>
                    </nav>
                </div>
                {/* Company Column */}
                <div>
                    <h3 className="font-semibold mb-4 text-foreground">Company</h3>
                    <nav className="flex flex-col gap-3">
                        <Link href="/about" className="text-muted-foreground hover:text-foreground text-sm transition-colors">About</Link>
                        <Link href="/contact" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Contact</Link>
                        <Link href="/blog" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Blog</Link>
                    </nav>
                </div>
                {/* Resources Column */}
                <div>
                    <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
                    <nav className="flex flex-col gap-3">
                        <Link href="/help" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Help Center</Link>
                        <Link href="/support" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Support</Link>
                        <Link href="/api-docs" className="text-muted-foreground hover:text-foreground text-sm transition-colors">API Docs</Link>
                    </nav>
                </div>
                {/* Legal Column */}
                <div>
                    <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
                    <nav className="flex flex-col gap-3">
                        <Link href="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Terms of Service</Link>
                    </nav>
                </div>
            </div>
            {/* Bottom Bar */}
            <div className="border-t">
                <p className="container mx-auto py-6 px-4 text-center text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Quizard. All rights reserved.</p>
            </div>
        </footer>
    )
}