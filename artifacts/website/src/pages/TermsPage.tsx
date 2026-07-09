import LegalPage from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms and Disclaimer"
      intro="These Terms explain responsible use of Crunchtime Fitness Training and set expectations for fitness coaching, user content, and third-party services."
    >
      <p>
        <strong>Last updated:</strong> [Add date]
      </p>
      <h2>Use of App</h2>
      <p>
        Crunchtime Fitness Training is provided for fitness coaching, training organization,
        wellness support, bookings, progress tracking, communication, video submissions, and related
        client-trainer workflows. Users agree to use the app lawfully and responsibly.
      </p>

      <h2>Fitness Responsibility</h2>
      <p>
        Users are responsible for exercising safely, choosing appropriate intensity, stopping if they
        feel pain, dizziness, or discomfort, and seeking professional help when needed.
      </p>

      <h2>No Medical Advice</h2>
      <p>
        The app is not a medical product and does not provide diagnosis, treatment, or medical
        advice. Fitness, meal plan, BMI, and progress information is for coaching and wellness
        support only. Consult a qualified healthcare professional before starting or changing a
        fitness or nutrition program.
      </p>

      <h2>User-Generated Video and Content Responsibility</h2>
      <p>
        Users are responsible for videos, messages, notes, and other content they submit. Users
        should not upload content they do not have the right to share or content that is unsafe,
        unlawful, abusive, or unrelated to coaching.
      </p>

      <h2>Account Security</h2>
      <p>
        Users are responsible for maintaining the confidentiality of their account credentials and
        for activity that occurs under their account.
      </p>

      <h2>Trainer Communication</h2>
      <p>
        Trainer feedback is intended to support fitness coaching and should be considered within each
        user's personal ability, health status, and safety needs.
      </p>

      <h2>Third-Party Services</h2>
      <p>
        The app may use third-party services such as Supabase for authentication, database, and
        storage, and Agora for live video calls. These services may have their own terms, policies,
        uptime, and technical limitations.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by applicable law, Crunchtime Fitness Training and related
        providers are not liable for injuries, losses, damages, service interruptions, or decisions
        made based on app content or coaching communication.
      </p>

      <h2>Updates to Terms</h2>
      <p>
        These Terms may be updated from time to time. Continued use of the app after updates means
        users accept the revised Terms.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these Terms, contact [support@crunchtimefitness.example].
      </p>
    </LegalPage>
  );
}
