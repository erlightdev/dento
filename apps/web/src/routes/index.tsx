import { Button } from "@Dento/ui/components/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Shield, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/")({
	component: HomeComponent,
});

function HomeComponent() {
	return (
		<div className="relative">
			<HeroSection />
			<FeaturesSection />
		</div>
	);
}

function HeroSection() {
	return (
		<section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden px-4 pt-32 pb-12 sm:pt-40">
			{/* Organic blob shapes */}
			<div className="pointer-events-none absolute inset-0">
				<div className="microbe-blob-1 absolute -top-32 -left-32 size-[500px] rounded-full bg-primary/15 blur-3xl" />
				<div className="microbe-blob-2 absolute -right-24 bottom-0 size-[400px] rounded-full bg-accent/10 blur-3xl" />
				<div className="microbe-blob-3 absolute top-1/3 right-1/4 size-[250px] rounded-full bg-primary/8 blur-2xl" />
			</div>

			{/* Dot grid pattern */}
			<div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.04]">
				<div
					className="size-full"
					style={{
						backgroundImage:
							"radial-gradient(circle, currentColor 1px, transparent 1px)",
						backgroundSize: "24px 24px",
					}}
				/>
			</div>

			{/* Floating microbe elements */}
			<div className="pointer-events-none absolute inset-0">
				<div className="microbe-float-1 absolute top-[15%] left-[10%] size-2 rounded-full bg-primary/30" />
				<div className="microbe-float-2 absolute top-[25%] right-[15%] size-1.5 rounded-full bg-accent/40" />
				<div className="microbe-float-3 absolute bottom-[30%] left-[20%] size-2.5 rounded-full bg-primary/20" />
				<div className="microbe-float-4 absolute top-[60%] right-[10%] size-1.5 rounded-full bg-primary/25" />
				<div className="microbe-float-5 absolute top-[40%] left-[60%] size-1 rounded-full bg-accent/30" />
				<div className="microbe-float-1 absolute right-[30%] bottom-[20%] size-2 rounded-full bg-primary/15" />
				<div className="microbe-float-3 absolute top-[70%] left-[35%] size-1.5 rounded-full bg-accent/20" />
			</div>

			{/* Ring accents */}
			<div className="pointer-events-none absolute top-24 right-[20%] size-20 rounded-full ring-1 ring-primary/10" />
			<div className="pointer-events-none absolute bottom-32 left-[15%] size-14 rounded-full ring-1 ring-accent/10" />
			<div className="pointer-events-none absolute top-[45%] right-[8%] size-8 rounded-full ring-1 ring-primary/8" />

			{/* Cross/plus marks */}
			<div className="pointer-events-none absolute top-[20%] right-[35%] font-light text-primary/15 text-xs">
				+
			</div>
			<div className="pointer-events-none absolute bottom-[25%] left-[40%] font-light text-accent/10 text-lg">
				+
			</div>

			{/* Hero content */}
			<div className="relative z-10 mx-auto max-w-3xl text-center">
				<div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 font-medium text-muted-foreground text-xs ring-1 ring-border/40 backdrop-blur-sm">
					<Sparkles className="size-3 text-primary" />
					Modern dental practice management
				</div>

				<h1 className="mb-6 text-pretty font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
					Manage your clinic
					<br />
					<span className="text-primary">with confidence</span>
				</h1>

				<p className="mx-auto mb-10 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
					Appointments, patient records, billing & more. Everything your dental
					practice needs, in one place.
				</p>

			
			</div>
		</section>
	);
}

function FeaturesSection() {
	const features = [
		{
			icon: Clock,
			title: "Smart Scheduling",
			description:
				"Book and manage appointments with an intuitive calendar interface.",
		},
		{
			icon: Users,
			title: "Patient Records",
			description:
				"Complete patient history, medical records, and prescriptions at your fingertips.",
		},
		{
			icon: Shield,
			title: "Secure & Private",
			description:
				"Role-based access control ensures data is only visible to authorized staff.",
		},
	];

	return (
		<section className="relative px-4 pb-20">
			<div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
				{features.map((feature) => (
					<div
						key={feature.title}
						className="group rounded-xl bg-card/50 p-6 ring-1 ring-border/40 backdrop-blur-sm transition-colors hover:bg-card hover:ring-border"
					>
						<div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/15">
							<feature.icon className="size-5" />
						</div>
						<h3 className="mb-2 font-semibold">{feature.title}</h3>
						<p className="text-muted-foreground text-sm">
							{feature.description}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
