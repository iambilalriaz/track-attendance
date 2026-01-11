import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { checkOnboardingStatus } from "@/lib/db/user-settings";

export default async function Home() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has completed onboarding
  const onboardingCompleted = await checkOnboardingStatus(session.user.id);

  if (!onboardingCompleted) {
    // New user - redirect to settings for onboarding
    redirect("/settings");
  }

  // Existing user - redirect to dashboard
  redirect("/dashboard");
}
