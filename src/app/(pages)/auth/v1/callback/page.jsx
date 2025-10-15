"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleRedirect = async () => {
            router.replace("/dashboard");
        };
        handleRedirect();
    }, []);

	return <>
		<div className={cn("min-h-screen flex items-center justify-center")}> 
			<div 
				className={cn("flex items-center gap-2 text-sm text-muted-foreground")} 
				aria-live="polite" 
				aria-busy="true"
			>
				<Loader2 className={cn("w-4 h-4 animate-spin")} />
				<span>Logging in...</span>
			</div>
		</div>
	</>;
}
